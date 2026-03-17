const createError = require('http-errors');
const InternalInventoryItem = require('../../../models/internalInventoryItem.model');
const InternalStockMovement = require('../../../models/internalStockMovement.model');
const { roundMoney, roundQuantity, sanitizeMeta } = require('./helpers');

const MAX_LIMIT = 100;

const mapToObject = (value) => (value instanceof Map ? Object.fromEntries(value) : value);

const normalizeItem = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject({ versionKey: false }) : doc;

  const onHandQty = Number(plain.onHandQty || 0);
  const reorderLevel = Number(plain.reorderLevel || 0);
  let stockStatus = 'in_stock';
  if (onHandQty <= 0) stockStatus = 'out_of_stock';
  else if (onHandQty <= reorderLevel) stockStatus = 'low_stock';

  return {
    ...plain,
    onHandQty: roundQuantity(onHandQty),
    reorderLevel: roundQuantity(reorderLevel),
    avgCost: roundMoney(plain.avgCost),
    totalValue: roundMoney(plain.totalValue),
    stockStatus,
    metadata: mapToObject(plain.metadata) || {}
  };
};

const normalizeMovement = (doc) => {
  if (!doc) return null;
  const plain = typeof doc.toObject === 'function' ? doc.toObject({ versionKey: false }) : doc;

  return {
    ...plain,
    qtyDelta: roundQuantity(plain.qtyDelta),
    qtyAfter: roundQuantity(plain.qtyAfter),
    unitCost: roundMoney(plain.unitCost),
    valueDelta: roundMoney(plain.valueDelta),
    metadata: mapToObject(plain.metadata) || {}
  };
};

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const parseLimitOffset = ({ limit = 20, offset = 0 } = {}) => {
  const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;
  const parsedOffset = Number.isFinite(Number(offset)) ? Number(offset) : 0;
  return {
    limit: Math.min(Math.max(parsedLimit, 1), MAX_LIMIT),
    offset: Math.max(parsedOffset, 0)
  };
};

const getSortOption = (sort) => {
  switch (sort) {
    case 'nameAsc':
      return { name: 1 };
    case 'nameDesc':
      return { name: -1 };
    case 'qtyDesc':
      return { onHandQty: -1, updatedAt: -1 };
    case 'qtyAsc':
      return { onHandQty: 1, updatedAt: -1 };
    case 'valueDesc':
      return { totalValue: -1, updatedAt: -1 };
    case 'valueAsc':
      return { totalValue: 1, updatedAt: -1 };
    case 'updatedAtAsc':
      return { updatedAt: 1 };
    case 'updatedAtDesc':
    default:
      return { updatedAt: -1 };
  }
};

const buildStatusFilter = (status) => {
  if (status === 'out_of_stock') {
    return { onHandQty: { $lte: 0 } };
  }

  if (status === 'low_stock') {
    return {
      $expr: {
        $and: [{ $gt: ['$onHandQty', 0] }, { $lte: ['$onHandQty', '$reorderLevel'] }]
      }
    };
  }

  if (status === 'in_stock') {
    return {
      $expr: {
        $gt: ['$onHandQty', '$reorderLevel']
      }
    };
  }

  return {};
};

const listInternalInventoryItems = async (
  companyId,
  { search, category, status, sort, limit = 20, offset = 0 } = {}
) => {
  const { limit: cappedLimit, offset: parsedOffset } = parseLimitOffset({ limit, offset });

  const query = {
    company: companyId,
    deletedAt: { $exists: false },
    ...buildStatusFilter(status)
  };

  if (category) {
    query.category = String(category).trim();
  }

  if (search) {
    const regex = new RegExp(String(search).trim(), 'i');
    query.$or = [{ name: regex }, { sku: regex }, { category: regex }];
  }

  const [items, total] = await Promise.all([
    InternalInventoryItem.find(query)
      .sort(getSortOption(sort))
      .skip(parsedOffset)
      .limit(cappedLimit)
      .lean(),
    InternalInventoryItem.countDocuments(query)
  ]);

  return {
    items: items.map(normalizeItem),
    pagination: {
      total,
      limit: cappedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + items.length < total
    }
  };
};

const getInternalInventoryItemById = async (companyId, itemId) => {
  const item = await InternalInventoryItem.findOne({
    _id: itemId,
    company: companyId,
    deletedAt: { $exists: false }
  }).lean();

  return normalizeItem(item);
};

