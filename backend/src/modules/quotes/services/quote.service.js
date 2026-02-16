const mongoose = require('mongoose');
const createError = require('http-errors');
const ProductQuote = require('../../../models/productQuote.model');
const Product = require('../../../models/product.model');
const ProductVariant = require('../../../models/productVariant.model');
const { createNotification } = require('../../../services/notification.service');
const {
  QUOTE_STATUSES,
  QUOTE_MODES,
  BUYER_ACTION_STATUSES,
  SELLER_ADMIN_ACTION_STATUSES
} = require('../../../constants/quote');
const { DEFAULT_CURRENCY } = require('../../../constants/product');
const { isAdminRole } = require('../../../utils/roles');

const RESPONDED_STATUSES = ['quoted', 'accepted', 'rejected', 'expired'];

const STATUS_TRANSITIONS = Object.freeze({
  pending: ['quoted', 'cancelled', 'expired'],
  quoted: ['quoted', 'accepted', 'rejected', 'cancelled', 'expired'],
  accepted: [],
  rejected: [],
  cancelled: [],
  expired: []
});

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);

const toObjectId = (value, fieldLabel = 'id') => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!isValidObjectId(value)) {
    throw createError(400, `Invalid ${fieldLabel}`);
  }
  return new mongoose.Types.ObjectId(value);
};

const normalizeMoneyCurrency = (currency) =>
  typeof currency === 'string' && currency.trim() ? currency.trim().toUpperCase() : DEFAULT_CURRENCY;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const applyQuotePopulation = (query) =>
  query
    .populate({ path: 'product', select: '_id name images price category contactPreferences' })
    .populate({ path: 'variant', select: '_id title options' })
    .populate({ path: 'buyer', select: '_id displayName phone email' })
    .populate({ path: 'seller', select: '_id displayName phone email' })
    .populate({ path: 'sellerCompany', select: '_id displayName contact.phone' })
    .populate({ path: 'response.respondedBy', select: '_id displayName email' });

const canAccessQuote = (quote, user) => {
  if (!quote || !user) return false;
  if (isAdminRole(user.role)) return true;
  const userId = String(user.id || user._id || '');
  if (!userId) return false;
  return String(quote.buyer) === userId || String(quote.seller) === userId;
};

const appendHistory = (quote, { actorId, action, statusFrom, statusTo, note }) => {
  quote.history.push({
    actor: actorId ? toObjectId(actorId, 'actor id') : undefined,
    action,
    statusFrom,
    statusTo,
    note,
    timestamp: new Date()
  });
};

const notifyUserSafe = async ({ userId, title, body, eventKey, data }) => {
  if (!userId) return;
  try {
    await createNotification({
      userId,
      title,
      body,
      eventKey,
      topic: 'quotes',
      data
    });
  } catch {
    // Do not block quote flows for notification failures.
  }
};

const getQuoteByIdRaw = async (quoteId) => {
  const query = {
    _id: toObjectId(quoteId, 'quote id'),
    deletedAt: { $exists: false }
  };
  return applyQuotePopulation(ProductQuote.findOne(query)).lean();
};

