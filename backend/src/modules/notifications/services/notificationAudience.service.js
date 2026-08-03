const mongoose = require('mongoose');
const User = require('../../../models/user.model');
const Company = require('../../../models/company.model');
const { NOTIFICATION_AUDIENCE } = require('../../../constants/notification');
const { ADMIN_ROLES } = require('../../../utils/roles');

const isValidObjectId = (id) => {
  if (!id) return false;
  try {
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  } catch {
    return false;
  }
};

const dedupeIds = (ids) => [...new Set(ids.filter(Boolean).map((id) => String(id)))];

// Active-admin lookup — previously duplicated verbatim in
// feedback.service.js and businessSetup.service.js. Both now import this.
const findAdminUserIds = async () => {
  const admins = await User.find({
    role: { $in: ADMIN_ROLES },
    $or: [{ status: 'active' }, { status: { $exists: false } }],
  })
    .select('_id')
    .lean();

  return admins.map((item) => String(item._id));
};

// Every non-admin, active user — what both admin studios mean by "broadcast".
const findBroadcastUserIds = async () => {
  const users = await User.find({
    role: { $nin: ADMIN_ROLES },
    $or: [{ status: 'active' }, { status: { $exists: false } }],
    deletedAt: null,
  })
    .select('_id')
    .lean();

  return users.map((item) => String(item._id));
};

// A company's "members" for notification purposes: the owner plus any user
// who has the company in their `companies` list or as their `activeCompany`.
const findCompanyMemberUserIds = async (companyId) => {
  if (!isValidObjectId(companyId)) return [];

  const [company, members] = await Promise.all([
    Company.findById(companyId).select('owner').lean(),
    User.find({
      $or: [{ companies: companyId }, { activeCompany: companyId }],
      $and: [{ $or: [{ status: 'active' }, { status: { $exists: false } }] }],
      deletedAt: null,
    })
      .select('_id')
      .lean(),
  ]);

  const ids = members.map((item) => String(item._id));
  if (company?.owner) ids.push(String(company.owner));
  return dedupeIds(ids);
};

/**
 * Resolves an `audience` + explicit target ids into a concrete list of
 * recipient user ids, plus a snapshot describing how it was resolved (stored
 * on the notification docs for audit/history purposes).
 *
 * This is the piece that was entirely missing before: the dispatch
 * controller/service only ever accepted an explicit `userId`/`userIds` list,
 * so `audience: 'company'` and `audience: 'broadcast'` had no way to become
 * real recipients and always 400'd or silently produced an undeliverable doc.
 */
const resolveAudienceUserIds = async ({ audience = NOTIFICATION_AUDIENCE.USER, userId, userIds = [], companyId }) => {
  const explicitIds = dedupeIds([userId, ...(Array.isArray(userIds) ? userIds : [])]);

  if (audience === NOTIFICATION_AUDIENCE.USER) {
    return {
      userIds: explicitIds,
      audienceSnapshot: { audience, requestedCount: explicitIds.length },
    };
  }

  if (audience === NOTIFICATION_AUDIENCE.COMPANY) {
    // Explicit userIds narrow a company audience (e.g. "notify these members
    // of this company"); otherwise resolve every member.
    const resolved = explicitIds.length ? explicitIds : await findCompanyMemberUserIds(companyId);
    return {
      userIds: resolved,
      audienceSnapshot: { audience, company: companyId || null, requestedCount: resolved.length },
    };
  }

  if (audience === NOTIFICATION_AUDIENCE.BROADCAST) {
    const resolved = explicitIds.length ? explicitIds : await findBroadcastUserIds();
    return {
      userIds: resolved,
      audienceSnapshot: { audience, requestedCount: resolved.length },
    };
  }

  return { userIds: explicitIds, audienceSnapshot: { audience, requestedCount: explicitIds.length } };
};

module.exports = {
  findAdminUserIds,
  findBroadcastUserIds,
  findCompanyMemberUserIds,
  resolveAudienceUserIds,
};