const createInternalInventoryItem = async (companyId, userId, payload = {}) => {
  const name = String(payload.name || '').trim();
  if (!name) {
    throw createError(422, 'name is required');
  }

  const category = String(payload.category || '').trim();
  if (!category) {
    throw createError(422, 'category is required');
  }

  const onHandQty = Math.max(0, roundQuantity(parseNumber(payload.onHandQty, 0)));
  const reorderLevel = Math.max(0, roundQuantity(parseNumber(payload.reorderLevel, 0)));
  const avgCost = Math.max(0, roundMoney(parseNumber(payload.avgCost, 0)));
  const totalValue = roundMoney(onHandQty * avgCost);

  const doc = new InternalInventoryItem({
    company: companyId,
    name,
    sku: payload.sku ? String(payload.sku).trim().toUpperCase() : undefined,
    category,
    unit: payload.unit ? String(payload.unit).trim() : 'units',
    onHandQty,
    reorderLevel,
    avgCost,
    totalValue,
    createdBy: userId,
    lastUpdatedBy: userId,
    metadata: sanitizeMeta(payload.metadata)
  });

  await doc.save();

  if (onHandQty > 0) {
    await InternalStockMovement.create({
      company: companyId,
      item: doc._id,
      movementType: 'adjust',
      qtyDelta: onHandQty,
      qtyAfter: onHandQty,
      unitCost: avgCost,
      valueDelta: totalValue,
      note: 'Initial stock',
      createdBy: userId
    });
  }

  return normalizeItem(doc);
};

const updateInternalInventoryItem = async (companyId, itemId, userId, payload = {}) => {
  const doc = await InternalInventoryItem.findOne({
    _id: itemId,
    company: companyId,
    deletedAt: { $exists: false }
  });

  if (!doc) return null;

  if (payload.name !== undefined) {
    const name = String(payload.name || '').trim();
    if (!name) throw createError(422, 'name cannot be empty');
    doc.name = name;
  }

  if (payload.sku !== undefined) {
    const sku = String(payload.sku || '').trim();
    doc.sku = sku ? sku.toUpperCase() : undefined;
  }

  if (payload.category !== undefined) {
    const category = String(payload.category || '').trim();
    if (!category) throw createError(422, 'category cannot be empty');
    doc.category = category;
  }

  if (payload.unit !== undefined) {
    const unit = String(payload.unit || '').trim();
    if (!unit) throw createError(422, 'unit cannot be empty');
    doc.unit = unit;
  }

  if (payload.reorderLevel !== undefined) {
    doc.reorderLevel = Math.max(0, roundQuantity(parseNumber(payload.reorderLevel, doc.reorderLevel)));
  }

  if (payload.avgCost !== undefined) {
    doc.avgCost = Math.max(0, roundMoney(parseNumber(payload.avgCost, doc.avgCost)));
    doc.totalValue = roundMoney(doc.onHandQty * doc.avgCost);
  }

  if (payload.metadata !== undefined) {
    doc.metadata = sanitizeMeta(payload.metadata);
  }

  doc.lastUpdatedBy = userId;
  await doc.save();

  return normalizeItem(doc);
};

const deleteInternalInventoryItem = async (companyId, itemId, userId) => {
  const doc = await InternalInventoryItem.findOneAndUpdate(
    {
      _id: itemId,
      company: companyId,
      deletedAt: { $exists: false }
    },
    {
      $set: {
        deletedAt: new Date(),
        lastUpdatedBy: userId
      }
    },
    { new: true }
  );

  return Boolean(doc);
};

const adjustInternalInventoryItem = async (companyId, itemId, userId, payload = {}) => {
  const movementType = payload.movementType;
  if (!['in', 'out', 'adjust'].includes(movementType)) {
    throw createError(422, 'movementType must be one of in, out, adjust');
  }

  const rawQuantity = parseNumber(payload.quantity);
  if (!Number.isFinite(rawQuantity) || rawQuantity === 0) {
    throw createError(422, 'quantity must be a non-zero number');
  }

  if ((movementType === 'in' || movementType === 'out') && rawQuantity < 0) {
    throw createError(422, 'quantity must be positive for in/out movement');
  }

  const doc = await InternalInventoryItem.findOne({
    _id: itemId,
    company: companyId,
    deletedAt: { $exists: false }
  });

  if (!doc) {
    throw createError(404, 'Internal inventory item not found');
  }

  const quantity = roundQuantity(rawQuantity);
  let qtyDelta = quantity;
  if (movementType === 'out') qtyDelta = -Math.abs(quantity);
  if (movementType === 'in') qtyDelta = Math.abs(quantity);

  const previousQty = roundQuantity(doc.onHandQty);
  const previousValue = roundMoney(doc.totalValue);
  const previousAvg = roundMoney(doc.avgCost);

  const nextQty = roundQuantity(previousQty + qtyDelta);
  if (nextQty < 0) {
    throw createError(409, 'Insufficient stock to complete this adjustment');
  }

  let costForMovement = previousAvg;
  if (qtyDelta > 0) {
    const unitCost = parseNumber(payload.unitCost, previousAvg);
    costForMovement = Math.max(0, roundMoney(unitCost));
  }

  let nextValue = previousValue;
  if (qtyDelta > 0) {
    nextValue = roundMoney(previousValue + qtyDelta * costForMovement);
  } else if (qtyDelta < 0) {
    nextValue = roundMoney(Math.max(0, previousValue + qtyDelta * previousAvg));
  }

  const valueDelta = roundMoney(nextValue - previousValue);
  const nextAvg = nextQty > 0 ? roundMoney(nextValue / nextQty) : 0;

  doc.onHandQty = nextQty;
  doc.totalValue = nextValue;
  doc.avgCost = nextAvg;
  doc.lastUpdatedBy = userId;
  await doc.save();

  const movement = await InternalStockMovement.create({
    company: companyId,
    item: doc._id,
    movementType,
    qtyDelta,
    qtyAfter: nextQty,
    unitCost: costForMovement,
    valueDelta,
    note: payload.note ? String(payload.note).trim() : undefined,
    metadata: sanitizeMeta(payload.metadata),
    createdBy: userId
  });

  return {
    item: normalizeItem(doc),
    movement: normalizeMovement(movement)
  };
};

