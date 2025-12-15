const { body, param } = require('express-validator');
const { PRODUCT_CATEGORIES, PRODUCT_STATUSES, PRODUCT_VISIBILITY, DISCOUNT_TYPES } = require('../../../constants/product');

const CATEGORY_IDS = PRODUCT_CATEGORIES.map((c) => c.id);

const createProductValidation = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('sku').optional().isString(),
  body('category')
    .notEmpty()
    .isString()
    .custom((value) => CATEGORY_IDS.includes(value))
    .withMessage('Category is invalid'),
  body('price').isObject().withMessage('Price details are required'),
  body('price.amount').isFloat({ min: 0 }).withMessage('Price amount must be 0 or greater'),
  body('price.currency').optional().isString(),
  body('price.unit').optional().isString(),
  body('minStockQuantity').optional().isInt({ min: 0 }),
  body('availableQuantity').optional().isInt({ min: 0 }),
  body('unit').optional().isString(),
  body('visibility').optional().isIn(PRODUCT_VISIBILITY),
  body('status').optional().isIn(PRODUCT_STATUSES),
  body('contactPreferences').optional().isObject(),
  body('contactPreferences.allowChat').optional().isBoolean(),
  body('contactPreferences.allowCall').optional().isBoolean(),
  body('attributes').optional().isObject(),
  body('metadata').optional().isObject()
];

const updateProductValidation = [
  body('name').optional().trim().notEmpty(),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('sku').optional().isString(),
  body('category')
    .optional()
    .isString()
    .custom((value) => CATEGORY_IDS.includes(value))
    .withMessage('Category is invalid'),
  body('price').optional().isObject(),
  body('price.amount').optional().isFloat({ min: 0 }),
  body('price.currency').optional().isString(),
  body('price.unit').optional().isString(),
  body('minStockQuantity').optional().isInt({ min: 0 }),
  body('availableQuantity').optional().isInt({ min: 0 }),
  body('unit').optional().isString(),
  body('visibility').optional().isIn(PRODUCT_VISIBILITY),
  body('status').optional().isIn(PRODUCT_STATUSES),
  body('contactPreferences').optional().isObject(),
  body('contactPreferences.allowChat').optional().isBoolean(),
  body('contactPreferences.allowCall').optional().isBoolean(),
  body('attributes').optional().isObject(),
  body('metadata').optional().isObject()
];

const productIdParamValidation = [param('productId').isMongoId().withMessage('Valid product id is required')];
const categoryIdParamValidation = [param('categoryId').isString().notEmpty().withMessage('Category id is required')];

const applyDiscountValidation = [
  body('userId').isMongoId().withMessage('Target user id is required'),
  body('type').optional().isIn(DISCOUNT_TYPES),
  body('value').isFloat({ gt: 0 }).withMessage('Discount value must be greater than 0'),
  body('reason').optional().isString().isLength({ max: 300 }),
  body('expiresAt').optional().isISO8601().toDate()
];

const uploadProductImageValidation = [
  body('fileName').trim().notEmpty().withMessage('File name is required'),
  body('mimeType').optional().isString(),
  body('content').isString().notEmpty().withMessage('Base64 content is required')
];

const adjustQuantityValidation = [
  body('adjustment')
    .isNumeric()
    .withMessage('Quantity adjustment must be a number')
    .custom((value) => typeof value === 'number')
];

module.exports = {
  createProductValidation,
  updateProductValidation,
  productIdParamValidation,
  categoryIdParamValidation,
  applyDiscountValidation,
  uploadProductImageValidation,
  adjustQuantityValidation
};