const createQuote = async (payload, user) => {
  if (!user?.id) {
    throw createError(401, 'Authentication required');
  }

  const buyerId = toObjectId(user.id, 'buyer id');
  const buyerCompanyId = user.activeCompany ? toObjectId(user.activeCompany, 'buyer company id') : undefined;

  const product = await Product.findOne({
    _id: toObjectId(payload.productId, 'product id'),
    deletedAt: { $exists: false }
  })
    .select('_id name createdBy company')
    .lean();

  if (!product) {
    throw createError(404, 'Product not found');
  }

  if (!product.createdBy || !product.company) {
    throw createError(400, 'Product seller metadata is incomplete');
  }

  const buyerCompanyAsString = buyerCompanyId ? String(buyerCompanyId) : null;
  const sellerCompanyAsString = String(product.company);
  const sellerUserAsString = String(product.createdBy);

  if (sellerUserAsString === String(buyerId) || (buyerCompanyAsString && buyerCompanyAsString === sellerCompanyAsString)) {
    throw createError(403, 'You cannot request a quote for your own product');
  }

  let variantId;
  if (payload.variantId) {
    const variant = await ProductVariant.findOne({
      _id: toObjectId(payload.variantId, 'variant id'),
      product: product._id,
      deletedAt: { $exists: false }
    })
      .select('_id')
      .lean();

    if (!variant) {
      throw createError(400, 'Selected variant is invalid for this product');
    }
    variantId = variant._id;
  }

  const quote = await ProductQuote.create({
    product: product._id,
    variant: variantId,
    buyer: buyerId,
    buyerCompany: buyerCompanyId,
    seller: toObjectId(product.createdBy, 'seller id'),
    sellerCompany: toObjectId(product.company, 'seller company id'),
    request: {
      quantity: Number(payload.quantity),
      targetPrice: payload.targetPrice !== undefined ? Number(payload.targetPrice) : undefined,
      currency: normalizeMoneyCurrency(payload.currency),
      requirements: payload.requirements,
      requiredBy: payload.requiredBy,
      buyerContact: payload.buyerContact
    },
    status: 'pending',
    history: [
      {
        actor: buyerId,
        action: 'requested',
        statusTo: 'pending',
        timestamp: new Date()
      }
    ]
  });

  const created = await getQuoteByIdRaw(quote._id);

  await notifyUserSafe({
    userId: sellerUserAsString,
    title: 'New quote request',
    body: `A buyer requested a quote for ${product.name}.`,
    eventKey: 'quote.requested',
    data: {
      quoteId: String(quote._id),
      productId: String(product._id)
    }
  });

  return created;
};

const buildModeQuery = (user, mode) => {
  const normalizedMode = QUOTE_MODES.includes(mode) ? mode : 'asked';
  const userId = toObjectId(user.id, 'user id');

  if (normalizedMode === 'incoming') {
    return { mode: normalizedMode, query: { seller: userId } };
  }

  if (normalizedMode === 'received') {
    return {
      mode: normalizedMode,
      query: {
        buyer: userId,
        status: { $in: RESPONDED_STATUSES }
      }
    };
  }

  return { mode: 'asked', query: { buyer: userId } };
};

const listQuotes = async (user, filters = {}) => {
  if (!user?.id) {
    throw createError(401, 'Authentication required');
  }

  const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(filters.offset, 10) || 0, 0);

  const { mode, query: modeQuery } = buildModeQuery(user, filters.mode);
  const query = {
    deletedAt: { $exists: false },
    ...modeQuery
  };

  if (filters.status) {
    if (!QUOTE_STATUSES.includes(filters.status)) {
      throw createError(400, 'Invalid quote status');
    }

    if (mode === 'received' && !RESPONDED_STATUSES.includes(filters.status)) {
      throw createError(400, 'Received mode supports only responded quote statuses');
    }

    query.status = filters.status;
  }

  if (filters.search && typeof filters.search === 'string') {
    const term = filters.search.trim();
    if (term) {
      const regex = new RegExp(escapeRegex(term), 'i');
      const productIds = await Product.find(
        {
          deletedAt: { $exists: false },
          $or: [{ name: regex }, { sku: regex }]
        },
        { _id: 1 }
      )
        .limit(100)
        .lean();

      const productIdList = productIds.map((product) => product._id);
      const orFilters = [{ 'request.requirements': regex }, { 'response.notes': regex }];
      if (productIdList.length) {
        orFilters.push({ product: { $in: productIdList } });
      }

      query.$or = orFilters;
    }
  }

  const [quotes, total] = await Promise.all([
    applyQuotePopulation(ProductQuote.find(query).sort({ updatedAt: -1 }).skip(offset).limit(limit)).lean(),
    ProductQuote.countDocuments(query)
  ]);

  return {
    quotes,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + quotes.length < total
    }
  };
};

const getQuoteById = async (quoteId, user) => {
  if (!user?.id) {
    throw createError(401, 'Authentication required');
  }

  const quote = await ProductQuote.findOne({
    _id: toObjectId(quoteId, 'quote id'),
    deletedAt: { $exists: false }
  }).lean();

  if (!quote) return null;

  if (!canAccessQuote(quote, user)) {
    throw createError(403, 'You are not allowed to view this quote');
  }

  return getQuoteByIdRaw(quoteId);
};

