const mongoose = require('mongoose');
const { UserPersonalizedOffer, OFFER_STATUSES, OFFER_TYPES } = require('../../../models/userPersonalizedOffer.model');
const Product = require('../../../models/product.model');

const toObjectId = (value) => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
    return new mongoose.Types.ObjectId(value);
  }
  return undefined;
};

const shapeOffer = (doc) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject({ versionKey: false }) : doc;
  return {
    id: obj._id?.toString?.() || obj._id,
    user: obj.user?.toString?.() || obj.user,
    company: obj.company?.toString?.() || obj.company,
    product: obj.product
      ? {
        id: obj.product._id?.toString?.() || obj.product,
        name: obj.product.name,
        category: obj.product.category
      }
      : obj.product,
    title: obj.title,
    message: obj.message,
    offerType: obj.offerType,
    oldPrice: obj.oldPrice,
    newPrice: obj.newPrice,
    currency: obj.currency,
    minOrderValue: obj.minOrderValue,
    discountPercent: obj.discountPercent,
    expiresAt: obj.expiresAt,
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt
  };
};

const createOfferForUser = async ({
  userId,
  companyId,
  productId,
  title,
  message,
  offerType = 'price_drop',
  newPrice,
  oldPrice,
  currency,
  minOrderValue,
  expiresAt,
  createdBy,
  metadata
}) => {
  if (!userId || !productId || !title || newPrice === undefined || newPrice === null) {
    throw new Error('userId, productId, title, and newPrice are required');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found for personalized offer');
  }
  if (companyId && product.company?.toString() !== companyId.toString()) {
    throw new Error('Product does not belong to the admin company');
  }

  const computedOldPrice = oldPrice ?? product.price?.amount;
  const computedCurrency = currency || product.price?.currency || 'INR';
  const discountPercent =
    computedOldPrice && computedOldPrice > 0
      ? Math.max(0, Math.min(100, Math.round(((computedOldPrice - newPrice) / computedOldPrice) * 100)))
      : undefined;

  const offer = await UserPersonalizedOffer.create({
    user: toObjectId(userId),
    company: toObjectId(companyId ?? product.company),
    product: toObjectId(productId),
    title,
    message,
    offerType,
    newPrice,
    oldPrice: computedOldPrice,
    currency: computedCurrency,
    minOrderValue,
    discountPercent,
    expiresAt,
    createdBy: toObjectId(createdBy),
    metadata
  });

  return shapeOffer(offer);
};

const listOffersForUserAdmin = async (userId, { companyId, includeExpired = true } = {}) => {
  const query = { user: toObjectId(userId) };
  if (companyId) query.company = toObjectId(companyId);
  if (!includeExpired) {
    query.status = 'active';
    query.$or = [{ expiresAt: null }, { expiresAt: { $gte: new Date() } }];
  }

  const offers = await UserPersonalizedOffer.find(query)
    .sort({ createdAt: -1 })
    .populate({ path: 'product', select: 'name category price' });

  return offers.map(shapeOffer);
};

const getActiveOffersForUser = async (userId, { companyId } = {}) => {
  const now = new Date();
  const query = {
    user: toObjectId(userId),
    status: 'active',
    $or: [{ expiresAt: null }, { expiresAt: { $gte: now } }]
  };
  if (companyId) query.company = toObjectId(companyId);

  const offers = await UserPersonalizedOffer.find(query)
    .sort({ createdAt: -1 })
    .limit(5)
    .populate({ path: 'product', select: 'name category price' });

  return offers.map(shapeOffer);
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
  createOfferForUser,
  listOffersForUserAdmin,
  getActiveOffersForUser,
  expirePastOffers,
  shapeOffer
};