const listInternalInventoryMovements = async (
  companyId,
  itemId,
  { limit = 20, offset = 0 } = {}
) => {
  const { limit: cappedLimit, offset: parsedOffset } = parseLimitOffset({ limit, offset });

  const query = {
    company: companyId,
    item: itemId
  };

  const [rows, total] = await Promise.all([
    InternalStockMovement.find(query)
      .populate('item', 'name sku category unit')
      .sort({ createdAt: -1 })
      .skip(parsedOffset)
      .limit(cappedLimit)
      .lean(),
    InternalStockMovement.countDocuments(query)
  ]);

  return {
    rows: rows.map(normalizeMovement),
    pagination: {
      total,
      limit: cappedLimit,
      offset: parsedOffset,
      hasMore: parsedOffset + rows.length < total
    }
  };
};

const getInternalInventoryDashboard = async (companyId) => {
  const match = {
    company: companyId,
    deletedAt: { $exists: false }
  };

  const [summaryAgg, categoryAgg, lowStockItems, recentMovements] = await Promise.all([
    InternalInventoryItem.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$onHandQty' },
          totalValue: { $sum: '$totalValue' },
          inStockCount: {
            $sum: {
              $cond: [{ $gt: ['$onHandQty', '$reorderLevel'] }, 1, 0]
            }
          },
          lowStockCount: {
            $sum: {
              $cond: [{ $and: [{ $gt: ['$onHandQty', 0] }, { $lte: ['$onHandQty', '$reorderLevel'] }] }, 1, 0]
            }
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $lte: ['$onHandQty', 0] }, 1, 0]
            }
          }
        }
      }
    ]),
    InternalInventoryItem.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$onHandQty' },
          totalValue: { $sum: '$totalValue' }
        }
      },
      { $sort: { totalValue: -1, count: -1 } }
    ]),
    InternalInventoryItem.find({
      ...match,
      $expr: { $and: [{ $gt: ['$onHandQty', 0] }, { $lte: ['$onHandQty', '$reorderLevel'] }] }
    })
      .select('_id name sku category unit onHandQty reorderLevel avgCost totalValue updatedAt')
      .sort({ onHandQty: 1, updatedAt: -1 })
      .limit(8)
      .lean(),
    InternalStockMovement.find({ company: companyId })
      .populate('item', 'name sku category unit')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean()
  ]);

  const summary = summaryAgg[0] || {
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    inStockCount: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  };

  return {
    totalItems: Number(summary.totalItems || 0),
    totalQuantity: roundQuantity(summary.totalQuantity || 0),
    totalValue: roundMoney(summary.totalValue || 0),
    statusBreakdown: {
      in_stock: Number(summary.inStockCount || 0),
      low_stock: Number(summary.lowStockCount || 0),
      out_of_stock: Number(summary.outOfStockCount || 0)
    },
    lowStockCount: Number(summary.lowStockCount || 0),
    outOfStockCount: Number(summary.outOfStockCount || 0),
    categoryDistribution: categoryAgg.map((item) => ({
      category: item._id || 'Uncategorized',
      count: Number(item.count || 0),
      totalQuantity: roundQuantity(item.totalQuantity || 0),
      totalValue: roundMoney(item.totalValue || 0)
    })),
    lowStockItems: lowStockItems.map(normalizeItem),
    recentMovements: recentMovements.map(normalizeMovement)
  };
};

module.exports = {
  listInternalInventoryItems,
  getInternalInventoryItemById,
  createInternalInventoryItem,
  updateInternalInventoryItem,
  deleteInternalInventoryItem,
  adjustInternalInventoryItem,
  listInternalInventoryMovements,
  getInternalInventoryDashboard
};