const respondToQuote = async (quoteId, payload, user) => {
  if (!user?.id) {
    throw createError(401, 'Authentication required');
  }

  const quote = await ProductQuote.findOne({
    _id: toObjectId(quoteId, 'quote id'),
    deletedAt: { $exists: false }
  });

  if (!quote) return null;

  const isSeller = String(quote.seller) === String(user.id);
  if (!isSeller && !isAdminRole(user.role)) {
    throw createError(403, 'Only the seller can respond to this quote');
  }

  if (!['pending', 'quoted'].includes(quote.status)) {
    throw createError(400, 'Quote cannot be responded to in its current status');
  }

  const statusFrom = quote.status;
  quote.response = {
    unitPrice: Number(payload.unitPrice),
    currency: normalizeMoneyCurrency(payload.currency),
    minOrderQty: payload.minOrderQty !== undefined ? Number(payload.minOrderQty) : undefined,
    leadTimeDays: payload.leadTimeDays !== undefined ? Number(payload.leadTimeDays) : undefined,
    validUntil: payload.validUntil,
    notes: payload.notes,
    respondedAt: new Date(),
    respondedBy: toObjectId(user.id, 'responder id')
  };
  quote.status = 'quoted';

  appendHistory(quote, {
    actorId: user.id,
    action: statusFrom === 'quoted' ? 'response_updated' : 'responded',
    statusFrom,
    statusTo: 'quoted',
    note: payload.notes
  });

  await quote.save();

  await notifyUserSafe({
    userId: String(quote.buyer),
    title: 'Quote received',
    body: 'A seller has responded to your quote request.',
    eventKey: 'quote.responded',
    data: {
      quoteId: String(quote._id),
      productId: String(quote.product)
    }
  });

  return getQuoteByIdRaw(quote._id);
};

const updateQuoteStatus = async (quoteId, payload, user) => {
  if (!user?.id) {
    throw createError(401, 'Authentication required');
  }

  const nextStatus = payload.status;
  if (!QUOTE_STATUSES.includes(nextStatus)) {
    throw createError(400, 'Invalid quote status');
  }

  const quote = await ProductQuote.findOne({
    _id: toObjectId(quoteId, 'quote id'),
    deletedAt: { $exists: false }
  });

  if (!quote) return null;

  const isBuyer = String(quote.buyer) === String(user.id);
  const isSeller = String(quote.seller) === String(user.id);

  if (BUYER_ACTION_STATUSES.includes(nextStatus)) {
    if (!isBuyer) {
      throw createError(403, 'Only the buyer can perform this action');
    }
  } else if (SELLER_ADMIN_ACTION_STATUSES.includes(nextStatus)) {
    if (!isSeller && !isAdminRole(user.role)) {
      throw createError(403, 'Only the seller or admin can expire this quote');
    }
  } else {
    throw createError(400, 'Unsupported status action for this endpoint');
  }

  if (quote.status === nextStatus) {
    return getQuoteByIdRaw(quote._id);
  }

  const allowedNextStatuses = STATUS_TRANSITIONS[quote.status] || [];
  if (!allowedNextStatuses.includes(nextStatus)) {
    throw createError(400, `Cannot move quote from ${quote.status} to ${nextStatus}`);
  }

  const statusFrom = quote.status;
  quote.status = nextStatus;

  appendHistory(quote, {
    actorId: user.id,
    action: `status_${nextStatus}`,
    statusFrom,
    statusTo: nextStatus,
    note: payload.note
  });

  await quote.save();

  const notifyTargetUser = isBuyer ? String(quote.seller) : String(quote.buyer);
  await notifyUserSafe({
    userId: notifyTargetUser,
    title: 'Quote status updated',
    body: `Quote status changed to ${nextStatus}.`,
    eventKey: 'quote.status.changed',
    data: {
      quoteId: String(quote._id),
      productId: String(quote.product),
      status: nextStatus
    }
  });

  return getQuoteByIdRaw(quote._id);
};

module.exports = {
  createQuote,
  listQuotes,
  getQuoteById,
  respondToQuote,
  updateQuoteStatus
};
