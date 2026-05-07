const mongoose = require('mongoose');
const createError = require('http-errors');
const ProductInquiry = require('../../../models/productInquiry.model');
const Product = require('../../../models/product.model');
const ProductVariant = require('../../../models/productVariant.model');
const User = require('../../../models/user.model');
const { PRODUCT_INQUIRY_STATUSES } = require('../../../constants/productInquiry');

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);

const toObjectId = (value, fieldLabel = 'id') => {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (!isValidObjectId(value)) throw createError(400, `Invalid ${fieldLabel}`);
  return new mongoose.Types.ObjectId(value);
};

const applyPopulation = (query) =>
  query
    .populate({ path: 'product', select: '_id name images price category' })
    .populate({ path: 'variant', select: '_id title options' })
    .populate({ path: 'buyer', select: '_id displayName email phone' });

const createInquiry = async (payload, user) => {
  if (!user?.id) throw createError(401, 'Authentication required');

  const productId = toObjectId(payload.productId, 'productId');
  const product = await Product.findOne({ _id: productId, deletedAt: { $exists: false } })
    .select('_id name price createdByRole')
    .lean();

  if (!product) throw createError(404, 'Product not found');
  if (product.createdByRole !== 'admin') {
    throw createError(400, 'This product is not available for inquiry');
  }

  let variantId;
  if (payload.variantId) {
    variantId = toObjectId(payload.variantId, 'variantId');
    const variant = await ProductVariant.findOne({
      _id: variantId,
      product: productId,
      deletedAt: { $exists: false }
    }).lean();
    if (!variant) throw createError(404, 'Variant not found');
  }

  const buyerUser = await User.findById(user.id).select('displayName email phone').lean();

  const inquiry = await ProductInquiry.create({
    product: productId,
    variant: variantId,
    buyer: toObjectId(user.id, 'buyer'),
    buyerSnapshot: {
      name: buyerUser?.displayName || undefined,
      email: buyerUser?.email || undefined,
      phone: buyerUser?.phone || undefined,
    },
    productSnapshot: {
      name: product.name,
      amount: product.price?.amount,
      currency: product.price?.currency,
    },
    quantity: payload.quantity || undefined,
    location: payload.location?.trim() || undefined,
    message: payload.message?.trim() || undefined,
  });

  return applyPopulation(ProductInquiry.findById(inquiry._id)).lean();
};

const listUserInquiries = async (userId, filters = {}) => {
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  const query = { buyer: toObjectId(userId, 'userId') };
  if (filters.status && PRODUCT_INQUIRY_STATUSES.includes(filters.status)) {
    query.status = filters.status;
  }

  const [inquiries, total] = await Promise.all([
    applyPopulation(ProductInquiry.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit)).lean(),
    ProductInquiry.countDocuments(query),
  ]);

  return { inquiries, pagination: { total, limit, offset, hasMore: offset + limit < total } };
};

const listAdminInquiries = async (filters = {}) => {
  const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 100);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  const query = {};
  if (filters.status && PRODUCT_INQUIRY_STATUSES.includes(filters.status)) {
    query.status = filters.status;
  }
  if (filters.productId && isValidObjectId(filters.productId)) {
    query.product = new mongoose.Types.ObjectId(filters.productId);
  }
  if (filters.buyerId && isValidObjectId(filters.buyerId)) {
    query.buyer = new mongoose.Types.ObjectId(filters.buyerId);
  }

  const [inquiries, total] = await Promise.all([
    applyPopulation(ProductInquiry.find(query).sort({ createdAt: -1 }).skip(offset).limit(limit)).lean(),
    ProductInquiry.countDocuments(query),
  ]);

  return { inquiries, pagination: { total, limit, offset, hasMore: offset + limit < total } };
};

const getAdminInquiry = async (inquiryId) => {
  const id = toObjectId(inquiryId, 'inquiryId');
  return applyPopulation(ProductInquiry.findById(id)).lean();
};

const updateInquiryStatus = async (inquiryId, payload) => {
  const id = toObjectId(inquiryId, 'inquiryId');
  if (!PRODUCT_INQUIRY_STATUSES.includes(payload.status)) {
    throw createError(400, 'Invalid inquiry status');
  }

  const inquiry = await ProductInquiry.findById(id);
  if (!inquiry) return null;

  inquiry.status = payload.status;
  if (typeof payload.adminNotes === 'string') {
    inquiry.adminNotes = payload.adminNotes.trim() || undefined;
  }
  await inquiry.save();

  return applyPopulation(ProductInquiry.findById(id)).lean();
};

module.exports = {
  createInquiry,
  listUserInquiries,
  listAdminInquiries,
  getAdminInquiry,
  updateInquiryStatus,
};
