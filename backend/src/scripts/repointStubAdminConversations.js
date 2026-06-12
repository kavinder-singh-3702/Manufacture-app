/**
 * One-time migration: repoint every ChatConversation that contains the
 * legacy stub admin id ("000000000000000000000001") onto a REAL admin user.
 *
 * Background: the frontend constant SUPPORT_ADMIN_ID was a placeholder
 * ObjectId that never matched any real user. As a result:
 *  - markRead never worked for the admin viewing those threads (their real
 *    id wasn't in participants).
 *  - When the admin started a NEW conversation with the same user from
 *    AdminUserDetailScreen, getOrCreateConversation produced a SEPARATE
 *    conversation under (realAdminId, userId), leaving admin's messages
 *    invisible to the user (the user only sees the stub thread).
 *
 * What this script does:
 *  1. Resolve the primary admin id from PRIMARY_SUPPORT_ADMIN_ID env var,
 *     or fall back to the oldest user with role === 'admin'.
 *  2. Find every conversation whose participants include the stub.
 *  3. Replace the stub participant with the primary admin id (preserving
 *     role + lastReadAt). Recompute participantPairKey.
 *  4. After the repoint, two conversations for the same (user, primaryAdmin)
 *     pair may collide on the new pairKey. Run the existing dedup logic
 *     inline to merge them — survivor is the oldest conversation, messages
 *     re-point, dupes deleted.
 *
 * Dry-run:
 *   node src/scripts/repointStubAdminConversations.js
 *
 * Apply for real:
 *   node src/scripts/repointStubAdminConversations.js --apply
 *
 * Idempotent. Safe to re-run.
 */

const mongoose = require('mongoose');
const config = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const ChatConversation = require('../models/chatConversation.model');
const ChatMessage = require('../models/chatMessage.model');
const User = require('../models/user.model');

const STUB_ADMIN_ID = '000000000000000000000001';
const shouldApply = process.argv.includes('--apply') || String(process.env.APPLY || '').toLowerCase() === 'true';

const log = (...args) => console.log('[repoint-stub-admin]', ...args);

const computePairKey = (participants) => {
  const userIds = (participants || [])
    .map((p) => p?.user && String(p.user))
    .filter(Boolean);
  if (userIds.length < 2) return null;
  const sorted = [...new Set(userIds)].sort();
  return sorted.slice(0, 2).join(':');
};

const pickLatestDate = (...candidates) => {
  let best = null;
  for (const c of candidates) {
    if (!c) continue;
    const d = c instanceof Date ? c : new Date(c);
    if (Number.isNaN(d.getTime())) continue;
    if (!best || d > best) best = d;
  }
  return best;
};

const resolvePrimaryAdminId = async () => {
  const envId = process.env.PRIMARY_SUPPORT_ADMIN_ID;
  if (envId) {
    const exists = await User.findById(envId).select('_id role').lean();
    if (!exists) {
      throw new Error(
        `PRIMARY_SUPPORT_ADMIN_ID=${envId} does not match any user. Aborting before mutating data.`
      );
    }
    return String(exists._id);
  }
  const oldestAdmin = await User.findOne({ role: { $in: ['admin', 'super-admin'] } })
    .sort({ createdAt: 1 })
    .select('_id role email')
    .lean();
  if (!oldestAdmin) {
    throw new Error(
      'No user with role=admin found and PRIMARY_SUPPORT_ADMIN_ID not set. Aborting.'
    );
  }
  log(`Resolved primary admin from DB: ${oldestAdmin._id} (${oldestAdmin.email})`);
  return String(oldestAdmin._id);
};

const mergeParticipants = (rows) => {
  const byUser = new Map();
  for (const row of rows) {
    for (const p of row.participants || []) {
      const userKey = p?.user && String(p.user);
      if (!userKey) continue;
      const existing = byUser.get(userKey);
      if (!existing) {
        byUser.set(userKey, {
          user: p.user,
          role: p.role || 'user',
          lastReadAt: p.lastReadAt || null,
        });
        continue;
      }
      existing.lastReadAt = pickLatestDate(existing.lastReadAt, p.lastReadAt);
      if (!existing.role && p.role) existing.role = p.role;
    }
  }
  return Array.from(byUser.values());
};

