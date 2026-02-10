const mongoose = require('mongoose');
const {
  UserPersonalizedOffer,
  OFFER_STATUSES,
  OFFER_TYPES,
  CAMPAIGN_CONTENT_TYPES,
  CAMPAIGN_PRIORITIES
} = require('../../../models/userPersonalizedOffer.model');
const Product = require('../../../models/product.model');
const { SERVICE_TYPES } = require('../../../constants/services');

const PRIORITY_SCORE = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1
};

const toObjectId = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return undefined;
};

const parseNumeric = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const parseDateValue = (value) => {
  if (!value) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return parsed;
};

const normalizeMap = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value);
  if (typeof value === 'object') return value;
  return {};
};

const shapeProduct = (product) => {
  if (!product) return undefined;
  if (typeof product === 'string' || product instanceof mongoose.Types.ObjectId) {
    return { id: product.toString() };
  }
  return {
    id: product._id?.toString?.() || product.id,
    name: product.name,
    category: product.category,
    price: product.price
      ? {
        amount: product.price.amount,
        currency: product.price.currency,
        unit: product.price.unit
      }
      : undefined
  };
};

const shapeCompany = (company) => {
  if (!company) return undefined;
  if (typeof company === 'string' || company instanceof mongoose.Types.ObjectId) {
    return { id: company.toString() };
  }
  return {
    id: company._id?.toString?.() || company.id,
    displayName: company.displayName,
    contact: company.contact ? { phone: company.contact.phone } : undefined
  };
};

const shapeUser = (user) => {
  if (!user) return undefined;
  if (typeof user === 'string' || user instanceof mongoose.Types.ObjectId) {
    return { id: user.toString() };
  }
  return {
    id: user._id?.toString?.() || user.id,
    displayName: user.displayName,
    email: user.email,
    phone: user.phone
  };
};

const enrichContact = (contact = {}, createdBy, company) => {
  const contactObj = contact || {};
  const creator = shapeUser(createdBy);
  const companyObj = shapeCompany(company);

  const adminUserId = contactObj.adminUserId?._id
    ? String(contactObj.adminUserId._id)
    : contactObj.adminUserId
      ? String(contactObj.adminUserId)
      : creator?.id;

  return {
    adminUserId,
    adminName: contactObj.adminName || creator?.displayName || creator?.email || undefined,
    phone: contactObj.phone || companyObj?.contact?.phone || creator?.phone || undefined,
    allowChat: contactObj.allowChat !== false,
    allowCall: contactObj.allowCall !== false
  };
};

const shapeOffer = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject({ versionKey: false }) : doc;
  return {
    id: obj._id?.toString?.() || obj._id,
    user: shapeUser(obj.user) || (obj.user ? String(obj.user) : undefined),
    company: shapeCompany(obj.company) || (obj.company ? String(obj.company) : undefined),
    createdBy: shapeUser(obj.createdBy) || (obj.createdBy ? String(obj.createdBy) : undefined),
    contentType: obj.contentType || 'product',
    serviceType: obj.serviceType,
    product: shapeProduct(obj.product),
    title: obj.title,
    message: obj.message,
    creative: obj.creative || {},
    offerType: obj.offerType,
    oldPrice: obj.oldPrice,
    newPrice: obj.newPrice,
    currency: obj.currency,
    minOrderValue: obj.minOrderValue,
    discountPercent: obj.discountPercent,
    priority: obj.priority || 'normal',
    startsAt: obj.startsAt,
    expiresAt: obj.expiresAt,
    status: obj.status,
    contact: enrichContact(obj.contact, obj.createdBy, obj.company),
    metadata: normalizeMap(obj.metadata),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

const populateOfferQuery = (query) =>
  query
    .populate({ path: 'product', select: 'name category price' })
    .populate({ path: 'user', select: 'displayName email phone' })
    .populate({ path: 'company', select: 'displayName contact.phone' })
    .populate({ path: 'createdBy', select: 'displayName email phone' })
    .populate({ path: 'contact.adminUserId', select: 'displayName email phone' });

const validateCampaignPayload = ({ contentType, serviceType, productId, title, newPrice }) => {
  if (!title) {
    throw new Error('title is required');
  }
  if (!CAMPAIGN_CONTENT_TYPES.includes(contentType)) {
    throw new Error('Invalid contentType for campaign');
  }
  if (contentType === 'service') {
    if (!serviceType || !SERVICE_TYPES.includes(serviceType)) {
      throw new Error('serviceType is required for service campaigns');
    }
  } else {
    if (!productId) {
      throw new Error('productId is required for product campaigns');
    }
    if (!Number.isFinite(Number(newPrice))) {
      throw new Error('newPrice is required for product campaigns');
    }
  }
};

const ensureProductForCampaign = async ({ contentType, productId, companyId }) => {
  if (contentType !== 'product') return undefined;
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found for campaign');
  }
  if (companyId && product.company?.toString() !== companyId.toString()) {
    throw new Error('Product does not belong to the admin company');
  }
  return product;
};

