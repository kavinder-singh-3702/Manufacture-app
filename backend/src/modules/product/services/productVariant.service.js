const { isDeepStrictEqual } = require('node:util');
const mongoose = require('mongoose');
const Product = require('../../../models/product.model');
const ProductVariant = require('../../../models/productVariant.model');
const ProductVariantLog = require('../../../models/productVariantLog.model');
const { createStockAdjustmentForItem } = require('../../accounting/services/stockAdjustment.service');

const MAX_LIMIT = 100;

const mapToObject = (value) => (value instanceof Map ? Object.fromEntries(value) : value);

const toPlain = (doc) => {
  if (!doc) return null;
  if (typeof doc.toObject === 'function') {
    return doc.toObject({ versionKey: false });
  }
  return doc;
};

const shapeVariant = (doc) => {
  const plain = toPlain(doc);
  if (!plain) return null;

  // eslint-disable-next-line no-unused-vars
  const { __v, ...rest } = plain;

  return {
    ...rest,
    options: mapToObject(rest.options) || {},
    attributes: mapToObject(rest.attributes) || {},
    metadata: mapToObject(rest.metadata) || {}
  };
};

const shapeVariantLog = (doc) => {
  const plain = toPlain(doc);
  if (!plain) return null;

  // eslint-disable-next-line no-unused-vars
  const { __v, ...rest } = plain;

  return {
    ...rest,
    meta: mapToObject(rest.meta) || {}
  };
};

const normalizeMeta = (meta) => {
  if (!meta || typeof meta !== 'object') return undefined;
  const entries = Object.entries(meta).filter(([, value]) => value !== undefined);
  if (!entries.length) return undefined;
  return entries.reduce((acc, [key, value]) => {
    acc[key] = value;
    return acc;
  }, {});
};

const recordVariantLog = async ({
  companyId,
  productId,
  variantId,
  actorUserId,
  action,
  changes,
  before,
  after,
  note,
  meta
}) => {
  if (!companyId || !productId || !actorUserId || !action) {
    throw new Error('companyId, productId, actorUserId, and action are required to record a variant log');
  }

  const payload = {
    company: companyId,
    product: productId,
    variant: variantId,
    actor: actorUserId,
    action,
    changes: Array.isArray(changes) ? changes : [],
    before,
    after,
    note,
    meta: normalizeMeta(meta)
  };

  const log = await ProductVariantLog.create(payload);
  return shapeVariantLog(log);
};

const recordVariantLogSafe = async (params) => {
  try {
    return await recordVariantLog(params);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to record product variant log', error);
    return null;
  }
};

const getByPath = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

const valueToPlain = (value) => {
  if (value === undefined || value === null) return value;

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Map) {
    return Object.fromEntries(value);
  }

  if (Array.isArray(value)) {
    return value.map(valueToPlain);
  }

  if (typeof value === 'object' && typeof value.toObject === 'function') {
    return value.toObject({ versionKey: false });
  }

  if (typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = valueToPlain(value[key]);
      return acc;
    }, {});
  }

  return value;
};

const ensureProductExists = async (productId, companyId) => {
  const query = { _id: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }

  return Product.findOne(query).select('_id company').lean();
};

const listVariants = async (productId, companyId, { limit = 20, offset = 0, status } = {}) => {
  const product = await ensureProductExists(productId, companyId);
  if (!product) return null;

  const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;
  const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
  const cappedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);

  const query = { product: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }
  if (status) {
    query.status = status;
  }

  const [variants, total] = await Promise.all([
    ProductVariant.find(query).sort({ createdAt: -1 }).skip(parsedOffset).limit(cappedLimit).lean(),
    ProductVariant.countDocuments(query)
  ]);

  return {
    variants: variants.map(shapeVariant),
    pagination: {
      total,
      limit: cappedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + variants.length < total
    }
  };
};

const getVariantById = async (productId, variantId, companyId) => {
  const query = { _id: variantId, product: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }

  const variant = await ProductVariant.findOne(query).lean();
  return variant ? shapeVariant(variant) : null;
};

const createVariant = async (productId, companyId, payload, userId) => {
  const product = await ensureProductExists(productId, companyId);
  if (!product) return null;

  const cleanedPayload = { ...payload };
  if (cleanedPayload.sku === '' || cleanedPayload.sku === null) {
    delete cleanedPayload.sku;
  }
  if (cleanedPayload.barcode === '' || cleanedPayload.barcode === null) {
    delete cleanedPayload.barcode;
  }

  const variant = new ProductVariant({
    ...cleanedPayload,
    product: productId,
    company: product.company,
    createdBy: userId,
    lastUpdatedBy: userId
  });

  await variant.save();

  await recordVariantLogSafe({
    companyId: product.company,
    productId,
    variantId: variant._id,
    actorUserId: userId,
    action: 'variant.created',
    after: shapeVariant(variant)
  });

  return shapeVariant(variant);
};

