const createError = require('http-errors');
const {
  listInternalInventoryItems,
  getInternalInventoryItemById,
  createInternalInventoryItem,
  updateInternalInventoryItem,
  deleteInternalInventoryItem,
  adjustInternalInventoryItem,
  listInternalInventoryMovements,
  getInternalInventoryDashboard
} = require('../services/internalInventory.service');

const requireCompanyId = (req) => {
  const companyId = req.user?.activeCompany;
  if (!companyId) {
    throw createError(400, 'No active company selected');
  }
  return companyId;
};

const getDashboardController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const dashboard = await getInternalInventoryDashboard(companyId);
    return res.json(dashboard);
  } catch (error) {
    return next(error);
  }
};

const listItemsController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await listInternalInventoryItems(companyId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getItemController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const item = await getInternalInventoryItemById(companyId, req.params.itemId);
    if (!item) {
      throw createError(404, 'Internal inventory item not found');
    }
    return res.json({ item });
  } catch (error) {
    return next(error);
  }
};

const createItemController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const item = await createInternalInventoryItem(companyId, req.user?.id, req.body);
    return res.status(201).json({ item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'An item with this SKU already exists' });
    }
    return next(error);
  }
};

const updateItemController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const item = await updateInternalInventoryItem(companyId, req.params.itemId, req.user?.id, req.body);
    if (!item) {
      throw createError(404, 'Internal inventory item not found');
    }
    return res.json({ item });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'An item with this SKU already exists' });
    }
    return next(error);
  }
};

const deleteItemController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const deleted = await deleteInternalInventoryItem(companyId, req.params.itemId, req.user?.id);
    if (!deleted) {
      throw createError(404, 'Internal inventory item not found');
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

const adjustItemController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await adjustInternalInventoryItem(companyId, req.params.itemId, req.user?.id, req.body);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const listItemMovementsController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const result = await listInternalInventoryMovements(companyId, req.params.itemId, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getDashboardController,
  listItemsController,
  getItemController,
  createItemController,
  updateItemController,
  deleteItemController,
  adjustItemController,
  listItemMovementsController
};