const computePricing = ({ product, newPrice, oldPrice, currency }) => {
  const parsedNewPrice = parseNumeric(newPrice);
  const parsedOldPrice = parseNumeric(oldPrice);
  const fallbackOldPrice = parseNumeric(product?.price?.amount);
  const computedOldPrice = parsedOldPrice ?? fallbackOldPrice;
  const computedCurrency = currency || product?.price?.currency || 'INR';
  const discountPercent =
    Number.isFinite(parsedNewPrice) && Number.isFinite(computedOldPrice) && computedOldPrice > 0
      ? Math.max(0, Math.min(100, Math.round(((computedOldPrice - parsedNewPrice) / computedOldPrice) * 100)))
      : undefined;

  return {
    newPrice: parsedNewPrice,
    oldPrice: computedOldPrice,
    currency: computedCurrency,
    discountPercent
  };
};

const buildContactPayload = ({ contact, createdBy }) => {
  const base = contact && typeof contact === 'object' ? { ...contact } : {};
  if (!base.adminUserId && createdBy) {
    base.adminUserId = createdBy;
  }
  if (base.allowChat === undefined) base.allowChat = true;
  if (base.allowCall === undefined) base.allowCall = true;
  return base;
};

const applyActiveWindowFilter = (query, now = new Date()) => {
  const andFilters = [
    { status: 'active' },
    {
      $or: [{ startsAt: null }, { startsAt: { $exists: false } }, { startsAt: { $lte: now } }]
    },
    {
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gte: now } }]
    }
  ];
  if (query.$and) {
    query.$and = [...query.$and, ...andFilters];
  } else {
    query.$and = andFilters;
  }
};

const createOfferForUser = async ({
  userId,
  companyId,
  productId,
  contentType = 'product',
  serviceType,
  title,
  message,
  creative,
  contact,
  offerType = 'price_drop',
  newPrice,
  oldPrice,
  currency,
  minOrderValue,
  priority = 'normal',
  startsAt,
  expiresAt,
  status = 'active',
  createdBy,
  metadata
}) => {
  if (!userId || !createdBy) {
    throw new Error('userId and createdBy are required');
  }

  validateCampaignPayload({ contentType, serviceType, productId, title, newPrice });

  const product = await ensureProductForCampaign({ contentType, productId, companyId });
  const pricing = computePricing({ product, newPrice, oldPrice, currency });

  const offer = await UserPersonalizedOffer.create({
    user: toObjectId(userId),
    company: toObjectId(companyId || product?.company),
    contentType,
    serviceType: contentType === 'service' ? serviceType : undefined,
    product: contentType === 'product' ? toObjectId(productId) : undefined,
    title,
    message,
    creative: creative && typeof creative === 'object' ? creative : undefined,
    offerType: OFFER_TYPES.includes(offerType) ? offerType : 'price_drop',
    newPrice: pricing.newPrice,
    oldPrice: pricing.oldPrice,
    currency: pricing.currency,
    minOrderValue: parseNumeric(minOrderValue),
    discountPercent: pricing.discountPercent,
    priority: CAMPAIGN_PRIORITIES.includes(priority) ? priority : 'normal',
    startsAt: parseDateValue(startsAt),
    expiresAt: parseDateValue(expiresAt),
    status: OFFER_STATUSES.includes(status) ? status : 'active',
    contact: buildContactPayload({ contact, createdBy }),
    createdBy: toObjectId(createdBy),
    metadata
  });

  const populated = await populateOfferQuery(UserPersonalizedOffer.findById(offer._id));
  return shapeOffer(populated);
};

const listOffersForUserAdmin = async (
  userId,
  { companyId, includeExpired = true, status, contentType, limit = 50, offset = 0 } = {}
) => {
  const query = { user: toObjectId(userId) };
  if (companyId) query.company = toObjectId(companyId);
  if (status) query.status = status;
  if (contentType) query.contentType = contentType;
  if (!includeExpired) {
    applyActiveWindowFilter(query);
  }

  const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [offersRaw, total] = await Promise.all([
    populateOfferQuery(
      UserPersonalizedOffer.find(query)
        .sort({ createdAt: -1 })
        .skip(safeOffset)
        .limit(cappedLimit)
    ),
    UserPersonalizedOffer.countDocuments(query)
  ]);

  return {
    offers: offersRaw.map(shapeOffer),
    pagination: {
      total,
      limit: cappedLimit,
      offset: safeOffset,
      hasMore: safeOffset + offersRaw.length < total
    }
  };
};

const listCampaignsAdmin = async ({
  companyId,
  userId,
  status,
  contentType,
  includeExpired = true,
  limit = 20,
  offset = 0
} = {}) => {
  const query = {};
  if (companyId) query.company = toObjectId(companyId);
  if (userId) query.user = toObjectId(userId);
  if (status) query.status = status;
  if (contentType) query.contentType = contentType;
  if (!includeExpired) {
    applyActiveWindowFilter(query);
  }

  const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safeOffset = Math.max(Number(offset) || 0, 0);

  const [campaignsRaw, total] = await Promise.all([
    populateOfferQuery(
      UserPersonalizedOffer.find(query)
        .sort({ createdAt: -1 })
        .skip(safeOffset)
        .limit(cappedLimit)
    ),
    UserPersonalizedOffer.countDocuments(query)
  ]);

  return {
    campaigns: campaignsRaw.map(shapeOffer),
    pagination: {
      total,
      limit: cappedLimit,
      offset: safeOffset,
      hasMore: safeOffset + campaignsRaw.length < total
    }
  };
};