const updateVariant = async (productId, variantId, updates, userId, companyId) => {
  const query = { _id: variantId, product: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }

  const variant = await ProductVariant.findOne(query);
  if (!variant) return null;

  const before = shapeVariant(variant);

  const cleanedUpdates = { ...updates };
  delete cleanedUpdates.product;
  delete cleanedUpdates.company;
  delete cleanedUpdates.createdBy;
  delete cleanedUpdates.optionsSignature;
  delete cleanedUpdates.deletedAt;
  delete cleanedUpdates.createdAt;
  delete cleanedUpdates.updatedAt;
  delete cleanedUpdates.lastUpdatedBy;

  if (cleanedUpdates.sku === '' || cleanedUpdates.sku === null) {
    cleanedUpdates.sku = undefined;
  }
  if (cleanedUpdates.barcode === '' || cleanedUpdates.barcode === null) {
    cleanedUpdates.barcode = undefined;
  }

  variant.set(cleanedUpdates);
  variant.lastUpdatedBy = userId;

  const modifiedPaths = variant
    .modifiedPaths()
    .filter((path) => !['updatedAt', 'lastUpdatedBy', '__v'].includes(path));

  const changes = modifiedPaths
    .map((path) => ({
      path,
      from: valueToPlain(getByPath(before, path)),
      to: valueToPlain(variant.get(path))
    }))
    .filter((change) => !isDeepStrictEqual(change.from, change.to));

  await variant.save();

  await recordVariantLogSafe({
    companyId: variant.company,
    productId,
    variantId: variant._id,
    actorUserId: userId,
    action: 'variant.updated',
    changes
  });

  return shapeVariant(variant);
};

const adjustVariantQuantity = async (productId, variantId, adjustment, userId, companyId) => {
  const query = { _id: variantId, product: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }

  const variant = await ProductVariant.findOne(query);
  if (!variant) return null;

  const adjustmentValue = Number(adjustment);
  if (adjustmentValue !== 0) {
    await createStockAdjustmentForItem({
      companyId: variant.company,
      userId,
      productId,
      variantId,
      adjustment: adjustmentValue,
      narration: `Variant quantity adjusted by ${adjustmentValue}`
    });
  }

  const refreshedVariant = await ProductVariant.findOne(query);
  const shapedVariant = shapeVariant(refreshedVariant);
  if (adjustmentValue !== 0) {
    const beforeQty = Number(variant.availableQuantity || 0);
    await recordVariantLogSafe({
      companyId: variant.company,
      productId,
      variantId: variant._id,
      actorUserId: userId,
      action: 'variant.quantity_adjusted',
      changes: [{ path: 'availableQuantity', from: beforeQty, to: shapedVariant.availableQuantity }],
      meta: { adjustment: adjustmentValue, source: 'stock_adjustment_voucher' }
    });
  }

  return shapedVariant;
};

const deleteVariant = async (productId, variantId, userId, companyId) => {
  const query = { _id: variantId, product: productId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = new mongoose.Types.ObjectId(companyId);
  }

  const variant = await ProductVariant.findOne(query);
  if (!variant) return null;

  const before = shapeVariant(variant);

  variant.deletedAt = new Date();
  variant.status = 'archived';
  variant.lastUpdatedBy = userId;

  await variant.save();

  await recordVariantLogSafe({
    companyId: variant.company,
    productId,
    variantId: variant._id,
    actorUserId: userId,
    action: 'variant.deleted',
    before
  });

  return true;
};

const listVariantLogs = async (productId, companyId, { limit = 50, offset = 0, variantId, action } = {}) => {
  if (!companyId) return null;
  const product = await ensureProductExists(productId, companyId);
  if (!product) return null;

  const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
  const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
  const cappedLimit = Math.min(Math.max(parsedLimit, 1), MAX_LIMIT);

  const query = { company: new mongoose.Types.ObjectId(companyId), product: new mongoose.Types.ObjectId(productId) };
  if (variantId) {
    query.variant = new mongoose.Types.ObjectId(variantId);
  }
  if (action) {
    query.action = action;
  }

  const [logs, total] = await Promise.all([
    ProductVariantLog.find(query).sort({ createdAt: -1 }).skip(parsedOffset).limit(cappedLimit).lean(),
    ProductVariantLog.countDocuments(query)
  ]);

  return {
    logs: logs.map(shapeVariantLog),
    pagination: {
      total,
      limit: cappedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + logs.length < total
    }
  };
};

module.exports = {
  listVariants,
  getVariantById,
  createVariant,
  updateVariant,
  adjustVariantQuantity,
  deleteVariant,
  listVariantLogs
};
