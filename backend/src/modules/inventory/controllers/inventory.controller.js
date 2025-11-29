const {
  getCategoryStats,
  getItemsByCategory,
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  adjustQuantity,
  deleteItem,
  getInventoryStats
} = require('../services/inventory.service');

/**
 * GET /api/inventory/categories
 * Returns all inventory categories with item counts
 */
const getCategoryStatsController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const result = await getCategoryStats(companyId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/inventory/categories/:categoryId/items
 * Returns items in a specific category
 */
const getItemsByCategoryController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const { categoryId } = req.params;
    const { limit, offset } = req.query;
    const result = await getItemsByCategory(companyId, categoryId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/inventory/items
 * Returns all inventory items with optional filters
 */
const getAllItemsController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const { limit, offset, category, status, search } = req.query;
    const result = await getAllItems(companyId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      category,
      status,
      search
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/inventory/items/:itemId
 * Returns a single inventory item
 */
const getItemByIdController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const { itemId } = req.params;
    const item = await getItemById(itemId, companyId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json(item);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/inventory/items
 * Creates a new inventory item
 */
const createItemController = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const companyId = req.user?.activeCompany;

    if (!companyId) {
      return res.status(400).json({ error: 'No active company selected' });
    }

    const item = await createItem(req.body, userId, companyId);
    return res.status(201).json(item);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'An item with this SKU already exists' });
    }
    return next(error);
  }
};

/**
 * PUT /api/inventory/items/:itemId
 * Updates an inventory item
 */
const updateItemController = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const companyId = req.user?.activeCompany;
    const { itemId } = req.params;

    const item = await updateItem(itemId, req.body, userId, companyId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json(item);
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/inventory/items/:itemId/quantity
 * Adjusts item quantity (add or subtract)
 */
const adjustQuantityController = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const companyId = req.user?.activeCompany;
    const { itemId } = req.params;
    const { adjustment } = req.body;

    if (typeof adjustment !== 'number') {
      return res.status(400).json({ error: 'Adjustment must be a number' });
    }

    const item = await adjustQuantity(itemId, adjustment, userId, companyId);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json(item);
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/inventory/items/:itemId
 * Soft deletes an inventory item
 */
const deleteItemController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const { itemId } = req.params;

    const deleted = await deleteItem(itemId, companyId);

    if (!deleted) {
      return res.status(404).json({ error: 'Item not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/inventory/stats
 * Returns inventory statistics for dashboard
 */
const getInventoryStatsController = async (req, res, next) => {
  try {
    const companyId = req.user?.activeCompany;
    const stats = await getInventoryStats(companyId);
    return res.json(stats);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getCategoryStatsController,
  getItemsByCategoryController,
  getAllItemsController,
  getItemByIdController,
  createItemController,
  updateItemController,
  adjustQuantityController,
  deleteItemController,
  getInventoryStatsController
};