const run = async () => {
  await connectDatabase(config.mongoUri);

  const primaryAdminId = await resolvePrimaryAdminId();
  log(`Primary admin id: ${primaryAdminId}`);

  // 1. Find every conversation with the stub.
  const stubConvs = await ChatConversation.find({ 'participants.user': STUB_ADMIN_ID }).lean();
  log(`Found ${stubConvs.length} conversation(s) containing the stub admin id.`);

  if (stubConvs.length === 0) {
    log('Nothing to do.');
    await disconnectDatabase();
    return;
  }

  // 2. Repoint each stub participant -> primary admin, recompute pairKey.
  for (const conv of stubConvs) {
    const repointed = (conv.participants || []).map((p) =>
      String(p.user) === STUB_ADMIN_ID
        ? { ...p, user: new mongoose.Types.ObjectId(primaryAdminId), role: p.role || 'admin' }
        : p
    );
    const newPairKey = computePairKey(repointed);
    log(
      `Conv ${conv._id}: stub -> ${primaryAdminId}, new pairKey ${newPairKey}` +
        (shouldApply ? '' : ' [DRY RUN]')
    );
    if (shouldApply) {
      await ChatConversation.updateOne(
        { _id: conv._id },
        { $set: { participants: repointed, participantPairKey: newPairKey } }
      );
    }
  }

  // 3. Inline dedup pass — after the repoint, some conversations may now
  // share a pairKey with an existing real-admin conversation. Merge each
  // collision group following the same logic as mergeDuplicateConversations.
  const allConvs = shouldApply
    ? await ChatConversation.find({ participantPairKey: { $exists: true, $ne: null } }).lean()
    : []; // dry-run: skip collision detection since the data wasn't actually changed
  const groups = new Map();
  for (const conv of allConvs) {
    const key = conv.participantPairKey;
    if (!key) continue;
    const arr = groups.get(key) || [];
    arr.push(conv);
    groups.set(key, arr);
  }
  const dupeGroups = Array.from(groups.entries()).filter(([, rows]) => rows.length > 1);
  log(`Post-repoint collision groups: ${dupeGroups.length}`);
  let totalDupes = 0;
  let totalMessagesRepointed = 0;
  for (const [pairKey, rows] of dupeGroups) {
    const sorted = [...rows].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const survivor = sorted[0];
    const dupes = sorted.slice(1);
    const dupeIds = dupes.map((d) => d._id);
    const messageCount = await ChatMessage.countDocuments({ conversation: { $in: dupeIds } });
    totalDupes += dupes.length;
    totalMessagesRepointed += messageCount;
    log(
      `Pair ${pairKey}: ${rows.length} rows -> keep ${String(survivor._id)} (oldest), merge ${dupes.length}, re-point ${messageCount} messages`
    );
    if (!shouldApply) continue;

    await ChatMessage.updateMany(
      { conversation: { $in: dupeIds } },
      { $set: { conversation: survivor._id } }
    );
    const mergedParticipants = mergeParticipants(rows);
    const latestLastMessageAt = pickLatestDate(...rows.map((r) => r.lastMessageAt));
    const latestLastMessageRow = rows.reduce((acc, r) => {
      if (!r.lastMessage) return acc;
      const time = pickLatestDate(r.lastMessageAt) || new Date(0);
      const accTime = acc ? pickLatestDate(acc.lastMessageAt) || new Date(0) : new Date(0);
      return time > accTime ? r : acc;
    }, null);
    await ChatConversation.updateOne(
      { _id: survivor._id },
      {
        $set: {
          participants: mergedParticipants,
          participantPairKey: pairKey,
          lastMessage: latestLastMessageRow?.lastMessage || survivor.lastMessage || '',
          lastMessageAt: latestLastMessageAt || survivor.lastMessageAt,
        },
      }
    );
    await ChatConversation.deleteMany({ _id: { $in: dupeIds } });
  }

  log('--- summary ---');
  log(`stub-containing convs:      ${stubConvs.length}`);
  log(`post-merge dupes deleted:   ${totalDupes}`);
  log(`messages re-pointed:        ${totalMessagesRepointed}`);
  log(`primary admin:              ${primaryAdminId}`);
  log(`mode:                       ${shouldApply ? 'APPLIED' : 'DRY RUN (re-run with --apply)'}`);

  await disconnectDatabase();
};

run().catch(async (err) => {
  console.error('[repoint-stub-admin] FAILED:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
