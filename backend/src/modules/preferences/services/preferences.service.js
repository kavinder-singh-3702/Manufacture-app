const mongoose = require('mongoose');
const { UserPreferenceEvent, EVENT_TYPES } = require('../../../models/userPreferenceEvent.model');
const Product = require('../../../models/product.model');

const toObjectId = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return undefined;
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : undefined);

const recordPreferenceEvent = async ({
  userId,
  companyId,
  type,
  productId,
  category,
  searchTerm,
  quantity,
  meta
}) => {
  if (!userId || !type) {
    throw new Error('userId and type are required');
  }
  if (!EVENT_TYPES.includes(type)) {
    throw new Error(`Invalid event type: ${type}`);
  }

  const payload = {
    user: toObjectId(userId),
    company: toObjectId(companyId),
    type,
    product: toObjectId(productId),
    category: normalizeString(category),
    searchTerm: normalizeString(searchTerm)?.toLowerCase(),
    quantity: Number.isFinite(Number(quantity)) ? Math.max(Number(quantity), 0) : undefined,
    meta: meta && typeof meta === 'object' ? meta : undefined
  };

  // Remove undefined fields to keep documents lean
  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  const event = await UserPreferenceEvent.create(payload);
  return event;
};

const shapeRecentEvent = (doc) => {
  if (!doc) return null;
  return {
    id: doc._id.toString(),
    type: doc.type,
    product: doc.product
      ? {
        id: doc.product._id.toString(),
        name: doc.product.name,
        category: doc.product.category
      }
      : undefined,
    category: doc.category,
    searchTerm: doc.searchTerm,
    quantity: doc.quantity,
    meta: doc.meta instanceof Map ? Object.fromEntries(doc.meta) : doc.meta || {},
    createdAt: doc.createdAt
  };
};

const aggregateSummary = async ({ userId, companyId, days = 30, limit = 5 }) => {
  const match = { user: toObjectId(userId) };
  if (companyId) {
    match.company = toObjectId(companyId);
  }
  if (days && Number.isFinite(Number(days))) {
    const since = new Date();
    since.setDate(since.getDate() - Number(days));
    match.createdAt = { $gte: since };
  }

  const cappedLimit = Math.min(Math.max(Number(limit) || 5, 1), 20);

  // Top categories viewed/searched/added
  const topCategoriesPromise = UserPreferenceEvent.aggregate([
    { $match: { ...match, category: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        lastEvent: { $max: '$createdAt' }
      }
    },
    { $sort: { count: -1, lastEvent: -1 } },
    { $limit: cappedLimit }
  ]);

  // Top search terms
  const topSearchTermsPromise = UserPreferenceEvent.aggregate([
    { $match: { ...match, type: 'search', searchTerm: { $exists: true, $ne: null } } },
    { $group: { _id: '$searchTerm', count: { $sum: 1 }, lastEvent: { $max: '$createdAt' } } },
    { $sort: { count: -1, lastEvent: -1 } },
    { $limit: cappedLimit }
  ]);

  // Top products (views + cart adds)
  const topProductsPromise = UserPreferenceEvent.aggregate([
    { $match: { ...match, product: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$product',
        total: { $sum: 1 },
        views: { $sum: { $cond: [{ $eq: ['$type', 'view_product'] }, 1, 0] } },
        addsToCart: { $sum: { $cond: [{ $eq: ['$type', 'add_to_cart'] }, 1, 0] } },
        lastEvent: { $max: '$createdAt' }
      }
    },
    { $sort: { addsToCart: -1, views: -1, total: -1, lastEvent: -1 } },
    { $limit: cappedLimit },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }
  ]);

  // Action counts
  const actionCountsPromise = UserPreferenceEvent.aggregate([
    { $match: match },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

  // Recent events with populated product
  const recentEventsPromise = UserPreferenceEvent.find(match)
    .sort({ createdAt: -1 })
    .limit(25)
    .populate({ path: 'product', select: 'name category' })
    .lean();

  const [topCategories, topSearchTerms, topProductsRaw, actionCounts, recentEventsRaw] = await Promise.all([
    topCategoriesPromise,
    topSearchTermsPromise,
    topProductsPromise,
    actionCountsPromise,
    recentEventsPromise
  ]);

  const topProducts = topProductsRaw.map((p) => ({
    id: p._id?.toString(),
    name: p.product?.name,
    category: p.product?.category,
    addsToCart: p.addsToCart,
    views: p.views,
    total: p.total,
    lastEvent: p.lastEvent
  }));

  const recentEvents = recentEventsRaw.map((doc) => shapeRecentEvent(doc)).filter(Boolean);

  const totals = actionCounts.reduce(
    (acc, curr) => {
      acc[curr._id] = curr.count;
      acc.totalEvents += curr.count;
      return acc;
    },
    { totalEvents: 0 }
  );

  return {
    userId: toObjectId(userId)?.toString(),
    windowDays: days,
    topCategories: topCategories.map((c) => ({ category: c._id, count: c.count, lastEvent: c.lastEvent })),
    topSearchTerms: topSearchTerms.map((s) => ({ term: s._id, count: s.count, lastEvent: s.lastEvent })),
    topProducts,
    actionCounts: totals,
    recentEvents
  };
};

module.exports = {
  recordPreferenceEvent,
  aggregateSummary
};
