const { body, param, query } = require('express-validator');
const { PRODUCT_VARIANT_STATUSES, PRODUCT_VARIANT_LOG_ACTIONS } = require('../../../constants/productVariant');

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const variantIdParamValidation = [param('variantId').isMongoId().withMessage('Valid variant id is required')];

const listVariantsQueryValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('status').optional().isIn(PRODUCT_VARIANT_STATUSES)
];

const validateOptions = body('options')
  .custom((value) => isPlainObject(value) && Object.keys(value).length > 0)
  .withMessage('Variant options are required (object with at least one key)')
  .custom((value) => {
    const keys = Object.keys(value || {});
    if (keys.length > 25) {
      throw new Error('Variant options exceed the maximum of 25 keys');
    }
    keys.forEach((key) => {
      const normalized = String(key).trim();
      if (!normalized) {
        throw new Error('Variant option keys must not be empty');
      }
      if (normalized.length > 50) {
        throw new Error(`Variant option key "${normalized}" is too long`);
      }
    });
    return true;
  });

const validateOptionsOptional = body('options')
  .optional()
  .custom((value) => isPlainObject(value) && Object.keys(value).length > 0)
  .withMessage('Variant options must be a non-empty object')
  .custom((value) => {
    const keys = Object.keys(value || {});
    if (keys.length > 25) {
      throw new Error('Variant options exceed the maximum of 25 keys');
    }
    keys.forEach((key) => {
      const normalized = String(key).trim();
      if (!normalized) {
        throw new Error('Variant option keys must not be empty');
      }
      if (normalized.length > 50) {
        throw new Error(`Variant option key "${normalized}" is too long`);
      }
    });
    return true;
  });

const createVariantValidation = [
  body('title').optional().isString().trim().isLength({ max: 200 }),
  body('sku').optional().isString().trim(),
  body('barcode').optional().isString().trim().isLength({ max: 120 }),
  validateOptions,
  body('price').optional({ nullable: true }).custom((value) => value === null || isPlainObject(value)),
  body('price.amount')
    .if((value, { req }) => req.body.price !== undefined && req.body.price !== null)
    .isFloat({ min: 0 })
    .withMessage('Price amount must be 0 or greater'),
  body('price.currency').optional().isString().trim(),
  body('price.unit').optional().isString().trim(),
  body('minStockQuantity').optional().isInt({ min: 0 }).toInt(),
  body('availableQuantity').optional().isInt({ min: 0 }).toInt(),
  body('unit').optional().isString().trim().isLength({ max: 50 }),
  body('status').optional().isIn(PRODUCT_VARIANT_STATUSES),
  body('attributes').optional().isObject(),
  body('metadata').optional().isObject()
];

const updateVariantValidation = [
  body('title').optional().isString().trim().isLength({ max: 200 }),
  body('sku').optional().isString().trim(),
  body('barcode').optional().isString().trim().isLength({ max: 120 }),
  validateOptionsOptional,
  body('price').optional({ nullable: true }).custom((value) => value === null || isPlainObject(value)),
  body('price.amount')
    .if((value, { req }) => req.body.price !== undefined && req.body.price !== null)
    .isFloat({ min: 0 })
    .withMessage('Price amount must be 0 or greater'),
  body('price.currency').optional().isString().trim(),
  body('price.unit').optional().isString().trim(),
  body('minStockQuantity').optional().isInt({ min: 0 }).toInt(),
  body('availableQuantity').optional().isInt({ min: 0 }).toInt(),
  body('unit').optional().isString().trim().isLength({ max: 50 }),
  body('status').optional().isIn(PRODUCT_VARIANT_STATUSES),
  body('attributes').optional().isObject(),
  body('metadata').optional().isObject()
];

const adjustVariantQuantityValidation = [
  body('adjustment')
    .isNumeric()
    .withMessage('Quantity adjustment must be a number')
    .custom((value) => typeof value === 'number')
];

const variantLogsQueryValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('variantId').optional().isMongoId(),
  query('action').optional().isIn(PRODUCT_VARIANT_LOG_ACTIONS)
];

module.exports = {
  variantIdParamValidation,
  listVariantsQueryValidation,
  createVariantValidation,
  updateVariantValidation,
  adjustVariantQuantityValidation,
  variantLogsQueryValidation
};
