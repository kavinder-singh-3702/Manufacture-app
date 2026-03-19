const mongoose = require('mongoose');
const createError = require('http-errors');
const AdCampaign = require('../../../models/adCampaign.model');
const AdEvent = require('../../../models/adEvent.model');
const Product = require('../../../models/product.model');
const ProductQuote = require('../../../models/productQuote.model');
const ServiceRequest = require('../../../models/serviceRequest.model');
const { UserPreferenceEvent } = require('../../../models/userPreferenceEvent.model');
const {
  AD_CAMPAIGN_STATUSES,
  AD_PLACEMENTS,
  AD_EVENT_TYPES,
  AD_TARGETING_MODES
} = require('../../../constants/ad');

const toObjectId = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (mongoose.Types.ObjectId.isValid(value)) return new mongoose.Types.ObjectId(value);
  return undefined;
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeTextArray = (value, { lower = true } = {}) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const out = [];
  value.forEach((entry) => {
    if (typeof entry !== 'string') return;
    const trimmed = entry.trim();
    if (!trimmed) return;
    const normalized = lower ? trimmed.toLowerCase() : trimmed;
    if (seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  });
  return out;
};

const normalizeObjectIdArray = (value) => {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const ids = [];
  value.forEach((entry) => {
    const objectId = toObjectId(entry);
    if (!objectId) return;
    const key = objectId.toString();
    if (seen.has(key)) return;
    seen.add(key);
    ids.push(objectId);
  });
  return ids;
};

const normalizeSchedule = (schedule) => {
  if (!schedule || typeof schedule !== 'object') return {};
  const startAt = schedule.startAt ? new Date(schedule.startAt) : undefined;
  const endAt = schedule.endAt ? new Date(schedule.endAt) : undefined;

  const normalized = {};
  if (startAt && !Number.isNaN(startAt.getTime())) normalized.startAt = startAt;
  if (endAt && !Number.isNaN(endAt.getTime())) normalized.endAt = endAt;
  return normalized;
};

const normalizeTargeting = (targeting) => {
  if (!targeting || typeof targeting !== 'object') {
    return {
      mode: 'any',
      userIds: [],
      shopperCategories: [],
      shopperSubCategories: [],
      buyIntentCategories: [],
      buyIntentSubCategories: [],
      listedProductCategories: [],
      listedProductSubCategories: [],
      requireListedProductInSameCategory: false,
      lookbackDays: 60
    };
  }

  const mode = AD_TARGETING_MODES.includes(targeting.mode) ? targeting.mode : 'any';
  const lookbackDays = Math.min(Math.max(parseNumber(targeting.lookbackDays, 60), 1), 365);

  return {
    mode,
    userIds: normalizeObjectIdArray(targeting.userIds),
    shopperCategories: normalizeTextArray(targeting.shopperCategories),
    shopperSubCategories: normalizeTextArray(targeting.shopperSubCategories),
    buyIntentCategories: normalizeTextArray(targeting.buyIntentCategories),
    buyIntentSubCategories: normalizeTextArray(targeting.buyIntentSubCategories),
    listedProductCategories: normalizeTextArray(targeting.listedProductCategories),
    listedProductSubCategories: normalizeTextArray(targeting.listedProductSubCategories),
    requireListedProductInSameCategory: Boolean(targeting.requireListedProductInSameCategory),
    lookbackDays
  };
};

const normalizePriceOverride = (priceOverride, fallbackPrice = {}) => {
  if (!priceOverride || typeof priceOverride !== 'object') return undefined;

  const amount = Number(priceOverride.amount);
  if (!Number.isFinite(amount) || amount <= 0) return undefined;

  const currency = typeof priceOverride.currency === 'string' && priceOverride.currency.trim()
    ? priceOverride.currency.trim().toUpperCase()
    : (typeof fallbackPrice.currency === 'string' && fallbackPrice.currency.trim()
      ? fallbackPrice.currency.trim().toUpperCase()
      : 'INR');

  const unit = typeof priceOverride.unit === 'string' && priceOverride.unit.trim()
    ? priceOverride.unit.trim()
    : (typeof fallbackPrice.unit === 'string' ? fallbackPrice.unit : undefined);

  return {
    amount: Number(amount.toFixed(2)),
    currency,
    unit
  };
};