const getActiveOffersForUser = async (userId, { companyId, limit = 8 } = {}) => {
  const now = new Date();
  const query = {
    user: toObjectId(userId)
  };
  if (companyId) query.company = toObjectId(companyId);
  applyActiveWindowFilter(query, now);

  const cappedLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);

  const offersRaw = await populateOfferQuery(
    UserPersonalizedOffer.find(query)
      .sort({ createdAt: -1 })
      .limit(Math.max(cappedLimit * 2, cappedLimit))
  );

  return offersRaw
    .map(shapeOffer)
    .sort((left, right) => {
      const priorityDiff = (PRIORITY_SCORE[right.priority] || 0) - (PRIORITY_SCORE[left.priority] || 0);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    })
    .slice(0, cappedLimit);
};

const updateCampaignForUser = async ({
  userId,
  campaignId,
  companyId,
  contentType,
  serviceType,
  productId,
  title,
  message,
  creative,
  contact,
  offerType,
  newPrice,
  oldPrice,
  currency,
  minOrderValue,
  priority,
  startsAt,
  expiresAt,
  status,
  metadata
}) => {
  const query = {
    _id: toObjectId(campaignId),
    user: toObjectId(userId)
  };
  if (companyId) query.company = toObjectId(companyId);

  const offer = await UserPersonalizedOffer.findOne(query);
  if (!offer) return null;

  const nextContentType = contentType || offer.contentType || 'product';
  const nextServiceType = serviceType || offer.serviceType;
  const nextProductId = productId || offer.product;
  const nextTitle = title || offer.title;
  const nextNewPrice = newPrice !== undefined ? newPrice : offer.newPrice;

  validateCampaignPayload({
    contentType: nextContentType,
    serviceType: nextServiceType,
    productId: nextProductId,
    title: nextTitle,
    newPrice: nextNewPrice
  });

  const product = await ensureProductForCampaign({
    contentType: nextContentType,
    productId: nextProductId,
    companyId: companyId || offer.company
  });

  const pricing = computePricing({
    product,
    newPrice: nextNewPrice,
    oldPrice: oldPrice !== undefined ? oldPrice : offer.oldPrice,
    currency: currency || offer.currency
  });

  offer.contentType = nextContentType;
  offer.serviceType = nextContentType === 'service' ? nextServiceType : undefined;
  offer.product = nextContentType === 'product' ? toObjectId(nextProductId) : undefined;
  offer.title = nextTitle;
  offer.message = message !== undefined ? message : offer.message;
  offer.creative =
    creative && typeof creative === 'object'
      ? { ...(offer.creative?.toObject?.() || offer.creative || {}), ...creative }
      : offer.creative;
  offer.offerType = offerType && OFFER_TYPES.includes(offerType) ? offerType : offer.offerType;
  offer.newPrice = pricing.newPrice;
  offer.oldPrice = pricing.oldPrice;
  offer.currency = pricing.currency;
  offer.discountPercent = pricing.discountPercent;
  offer.minOrderValue = minOrderValue !== undefined ? parseNumeric(minOrderValue) : offer.minOrderValue;
  offer.priority = priority && CAMPAIGN_PRIORITIES.includes(priority) ? priority : offer.priority;
  offer.startsAt = startsAt !== undefined ? parseDateValue(startsAt) : offer.startsAt;
  offer.expiresAt = expiresAt !== undefined ? parseDateValue(expiresAt) : offer.expiresAt;
  offer.status = status && OFFER_STATUSES.includes(status) ? status : offer.status;
  if (contact && typeof contact === 'object') {
    offer.contact = {
      ...offer.contact?.toObject?.(),
      ...contact
    };
  }
  if (metadata && typeof metadata === 'object') {
    offer.metadata = metadata;
  }

  await offer.save();
  const populated = await populateOfferQuery(UserPersonalizedOffer.findById(offer._id));
  return shapeOffer(populated);
};

const expirePastOffers = async () => {
  const now = new Date();
  await UserPersonalizedOffer.updateMany(
    { status: 'active', expiresAt: { $lte: now } },
    { $set: { status: 'expired' } }
  );
};

module.exports = {
  OFFER_STATUSES,
  OFFER_TYPES,
  CAMPAIGN_CONTENT_TYPES,
  CAMPAIGN_PRIORITIES,
  createOfferForUser,
  listOffersForUserAdmin,
  listCampaignsAdmin,
  getActiveOffersForUser,
  updateCampaignForUser,
  expirePastOffers,
  shapeOffer
};
