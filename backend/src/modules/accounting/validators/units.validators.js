const { body, param } = require('express-validator');

const unitIdParamValidation = [param('unitId').isMongoId().withMessage('Valid unitId is required')];

const createUnitValidation = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('symbol').trim().notEmpty().withMessage('symbol is required'),
  body('decimals').optional().isInt({ min: 0, max: 3 }).toInt(),
  body('baseUnit').optional().isMongoId(),
  body('conversionFactorToBase').optional().isFloat({ gt: 0 }).toFloat(),
  body('metadata').optional().isObject()
];

const updateUnitValidation = [
  body('name').optional().isString().trim().notEmpty(),
  body('symbol').optional().isString().trim().notEmpty(),
  body('decimals').optional().isInt({ min: 0, max: 3 }).toInt(),
  body('baseUnit').optional().isMongoId(),
  body('conversionFactorToBase').optional().isFloat({ gt: 0 }).toFloat(),
  body('metadata').optional().isObject()
];

module.exports = {
  unitIdParamValidation,
  createUnitValidation,
  updateUnitValidation
};