const normalizeCreative = (creative, fallbackPrice = {}) => {
  if (!creative || typeof creative !== 'object') return {};

  const normalized = {
    title: typeof creative.title === 'string' ? creative.title.trim() : undefined,
    subtitle: typeof creative.subtitle === 'string' ? creative.subtitle.trim() : undefined,
    ctaLabel: typeof creative.ctaLabel === 'string' ? creative.ctaLabel.trim() : undefined,
    badge: typeof creative.badge === 'string' ? creative.badge.trim() : undefined
  };

  if (Object.prototype.hasOwnProperty.call(creative, 'priceOverride')) {
    if (creative.priceOverride === null) {
      normalized.priceOverride = null;
    } else {
      normalized.priceOverride = normalizePriceOverride(creative.priceOverride, fallbackPrice);
    }
  }

  return normalized;
};

const assertPriceOverrideWithinListedPrice = (priceOverride, product) => {
  if (!priceOverride || typeof priceOverride !== 'object') return;

  const listedAmount = Number(product?.price?.amount);
  const overrideAmount = Number(priceOverride.amount);

  if (!Number.isFinite(listedAmount) || listedAmount <= 0) {
    throw createError(400, 'Promoted product must include a valid listed price');
  }

  if (!Number.isFinite(overrideAmount) || overrideAmount <= 0) {
    throw createError(400, 'Ad price override must be greater than 0');
  }

  if (overrideAmount > listedAmount) {
    throw createError(400, 'Ad price override must be less than or equal to listed product price');
  }
};

const ensureProductIsEligible = async (productId) => {
  const product = await Product.findOne({
    _id: toObjectId(productId),
    deletedAt: { $exists: false },
    createdByRole: { $in: ['user', 'admin'] },
    status: 'active',
    visibility: 'public'
  })
    .populate({ path: 'company', select: 'displayName complianceStatus contact.phone owner' })
    .lean();

  if (!product) {
    throw createError(400, 'Promoted product must be an active public user/admin listing');
  }

  return product;
};

const shapeCampaign = (doc) => {
  const plain = typeof doc?.toObject === 'function' ? doc.toObject() : doc;
  if (!plain) return null;

  return {
    id: plain._id.toString(),
    name: plain.name,
    description: plain.description,
    status: plain.status,
    product: plain.product
      ? {
        id: plain.product._id?.toString?.() || plain.product.toString(),
        name: plain.product.name,
        createdBy: plain.product.createdBy?.toString?.() || plain.product.createdBy,
        category: plain.product.category,
        subCategory: plain.product.subCategory,
        price: plain.product.price,
        images: plain.product.images,
        contactPreferences: plain.product.contactPreferences,
        company: plain.product.company
          ? {
            id: plain.product.company._id?.toString?.() || plain.product.company.toString(),
            displayName: plain.product.company.displayName,
            complianceStatus: plain.product.company.complianceStatus,
            contact: plain.product.company.contact
          }
          : null
      }
      : null,
    advertiserUser: plain.advertiserUser?.toString?.() || plain.advertiserUser,
    advertiserCompany: plain.advertiserCompany?.toString?.() || plain.advertiserCompany,
    placements: plain.placements || [],
    targeting: {
      ...(plain.targeting || {}),
      userIds: (plain.targeting?.userIds || []).map((id) => id?.toString?.() || id)
    },
    schedule: plain.schedule || {},
    frequencyCapPerDay: plain.frequencyCapPerDay,
    priority: plain.priority,
    creative: plain.creative || {},
    sourceServiceRequest: plain.sourceServiceRequest?.toString?.() || plain.sourceServiceRequest,
    createdBy: plain.createdBy?.toString?.() || plain.createdBy,
    lastUpdatedBy: plain.lastUpdatedBy?.toString?.() || plain.lastUpdatedBy,
    activatedAt: plain.activatedAt,
    pausedAt: plain.pausedAt,
    archivedAt: plain.archivedAt,
    metadata: plain.metadata instanceof Map ? Object.fromEntries(plain.metadata) : plain.metadata || {},
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt
  };
};

