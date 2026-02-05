const createError = require('http-errors');
const Unit = require('../../../models/unit.model');

const listUnits = async (companyId) => {
  return Unit.find({
    company: companyId,
    deletedAt: { $exists: false }
  })
    .sort({ name: 1 })
    .lean();
};

const createUnit = async (companyId, payload) => {
  let baseUnitId = payload.baseUnit;
  if (baseUnitId) {
    const baseUnit = await Unit.findOne({
      _id: baseUnitId,
      company: companyId,
      deletedAt: { $exists: false }
    }).lean();
    if (!baseUnit) {
      throw createError(404, 'Base unit not found');
    }
    baseUnitId = baseUnit._id;
  }

  const unit = await Unit.create({
    company: companyId,
    name: payload.name,
    symbol: payload.symbol,
    decimals: payload.decimals,
    baseUnit: baseUnitId,
    conversionFactorToBase: payload.conversionFactorToBase,
    metadata: payload.metadata
  });
  return unit.toObject();
};

const updateUnit = async (companyId, unitId, payload) => {
  const unit = await Unit.findOne({
    _id: unitId,
    company: companyId,
    deletedAt: { $exists: false }
  });
  if (!unit) return null;

  if (payload.baseUnit) {
    const baseUnit = await Unit.findOne({
      _id: payload.baseUnit,
      company: companyId,
      deletedAt: { $exists: false }
    });
    if (!baseUnit) {
      throw createError(404, 'Base unit not found');
    }
    unit.baseUnit = baseUnit._id;
  }

  ['name', 'symbol', 'decimals', 'conversionFactorToBase', 'metadata'].forEach((field) => {
    if (payload[field] !== undefined) {
      unit[field] = payload[field];
    }
  });

  await unit.save();
  return unit.toObject();
};

const deleteUnit = async (companyId, unitId) => {
  const unit = await Unit.findOne({
    _id: unitId,
    company: companyId,
    deletedAt: { $exists: false }
  });
  if (!unit) return null;

  unit.deletedAt = new Date();
  await unit.save();
  return true;
};

module.exports = {
  listUnits,
  createUnit,
  updateUnit,
  deleteUnit
};

