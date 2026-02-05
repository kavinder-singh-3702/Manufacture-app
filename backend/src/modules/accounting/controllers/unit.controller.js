const createError = require('http-errors');
const {
  listUnits,
  createUnit,
  updateUnit,
  deleteUnit
} = require('../services/unit.service');
const { ensureAccountingSetup } = require('../services/bootstrap.service');

const requireCompanyId = (req) => {
  const companyId = req.user?.activeCompany;
  if (!companyId) {
    throw createError(400, 'No active company selected');
  }
  return companyId;
};

const listUnitsController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    await ensureAccountingSetup(companyId);
    const units = await listUnits(companyId);
    return res.json({ units });
  } catch (error) {
    return next(error);
  }
};

const createUnitController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const unit = await createUnit(companyId, req.body);
    return res.status(201).json({ unit });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Unit with same name already exists' });
    }
    return next(error);
  }
};

const updateUnitController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const unit = await updateUnit(companyId, req.params.unitId, req.body);
    if (!unit) {
      throw createError(404, 'Unit not found');
    }
    return res.json({ unit });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Unit with same name already exists' });
    }
    return next(error);
  }
};

const deleteUnitController = async (req, res, next) => {
  try {
    const companyId = requireCompanyId(req);
    const deleted = await deleteUnit(companyId, req.params.unitId);
    if (!deleted) {
      throw createError(404, 'Unit not found');
    }
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listUnitsController,
  createUnitController,
  updateUnitController,
  deleteUnitController
};

