/**
 * One-time cleanup: merge duplicate ChatConversation rows that exist for the
 * same participant pair.
 *
 * Background: before commit X, `getOrCreateConversation` had a race window
 * (find-then-save) and a non-unique participant query. As a result, the same
 * (admin, user) pair can have N conversations in MongoDB, with messages
 * scattered across them. That makes unread counts unstable and surfaces as
 * "+N older threads" hints in the admin Messages tab.
 *
 * What this script does:
 *  1. Group every ChatConversation by sorted participantPairKey (computed
 *     on the fly from `participants.user`).
 *  2. For each group with > 1 row, pick a SURVIVOR (oldest createdAt — wins
 *     the most-stable ID for any cached references) and merge:
 *       - Re-point every ChatMessage from the dupes to the survivor.
 *       - Compute the latest lastReadAt per participant across all rows
 *         and write it back onto the survivor.
 *       - Take the latest lastMessage / lastMessageAt.
 *       - Delete the dupe conversation documents.
 *  3. Backfill participantPairKey on every surviving conversation so future
 *     calls hit the unique index path.
 *
 * Run as a dry-run first to see what would change:
 *   node src/scripts/mergeDuplicateConversations.js
 *
 * Apply for real:
 *   node src/scripts/mergeDuplicateConversations.js --apply
 *
 * Idempotent. Safe to re-run.
 */

const mongoose = require('mongoose');
const config = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const ChatConversation = require('../models/chatConversation.model');
const ChatMessage = require('../models/chatMessage.model');

const shouldApply = process.argv.includes('--apply') || String(process.env.APPLY || '').toLowerCase() === 'true';

const log = (...args) => console.log('[merge-dupes]', ...args);

const computePairKey = (participants) => {
  const userIds = (participants || [])
    .map((p) => p?.user && String(p.user))
    .filter(Boolean);
  if (userIds.length < 2) return null;
  // Sort lexicographically so {A,B} and {B,A} hash the same.
  const sorted = [...new Set(userIds)].sort();
  // For pair conversations (which is the only kind that ever existed
  // in practice) the first two ids define the canonical key.
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

const mergeParticipants = (rows) => {
  // Build a merged participant list: for each user id, take the latest
  // lastReadAt across all dupe rows, and keep the role/user from the
  // first row that has it.
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

  const allConversations = await ChatConversation.find({}).lean();
  log(`Scanned ${allConversations.length} conversations total.`);

  // Group by computed pair key.
  const groups = new Map();
  let skippedNoPair = 0;
  for (const conv of allConversations) {
    const key = computePairKey(conv.participants);
    if (!key) {
      skippedNoPair += 1;
      continue;
    }
    const arr = groups.get(key) || [];
    arr.push(conv);
    groups.set(key, arr);
  }

  if (skippedNoPair > 0) {
    log(`Skipped ${skippedNoPair} conversations with fewer than 2 valid participant ids.`);
  }

  const duplicateGroups = Array.from(groups.entries()).filter(([, rows]) => rows.length > 1);
  log(`Found ${duplicateGroups.length} pair keys with duplicate conversations.`);

  let totalDupesToDelete = 0;
  let totalMessagesToRepoint = 0;
  let backfillPlanned = 0;

  for (const [pairKey, rows] of groups.entries()) {
    if (rows.length === 1) {
      // No merge needed, but backfill the pair key if missing.
      if (!rows[0].participantPairKey) backfillPlanned += 1;
      continue;
    }

    // Pick the survivor: oldest createdAt wins (stable id, most likely
    // the canonical one cached by clients).
    const sorted = [...rows].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const survivor = sorted[0];
    const dupes = sorted.slice(1);

    totalDupesToDelete += dupes.length;
    const dupeIds = dupes.map((d) => d._id);

    const messageCount = await ChatMessage.countDocuments({ conversation: { $in: dupeIds } });
    totalMessagesToRepoint += messageCount;

    log(
      `Pair ${pairKey}: ${rows.length} rows → keep ${String(survivor._id)} ` +
        `(created ${new Date(survivor.createdAt).toISOString()}), merge ${dupes.length} dupes, ` +
        `re-point ${messageCount} messages.`
    );

    if (!shouldApply) continue;

    // 1. Re-point messages.
    await ChatMessage.updateMany(
      { conversation: { $in: dupeIds } },
      { $set: { conversation: survivor._id } }
    );

    // 2. Merge participants (latest lastReadAt wins).
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

    // 3. Delete dupes.
    await ChatConversation.deleteMany({ _id: { $in: dupeIds } });
  }

  // Backfill participantPairKey on every remaining row that doesn't have one.
  if (backfillPlanned > 0 || shouldApply) {
    const unkeyed = await ChatConversation.find({
      $or: [{ participantPairKey: { $exists: false } }, { participantPairKey: null }],
    }).lean();
    log(`Backfilling participantPairKey on ${unkeyed.length} remaining conversations.`);
    if (shouldApply) {
      for (const conv of unkeyed) {
        const key = computePairKey(conv.participants);
        if (!key) continue;
        await ChatConversation.updateOne(
          { _id: conv._id },
          { $set: { participantPairKey: key } }
        );
      }
    }
  }

  log('--- summary ---');
  log(`duplicate groups:        ${duplicateGroups.length}`);
  log(`dupe rows to delete:     ${totalDupesToDelete}`);
  log(`messages re-pointed:     ${totalMessagesToRepoint}`);
  log(`mode:                    ${shouldApply ? 'APPLIED' : 'DRY RUN (re-run with --apply)'}`);

  await disconnectDatabase();
};

run().catch(async (err) => {
  console.error('[merge-dupes] FAILED:', err);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