const listAdminCampaigns = async (filters = {}) => {
  const limit = Math.min(Math.max(parseNumber(filters.limit, 20), 1), 100);
  const offset = Math.max(parseNumber(filters.offset, 0), 0);

  const query = {};

  if (filters.status && AD_CAMPAIGN_STATUSES.includes(filters.status)) {
    query.status = filters.status;
  }

  if (filters.search && typeof filters.search === 'string') {
    const regex = new RegExp(filters.search.trim(), 'i');
    if (filters.search.trim()) {
      query.$or = [{ name: regex }, { description: regex }];
    }
  }

  const [items, total] = await Promise.all([
    AdCampaign.find(query)
      .populate({
        path: 'product',
        select: 'name createdBy category subCategory price images contactPreferences company',
        populate: { path: 'company', select: 'displayName complianceStatus contact.phone owner' }
      })
      .sort({ updatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    AdCampaign.countDocuments(query)
  ]);

  return {
    campaigns: items.map(shapeCampaign),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total
    }
  };
};

const createCampaign = async ({ payload, actorId }) => {
  const product = await ensureProductIsEligible(payload.productId);
  const creative = normalizeCreative(payload.creative, product.price || {});
  assertPriceOverrideWithinListedPrice(creative.priceOverride, product);

  const status = AD_CAMPAIGN_STATUSES.includes(payload.status) ? payload.status : 'draft';
  const targeting = normalizeTargeting(payload.targeting);
  const schedule = normalizeSchedule(payload.schedule);

  const campaign = await AdCampaign.create({
    name: payload.name,
    description: payload.description,
    status,
    product: product._id,
    advertiserUser: product.createdBy,
    advertiserCompany: product.company?._id || product.company,
    placements: Array.isArray(payload.placements) && payload.placements.length
      ? payload.placements.filter((item) => AD_PLACEMENTS.includes(item))
      : ['dashboard_home'],
    targeting,
    schedule,
    frequencyCapPerDay: Math.min(Math.max(parseNumber(payload.frequencyCapPerDay, 3), 1), 50),
    priority: Math.min(Math.max(parseNumber(payload.priority, 50), 1), 100),
    creative,
    sourceServiceRequest: toObjectId(payload.sourceServiceRequest),
    createdBy: toObjectId(actorId),
    lastUpdatedBy: toObjectId(actorId),
    activatedAt: status === 'active' ? new Date() : undefined,
    pausedAt: status === 'paused' ? new Date() : undefined,
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : undefined
  });

  return getCampaignById(campaign._id);
};

const getCampaignById = async (campaignId) => {
  const campaign = await AdCampaign.findById(toObjectId(campaignId))
    .populate({
      path: 'product',
      select: 'name createdBy category subCategory price images contactPreferences company',
      populate: { path: 'company', select: 'displayName complianceStatus contact.phone owner' }
    })
    .lean();

  return shapeCampaign(campaign);
};

const updateCampaign = async ({ campaignId, payload, actorId }) => {
  const campaign = await AdCampaign.findById(toObjectId(campaignId));
  if (!campaign) return null;

  let resolvedProduct = null;
  const shouldHandlePriceOverride = Boolean(
    payload?.creative &&
    Object.prototype.hasOwnProperty.call(payload.creative, 'priceOverride') &&
    payload.creative.priceOverride !== null
  );

  if (payload.productId) {
    resolvedProduct = await ensureProductIsEligible(payload.productId);
    campaign.product = resolvedProduct._id;
    campaign.advertiserUser = resolvedProduct.createdBy;
    campaign.advertiserCompany = resolvedProduct.company?._id || resolvedProduct.company;
  }

  if (payload.name !== undefined) campaign.name = String(payload.name || '').trim();
  if (payload.description !== undefined) campaign.description = String(payload.description || '').trim();

  if (payload.status && AD_CAMPAIGN_STATUSES.includes(payload.status)) {
    campaign.status = payload.status;
    if (payload.status === 'archived') campaign.archivedAt = new Date();
    if (payload.status === 'paused') campaign.pausedAt = new Date();
    if (payload.status === 'active') campaign.activatedAt = new Date();
  }

  if (payload.placements) {
    const placements = Array.isArray(payload.placements)
      ? payload.placements.filter((item) => AD_PLACEMENTS.includes(item))
      : [];
    if (placements.length) {
      campaign.placements = placements;
    }
  }

  if (payload.targeting) {
    campaign.targeting = normalizeTargeting(payload.targeting);
  }

  if (payload.schedule) {
    campaign.schedule = normalizeSchedule(payload.schedule);
  }

  if (payload.frequencyCapPerDay !== undefined) {
    campaign.frequencyCapPerDay = Math.min(Math.max(parseNumber(payload.frequencyCapPerDay, 3), 1), 50);
  }

  if (payload.priority !== undefined) {
    campaign.priority = Math.min(Math.max(parseNumber(payload.priority, 50), 1), 100);
  }

  if (payload.creative) {
    if (!resolvedProduct && (shouldHandlePriceOverride || payload.productId)) {
      resolvedProduct = await ensureProductIsEligible(campaign.product);
    }

    const creative = normalizeCreative(payload.creative, resolvedProduct?.price || {});
    const nextCreative = {
      ...campaign.creative,
      ...Object.fromEntries(
        Object.entries(creative).filter(([key, value]) => key !== 'priceOverride' && value !== undefined)
      )
    };

    if (Object.prototype.hasOwnProperty.call(creative, 'priceOverride')) {
      if (creative.priceOverride) {
        assertPriceOverrideWithinListedPrice(creative.priceOverride, resolvedProduct);
        nextCreative.priceOverride = creative.priceOverride;
      } else {
        delete nextCreative.priceOverride;
      }
    }

    campaign.creative = nextCreative;
  }

  if (payload.productId && campaign.creative?.priceOverride) {
    assertPriceOverrideWithinListedPrice(campaign.creative.priceOverride, resolvedProduct);
  }

  if (payload.metadata && typeof payload.metadata === 'object') {
    campaign.metadata = payload.metadata;
  }

  campaign.lastUpdatedBy = toObjectId(actorId);
  await campaign.save();

  return getCampaignById(campaign._id);
};

const activateCampaign = async ({ campaignId, actorId }) => {
  const campaign = await AdCampaign.findById(toObjectId(campaignId));
  if (!campaign) return null;

  const product = await ensureProductIsEligible(campaign.product);
  assertPriceOverrideWithinListedPrice(campaign.creative?.priceOverride, product);

  campaign.status = 'active';
  campaign.activatedAt = new Date();
  campaign.lastUpdatedBy = toObjectId(actorId);
  await campaign.save();

  return getCampaignById(campaign._id);
};

const pauseCampaign = async ({ campaignId, actorId }) => {
  const campaign = await AdCampaign.findById(toObjectId(campaignId));
  if (!campaign) return null;

  campaign.status = 'paused';
  campaign.pausedAt = new Date();
  campaign.lastUpdatedBy = toObjectId(actorId);
  await campaign.save();

  return getCampaignById(campaign._id);
};

const recordAdEvent = async ({ campaignId, userId, type, placement = 'dashboard_home', sessionId, metadata }) => {
  const campaign = await AdCampaign.findById(toObjectId(campaignId)).lean();
  if (!campaign) {
    throw createError(404, 'Campaign not found');
  }

  const event = await AdEvent.create({
    campaign: campaign._id,
    user: toObjectId(userId),
    product: campaign.product,
    advertiserCompany: campaign.advertiserCompany,
    type,
    placement,
    sessionId,
    metadata: metadata && typeof metadata === 'object' ? metadata : undefined
  });

  return {
    id: event._id.toString(),
    campaignId: campaign._id.toString(),
    type: event.type,
    placement: event.placement,
    createdAt: event.createdAt
  };
};

const buildSignalSets = async ({ userId, lookbackDays }) => {
  const safeLookback = Math.min(Math.max(parseNumber(lookbackDays, 60), 1), 365);
  const since = new Date();
  since.setDate(since.getDate() - safeLookback);

  const [events, acceptedQuotes, listedProducts] = await Promise.all([
    UserPreferenceEvent.find({
      user: toObjectId(userId),
      type: { $in: ['view_category', 'view_product', 'add_to_cart'] },
      createdAt: { $gte: since }
    })
      .select('type category product createdAt')
      .populate({ path: 'product', select: 'category subCategory' })
      .sort({ createdAt: -1 })
      .limit(600)
      .lean(),
    ProductQuote.find({
      buyer: toObjectId(userId),
      status: 'accepted',
      deletedAt: { $exists: false }
    })
      .select('product createdAt')
      .populate({ path: 'product', select: 'category subCategory' })
      .sort({ createdAt: -1 })
      .limit(120)
      .lean(),
    Product.find({
      createdBy: toObjectId(userId),
      deletedAt: { $exists: false },
      status: 'active',
      visibility: 'public'
    })
      .select('category subCategory')
      .lean()
  ]);

  const shopperCategories = new Set();
  const shopperSubCategories = new Set();
  const buyIntentCategories = new Set();
  const buyIntentSubCategories = new Set();
  const listedProductCategories = new Set();
  const listedProductSubCategories = new Set();

  events.forEach((event) => {
    const category = (event.category || event.product?.category || '').toLowerCase();
    const subCategory = (event.product?.subCategory || '').toLowerCase();

    if (event.type === 'view_category' || event.type === 'view_product') {
      if (category) shopperCategories.add(category);
      if (subCategory) shopperSubCategories.add(subCategory);
    }

    if (event.type === 'add_to_cart') {
      if (category) buyIntentCategories.add(category);
      if (subCategory) buyIntentSubCategories.add(subCategory);
    }
  });

  acceptedQuotes.forEach((entry) => {
    const category = (entry.product?.category || '').toLowerCase();
    const subCategory = (entry.product?.subCategory || '').toLowerCase();
    if (category) buyIntentCategories.add(category);
    if (subCategory) buyIntentSubCategories.add(subCategory);
  });

  listedProducts.forEach((item) => {
    const category = (item.category || '').toLowerCase();
    const subCategory = (item.subCategory || '').toLowerCase();
    if (category) listedProductCategories.add(category);
    if (subCategory) listedProductSubCategories.add(subCategory);
  });

  return {
    shopperCategories,
    shopperSubCategories,
    buyIntentCategories,
    buyIntentSubCategories,
    listedProductCategories,
    listedProductSubCategories
  };
};

const hasIntersection = (values, set) => values.some((entry) => set.has(entry));

const matchTargeting = ({ campaign, userId, signals, productCategory }) => {
  const targeting = campaign.targeting || {};
  const mode = targeting.mode === 'all' ? 'all' : 'any';

  const conditions = [];

  const targetedUsers = (targeting.userIds || []).map((id) => id?.toString?.() || id);
  if (targetedUsers.length) {
    conditions.push(targetedUsers.includes(String(userId)));
  }

  const shopperCategories = normalizeTextArray(targeting.shopperCategories);
  if (shopperCategories.length) {
    conditions.push(hasIntersection(shopperCategories, signals.shopperCategories));
  }

  const shopperSubCategories = normalizeTextArray(targeting.shopperSubCategories);
  if (shopperSubCategories.length) {
    conditions.push(hasIntersection(shopperSubCategories, signals.shopperSubCategories));
  }

  const buyIntentCategories = normalizeTextArray(targeting.buyIntentCategories);
  if (buyIntentCategories.length) {
    conditions.push(hasIntersection(buyIntentCategories, signals.buyIntentCategories));
  }

  const buyIntentSubCategories = normalizeTextArray(targeting.buyIntentSubCategories);
  if (buyIntentSubCategories.length) {
    conditions.push(hasIntersection(buyIntentSubCategories, signals.buyIntentSubCategories));
  }

  const listedProductCategories = normalizeTextArray(targeting.listedProductCategories);
  if (listedProductCategories.length) {
    conditions.push(hasIntersection(listedProductCategories, signals.listedProductCategories));
  }

  const listedProductSubCategories = normalizeTextArray(targeting.listedProductSubCategories);
  if (listedProductSubCategories.length) {
    conditions.push(hasIntersection(listedProductSubCategories, signals.listedProductSubCategories));
  }

  if (targeting.requireListedProductInSameCategory) {
    conditions.push(signals.listedProductCategories.has((productCategory || '').toLowerCase()));
  }

  if (!conditions.length) return true;
  if (mode === 'all') return conditions.every(Boolean);
  return conditions.some(Boolean);
};

const shapeFeedCard = ({ campaign, placement, sessionId }) => ({
  ...(function computePricing() {
    const listed = campaign.product?.price || undefined;
    const override = campaign.creative?.priceOverride || undefined;
    const listedAmount = Number(listed?.amount);
    const overrideAmount = Number(override?.amount);
    const hasDiscount =
      Number.isFinite(listedAmount) &&
      Number.isFinite(overrideAmount) &&
      overrideAmount > 0 &&
      overrideAmount < listedAmount;

    return {
      priceOverride: override,
      pricing: {
        listed,
        advertised: override || listed,
        isDiscounted: Boolean(hasDiscount)
      }
    };
  })(),
  id: campaign._id.toString(),
  campaignId: campaign._id.toString(),
  sessionId,
  placement,
  title: campaign.creative?.title || campaign.product?.name || 'Featured product',
  subtitle:
    campaign.creative?.subtitle ||
    campaign.product?.company?.displayName ||
    'Recommended for you',
  ctaLabel: campaign.creative?.ctaLabel || 'View Product',
  badge: campaign.creative?.badge || undefined,
  priority: campaign.priority,
  product: {
    id: campaign.product?._id?.toString?.() || campaign.product?.toString?.(),
    name: campaign.product?.name,
    createdBy: campaign.product?.createdBy?.toString?.() || campaign.product?.createdBy,
    category: campaign.product?.category,
    subCategory: campaign.product?.subCategory,
    price: campaign.product?.price,
    images: campaign.product?.images || [],
    contactPreferences: campaign.product?.contactPreferences || {},
    company: campaign.product?.company
      ? {
        id: campaign.product.company._id?.toString?.() || campaign.product.company.toString(),
        displayName: campaign.product.company.displayName,
        complianceStatus: campaign.product.company.complianceStatus,
        contact: campaign.product.company.contact
      }
      : null
  }
});

const getFeed = async ({ userId, placement = 'dashboard_home', limit = 5 }) => {
  const safePlacement = AD_PLACEMENTS.includes(placement) ? placement : 'dashboard_home';
  const safeLimit = Math.min(Math.max(parseNumber(limit, 5), 1), 10);
  const now = new Date();

  const activeCampaigns = await AdCampaign.find({
    status: 'active',
    placements: safePlacement,
    $or: [{ 'schedule.startAt': { $exists: false } }, { 'schedule.startAt': null }, { 'schedule.startAt': { $lte: now } }],
    $and: [
      {
        $or: [
          { 'schedule.endAt': { $exists: false } },
          { 'schedule.endAt': null },
          { 'schedule.endAt': { $gte: now } }
        ]
      }
    ]
  })
    .populate({
      path: 'product',
      select: 'name createdBy category subCategory price images contactPreferences company status visibility deletedAt createdByRole',
      populate: { path: 'company', select: 'displayName complianceStatus contact.phone owner' }
    })
    .sort({ priority: -1, updatedAt: -1 })
    .limit(100)
    .lean();

  if (!activeCampaigns.length) {
    return { cards: [], placement: safePlacement };
  }

  const campaigns = activeCampaigns.filter((campaign) => {
    const product = campaign.product;
    if (!product) return false;
    if (product.deletedAt) return false;
    if (product.status !== 'active') return false;
    if (product.visibility !== 'public') return false;
    const creatorRole = String(product.createdByRole || 'user').toLowerCase();
    if (!['user', 'admin'].includes(creatorRole)) return false;
    return true;
  });

  if (!campaigns.length) {
    return { cards: [], placement: safePlacement };
  }

  const campaignIds = campaigns.map((item) => item._id);
  const userObjectId = toObjectId(userId);

  const [dismissedCampaigns, todayImpressionCounts, lastImpressions, signals] = await Promise.all([
    AdEvent.distinct('campaign', {
      user: userObjectId,
      type: 'dismiss',
      campaign: { $in: campaignIds }
    }),
    AdEvent.aggregate([
      {
        $match: {
          user: userObjectId,
          campaign: { $in: campaignIds },
          type: 'impression',
          createdAt: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      },
      { $group: { _id: '$campaign', count: { $sum: 1 } } }
    ]),
    AdEvent.aggregate([
      {
        $match: {
          user: userObjectId,
          campaign: { $in: campaignIds },
          type: 'impression'
        }
      },
      { $group: { _id: '$campaign', lastImpressionAt: { $max: '$createdAt' } } }
    ]),
    buildSignalSets({
      userId: userObjectId,
      lookbackDays: Math.max(...campaigns.map((item) => parseNumber(item.targeting?.lookbackDays, 60)))
    })
  ]);

  const dismissedSet = new Set(dismissedCampaigns.map((id) => id.toString()));
  const impressionCountMap = new Map(todayImpressionCounts.map((row) => [row._id.toString(), row.count]));
  const lastImpressionMap = new Map(lastImpressions.map((row) => [row._id.toString(), row.lastImpressionAt]));

  const eligible = campaigns.filter((campaign) => {
    const key = campaign._id.toString();
    if (dismissedSet.has(key)) return false;

    const todayCount = impressionCountMap.get(key) || 0;
    if (todayCount >= Math.max(1, parseNumber(campaign.frequencyCapPerDay, 3))) {
      return false;
    }

    return matchTargeting({
      campaign,
      userId,
      signals,
      productCategory: campaign.product?.category
    });
  });

  eligible.sort((a, b) => {
    if (b.priority !== a.priority) return b.priority - a.priority;

    const aLast = lastImpressionMap.get(a._id.toString());
    const bLast = lastImpressionMap.get(b._id.toString());

    if (!aLast && bLast) return -1;
    if (aLast && !bLast) return 1;

    if (aLast && bLast) {
      const diff = new Date(aLast).getTime() - new Date(bLast).getTime();
      if (diff !== 0) return diff;
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const sessionId = `adf_${userObjectId.toString().slice(-6)}_${Date.now()}`;

  return {
    placement: safePlacement,
    cards: eligible.slice(0, safeLimit).map((campaign) =>
      shapeFeedCard({ campaign, placement: safePlacement, sessionId })
    )
  };
};

const getCampaignInsights = async ({ campaignId }) => {
  const campaignObjectId = toObjectId(campaignId);
  const campaign = await AdCampaign.findById(campaignObjectId).lean();
  if (!campaign) return null;

  const [summaryRows, byDayRows] = await Promise.all([
    AdEvent.aggregate([
      { $match: { campaign: campaignObjectId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          users: { $addToSet: '$user' }
        }
      }
    ]),
    AdEvent.aggregate([
      { $match: { campaign: campaignObjectId } },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.day': 1 } }
    ])
  ]);

  const summary = {
    impression: { count: 0, uniqueUsers: 0 },
    click: { count: 0, uniqueUsers: 0 },
    dismiss: { count: 0, uniqueUsers: 0 }
  };

  summaryRows.forEach((row) => {
    if (!summary[row._id]) return;
    summary[row._id] = {
      count: row.count,
      uniqueUsers: Array.isArray(row.users) ? row.users.length : 0
    };
  });

  const ctr = summary.impression.count > 0
    ? Number(((summary.click.count / summary.impression.count) * 100).toFixed(2))
    : 0;

  return {
    campaignId: campaign._id.toString(),
    status: campaign.status,
    summary,
    ctr,
    byDay: byDayRows.map((row) => ({
      day: row._id.day,
      type: row._id.type,
      count: row.count
    }))
  };
};

const createCampaignFromServiceRequest = async ({ serviceRequestId, actorId, activate = false, prefillOnly = false }) => {
  const request = await ServiceRequest.findOne({
    _id: toObjectId(serviceRequestId),
    deletedAt: { $exists: false },
    serviceType: 'advertisement'
  }).lean();

  if (!request) {
    throw createError(404, 'Advertisement service request not found');
  }

  const details = request.advertisementDetails || {};
  const productId = details.product || details.productId;

  if (!productId) {
    throw createError(400, 'Advertisement service request does not include a product');
  }

  const prefill = {
    name: request.title || 'Advertisement Campaign',
    description: request.description || details.objective,
    productId: productId.toString(),
    targeting: {
      mode: details.targetingMode || 'any',
      userIds: (details.targetUserIds || []).map((id) => id.toString()),
      shopperCategories: details.shopperCategories || [],
      shopperSubCategories: details.shopperSubCategories || [],
      buyIntentCategories: details.buyIntentCategories || [],
      buyIntentSubCategories: details.buyIntentSubCategories || [],
      listedProductCategories: details.listedProductCategories || [],
      listedProductSubCategories: details.listedProductSubCategories || [],
      requireListedProductInSameCategory: Boolean(details.requireListedProductInSameCategory),
      lookbackDays: details.lookbackDays || 60
    },
    schedule: {
      startAt: details.startAt,
      endAt: details.endAt
    },
    creative: {
      priceOverride: details.priceOverride,
      title: details.headline,
      subtitle: details.subtitle,
      ctaLabel: details.ctaLabel,
      badge: details.badge
    },
    frequencyCapPerDay: details.frequencyCapPerDay || 3,
    priority: details.priority || 50,
    sourceServiceRequest: request._id.toString(),
    metadata: {
      source: 'service_request',
      sourceRequestId: request._id.toString()
    }
  };

  if (prefillOnly) {
    return { prefill };
  }

  const created = await createCampaign({
    payload: {
      ...prefill,
      status: activate ? 'active' : 'draft'
    },
    actorId
  });

  return {
    prefill,
    campaign: created
  };
};

module.exports = {
  listAdminCampaigns,
  createCampaign,
  getCampaignById,
  updateCampaign,
  activateCampaign,
  pauseCampaign,
  getFeed,
  recordAdEvent,
  getCampaignInsights,
  createCampaignFromServiceRequest
};
