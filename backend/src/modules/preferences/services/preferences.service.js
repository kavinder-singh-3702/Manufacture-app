const mongoose = require('mongoose');
const { UserPreferenceEvent, EVENT_TYPES } = require('../../../models/userPreferenceEvent.model');
const Product = require('../../../models/product.model');
const { getActiveOffersForUser, expirePastOffers } = require('./personalizedOffer.service');

const EVENT_WEIGHTS = {
  checkout_start: 12,
  add_to_cart: 8,
  view_product: 5,
  view_category: 3,
  search: 2,
  remove_from_cart: 1
};

const EVENT_REASON_LABELS = {
  checkout_start: 'Because you started checkout on similar items',
  add_to_cart: 'Because you added similar items to cart',
  view_product: 'Because you viewed similar products',
  view_category: 'Because you browse this category often',
  search: 'Based on your recent searches',
  remove_from_cart: 'Based on your recent product activity'
};

const toObjectId = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return undefined;
};

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : undefined);

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

const getRecencyMultiplier = (createdAt) => {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  const ageDays = Math.max(ageMs / (1000 * 60 * 60 * 24), 0);
  return 1 / (1 + ageDays / 14);
};

const buildRecommendationReason = (eventType) => EVENT_REASON_LABELS[eventType] || 'Picked from your recent activity';

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

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined || payload[key] === null) {
      delete payload[key];
    }
  });

  const event = await UserPreferenceEvent.create(payload);
  return event;
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

  const topSearchTermsPromise = UserPreferenceEvent.aggregate([
    { $match: { ...match, type: 'search', searchTerm: { $exists: true, $ne: null } } },
    { $group: { _id: '$searchTerm', count: { $sum: 1 }, lastEvent: { $max: '$createdAt' } } },
    { $sort: { count: -1, lastEvent: -1 } },
    { $limit: cappedLimit }
  ]);

  const topProductsPromise = UserPreferenceEvent.aggregate([
    { $match: { ...match, product: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$product',
        total: { $sum: 1 },
        views: { $sum: { $cond: [{ $eq: ['$type', 'view_product'] }, 1, 0] } },
        addsToCart: { $sum: { $cond: [{ $eq: ['$type', 'add_to_cart'] }, 1, 0] } },
        checkoutStarts: { $sum: { $cond: [{ $eq: ['$type', 'checkout_start'] }, 1, 0] } },
        lastEvent: { $max: '$createdAt' }
      }
    },
    { $sort: { checkoutStarts: -1, addsToCart: -1, views: -1, total: -1, lastEvent: -1 } },
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

  const actionCountsPromise = UserPreferenceEvent.aggregate([
    { $match: match },
    { $group: { _id: '$type', count: { $sum: 1 } } }
  ]);

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
    checkoutStarts: p.checkoutStarts,
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

const getBehaviorBasedRecommendations = async ({ userId, companyId, limit = 8 }) => {
  const cappedLimit = Math.min(Math.max(Number(limit) || 8, 1), 30);
  const since = new Date();
  since.setDate(since.getDate() - 90);

  const eventMatch = {
    user: toObjectId(userId),
    createdAt: { $gte: since },
    type: { $in: Object.keys(EVENT_WEIGHTS) }
  };
  if (companyId) {
    eventMatch.company = toObjectId(companyId);
  }

  const recentEvents = await UserPreferenceEvent.find(eventMatch)
    .sort({ createdAt: -1 })
    .limit(300)
    .lean();

  const productScores = new Map();
  const categoryScores = new Map();
  const productReason = new Map();
  const categoryReason = new Map();

  recentEvents.forEach((event) => {
    const baseWeight = EVENT_WEIGHTS[event.type] || 0;
    if (!baseWeight) return;
    const score = baseWeight * getRecencyMultiplier(event.createdAt);

    if (event.product) {
      const productId = String(event.product);
      productScores.set(productId, (productScores.get(productId) || 0) + score);
      if (!productReason.has(productId)) {
        productReason.set(productId, event.type);
      }
    }

    if (event.category) {
      categoryScores.set(event.category, (categoryScores.get(event.category) || 0) + score);
      if (!categoryReason.has(event.category)) {
        categoryReason.set(event.category, event.type);
      }
    }
  });

  const prioritizedProductIds = Array.from(productScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id)
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .slice(0, 30)
    .map((id) => new mongoose.Types.ObjectId(id));

  const prioritizedCategories = Array.from(categoryScores.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category)
    .slice(0, 8);

  const productQuery = {
    deletedAt: { $exists: false },
    status: 'active',
    visibility: 'public'
  };

  const targetedFilters = [];
  if (prioritizedProductIds.length > 0) {
    targetedFilters.push({ _id: { $in: prioritizedProductIds } });
  }
  if (prioritizedCategories.length > 0) {
    targetedFilters.push({ category: { $in: prioritizedCategories } });
  }
  if (targetedFilters.length > 0) {
    productQuery.$or = targetedFilters;
  }

  let products = await Product.find(productQuery)
    .populate({ path: 'company', select: 'displayName contact.phone owner' })
    .sort({ updatedAt: -1 })
    .limit(cappedLimit * 3)
    .lean();

  if (products.length === 0) {
    products = await Product.find({
      deletedAt: { $exists: false },
      status: 'active',
      visibility: 'public'
    })
      .populate({ path: 'company', select: 'displayName contact.phone owner' })
      .sort({ updatedAt: -1 })
      .limit(cappedLimit)
      .lean();
  }

  const scoredProducts = products.map((product) => {
    const productScore = productScores.get(String(product._id)) || 0;
    const categoryScore = categoryScores.get(product.category) || 0;
    const score = productScore * 1.4 + categoryScore;

    const eventTypeForReason =
      productReason.get(String(product._id)) ||
      categoryReason.get(product.category);

    return {
      product,
      score,
      reason: buildRecommendationReason(eventTypeForReason)
    };
  });

  return scoredProducts
    .sort((a, b) => b.score - a.score)
    .slice(0, cappedLimit);
};

const getHomeFeedForUser = async ({
  userId,
  companyId,
  campaignLimit = 5,
  recommendationLimit = 8
}) => {
  await expirePastOffers();

  const campaigns = await getActiveOffersForUser(userId, { companyId, limit: campaignLimit });
  const recommendations =
    campaigns.length === 0
      ? await getBehaviorBasedRecommendations({
        userId,
        companyId,
        limit: recommendationLimit
      })
      : [];

  const summary = await aggregateSummary({
    userId,
    companyId,
    days: 60,
    limit: 5
  });

  return {
    campaigns,
    recommendations,
    signals: {
      topCategories: summary.topCategories.slice(0, 3),
      topProducts: summary.topProducts.slice(0, 3),
      actionCounts: summary.actionCounts
    },
    meta: {
      generatedAt: new Date().toISOString(),
      hasCampaigns: campaigns.length > 0,
      fallbackUsed: campaigns.length === 0
    }
  };
};

module.exports = {
  recordPreferenceEvent,
  aggregateSummary,
  getBehaviorBasedRecommendations,
  getHomeFeedForUser
};
