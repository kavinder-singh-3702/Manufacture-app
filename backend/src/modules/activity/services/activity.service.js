const Activity = require('../../../models/activity.model');
const { ACTIVITY_CATEGORIES } = require('../../../constants/activity');

const MAX_LIMIT = 100;

const normalizeMeta = (meta) => {
  if (!meta || typeof meta !== 'object') return undefined;
  const entries = Object.entries(meta).filter(([, value]) => value !== undefined);
  if (!entries.length) return undefined;
  return entries.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
};

const shapeActivity = (doc) => {
  if (!doc) return null;
  const plain = doc.toObject({ versionKey: false });
  const meta = plain.meta instanceof Map ? Object.fromEntries(plain.meta) : plain.meta || {};

  return {
    id: plain._id.toString(),
    user: plain.user?.toString?.() || plain.user,
    company: plain.company ? plain.company.toString() : undefined,
    companyName: plain.companyName,
    action: plain.action,
    category: plain.category,
    label: plain.label,
    description: plain.description,
    meta,
    ip: plain.ip,
    userAgent: plain.userAgent,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt
  };
};

const recordActivity = async ({
  userId,
  action,
  label,
  description,
  category,
  companyId,
  companyName,
  meta,
  context
}) => {
  if (!userId || !action || !label) {
    throw new Error('userId, action, and label are required to record activity');
  }

  const payload = {
    user: userId,
    action,
    label,
    description,
    category: category || action.split('.')[0] || ACTIVITY_CATEGORIES.USER,
    company: companyId,
    companyName,
    meta: normalizeMeta(meta),
    ip: context?.ip,
    userAgent: context?.userAgent
  };

  const activity = await Activity.create(payload);
  return shapeActivity(activity);
};

const recordActivitySafe = async (params) => {
  try {
    return await recordActivity(params);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to record activity', error);
    return null;
  }
};

const listActivitiesForUser = async ({ userId, limit = 50, companyId, action } = {}) => {
  const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
  const cappedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);
  const query = { user: userId };
  if (companyId) {
    query.company = companyId;
  }
  if (action) {
    query.action = action;
  }

  const activities = await Activity.find(query).sort({ createdAt: -1 }).limit(cappedLimit);
  return activities.map(shapeActivity);
};

const extractRequestContext = (req) => ({
  ip: req?.ip,
  userAgent: req?.get ? req.get('user-agent') : req?.headers?.['user-agent']
});

module.exports = {
  shapeActivity,
  recordActivity,
  recordActivitySafe,
  listActivitiesForUser,
  extractRequestContext
};
