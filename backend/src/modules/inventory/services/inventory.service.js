const mongoose = require('mongoose');
const InventoryItem = require('../../../models/inventoryItem.model');
const { INVENTORY_CATEGORIES } = require('../../../constants/business');

/**
 * Get inventory category statistics
 * Returns all categories with their real item counts from database
 */
const getCategoryStats = async (companyId) => {
  const matchQuery = { deletedAt: { $exists: false } };

  if (companyId) {
    matchQuery.company = new mongoose.Types.ObjectId(companyId);
  }

  // Aggregate real counts from database
  const countsByCategory = await InventoryItem.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalQuantity: { $sum: '$quantity' }
      }
    }
  ]);

  // Convert to lookup map
  const countsMap = {};
  countsByCategory.forEach(item => {
    countsMap[item._id] = { count: item.count, totalQuantity: item.totalQuantity };
  });

  // Map categories with counts
  const categories = INVENTORY_CATEGORIES.map(category => ({
    id: category.id,
    title: category.title,
    count: countsMap[category.id]?.count || 0,
    totalQuantity: countsMap[category.id]?.totalQuantity || 0
  }));

  return { categories };
};

/**
 * Get items by category
 * Returns paginated list of items in a specific category
 */
const getItemsByCategory = async (companyId, categoryId, { limit = 20, offset = 0 } = {}) => {
  const query = {
    category: categoryId,
    deletedAt: { $exists: false }
  };

  if (companyId) {
    query.company = companyId;
  }

  const [items, total] = await Promise.all([
    InventoryItem.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    InventoryItem.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total
    }
  };
};

/**
 * Get all inventory items for a company
 */
const getAllItems = async (companyId, { limit = 50, offset = 0, category, status, search } = {}) => {
  const query = { deletedAt: { $exists: false } };

  if (companyId) {
    query.company = companyId;
  }
  if (category) {
    query.category = category;
  }
  if (status) {
    query.status = status;
  }
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { sku: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const [items, total] = await Promise.all([
    InventoryItem.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    InventoryItem.countDocuments(query)
  ]);

  return {
    items,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total
    }
  };
};

/**
 * Get a single inventory item by ID
 */
const getItemById = async (itemId, companyId) => {
  const query = { _id: itemId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = companyId;
  }
  return InventoryItem.findOne(query).lean();
};

/**
 * Create a new inventory item
 */
const createItem = async (itemData, userId, companyId) => {
  const item = new InventoryItem({
    ...itemData,
    company: companyId,
    createdBy: userId,
    lastUpdatedBy: userId
  });

  await item.save();
  return item.toObject();
};

/**
 * Update an inventory item
 */
const updateItem = async (itemId, updates, userId, companyId) => {
  const query = { _id: itemId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = companyId;
  }

  const item = await InventoryItem.findOneAndUpdate(
    query,
    {
      ...updates,
      lastUpdatedBy: userId,
      updatedAt: new Date()
    },
    { new: true, runValidators: true }
  );

  return item?.toObject() || null;
};

/**
 * Adjust item quantity (add or subtract)
 */
const adjustQuantity = async (itemId, adjustment, userId, companyId) => {
  const query = { _id: itemId, deletedAt: { $exists: false } };
  if (companyId) {
    query.company = companyId;
  }

  const item = await InventoryItem.findOne(query);
  if (!item) return null;

  item.quantity = Math.max(0, item.quantity + adjustment);
  item.lastUpdatedBy = userId;
  await item.save();

  return item.toObject();
};

/**
 * Soft delete an inventory item
 */
const deleteItem = async (itemId, companyId) => {
  const query = { _id: itemId };
  if (companyId) {
    query.company = companyId;
  }

  const result = await InventoryItem.findOneAndUpdate(
    query,
    { deletedAt: new Date() },
    { new: true }
  );

  return !!result;
};

/**
 * Get inventory stats for dashboard/stats screen
 */
const getInventoryStats = async (companyId) => {
  const matchQuery = { deletedAt: { $exists: false } };
  if (companyId) {
    matchQuery.company = new mongoose.Types.ObjectId(companyId);
  }

  const [
    totalItems,
    categoryStats,
    statusStats,
    valueStats
  ] = await Promise.all([
    InventoryItem.countDocuments(matchQuery),
    InventoryItem.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$category', count: { $sum: 1 }, totalQty: { $sum: '$quantity' } } }
    ]),
    InventoryItem.aggregate([
      { $match: matchQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    InventoryItem.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalCostValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          totalSellingValue: { $sum: { $multiply: ['$quantity', '$sellingPrice'] } },
          totalQuantity: { $sum: '$quantity' }
        }
      }
    ])
  ]);

  const categoryDistribution = INVENTORY_CATEGORIES.map(cat => {
    const stats = categoryStats.find(s => s._id === cat.id);
    return {
      id: cat.id,
      label: cat.title,
      count: stats?.count || 0,
      totalQuantity: stats?.totalQty || 0
    };
  });

  const statusBreakdown = { active: 0, low_stock: 0, out_of_stock: 0, discontinued: 0 };
  statusStats.forEach(s => {
    if (statusBreakdown.hasOwnProperty(s._id)) {
      statusBreakdown[s._id] = s.count;
    }
  });

  const values = valueStats[0] || { totalCostValue: 0, totalSellingValue: 0, totalQuantity: 0 };

  return {
    totalItems,
    totalQuantity: values.totalQuantity,
    totalCostValue: values.totalCostValue,
    totalSellingValue: values.totalSellingValue,
    categoryDistribution,
    statusBreakdown,
    lowStockCount: statusBreakdown.low_stock,
    outOfStockCount: statusBreakdown.out_of_stock
  };
};

module.exports = {
  getCategoryStats,
  getItemsByCategory,
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  adjustQuantity,
  deleteItem,
  getInventoryStats
};
