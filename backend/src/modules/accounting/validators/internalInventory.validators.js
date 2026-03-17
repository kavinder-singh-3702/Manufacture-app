const { body, param, query } = require('express-validator');

const itemIdParamValidation = [param('itemId').isMongoId().withMessage('Valid itemId is required')];

const listItemsValidation = [
  query('search').optional().isString().trim().isLength({ max: 120 }),
  query('category').optional().isString().trim().isLength({ max: 120 }),
  query('status').optional().isIn(['in_stock', 'low_stock', 'out_of_stock']),
  query('sort')
    .optional()
    .isIn(['nameAsc', 'nameDesc', 'qtyDesc', 'qtyAsc', 'valueDesc', 'valueAsc', 'updatedAtDesc', 'updatedAtAsc']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

const createItemValidation = [
  body('name').isString().trim().isLength({ min: 1, max: 200 }).withMessage('name is required'),
  body('sku').optional().isString().trim().isLength({ max: 80 }),
  body('category').isString().trim().isLength({ min: 1, max: 120 }).withMessage('category is required'),
  body('unit').optional().isString().trim().isLength({ min: 1, max: 40 }),
  body('onHandQty').optional().isFloat({ min: 0 }),
  body('reorderLevel').optional().isFloat({ min: 0 }),
  body('avgCost').optional().isFloat({ min: 0 }),
  body('metadata').optional().isObject().withMessage('metadata must be an object')
];

const updateItemValidation = [
  body('name').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('sku').optional().isString().trim().isLength({ max: 80 }),
  body('category').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('unit').optional().isString().trim().isLength({ min: 1, max: 40 }),
  body('reorderLevel').optional().isFloat({ min: 0 }),
  body('avgCost').optional().isFloat({ min: 0 }),
  body('metadata').optional().isObject().withMessage('metadata must be an object')
];

const adjustItemValidation = [
  body('movementType').isIn(['in', 'out', 'adjust']).withMessage('movementType must be in, out, or adjust'),
  body('quantity').isFloat().withMessage('quantity must be a number'),
  body('quantity').custom((value, { req }) => {
    const quantity = Number(value);
    const movementType = req.body?.movementType;

    if (!Number.isFinite(quantity) || quantity === 0) {
      throw new Error('quantity must be non-zero');
    }

    if ((movementType === 'in' || movementType === 'out') && quantity < 0) {
      throw new Error('quantity must be positive for in/out movement');
    }

    return true;
  }),
  body('unitCost').optional().isFloat({ min: 0 }).withMessage('unitCost must be >= 0'),
  body('note').optional().isString().trim().isLength({ max: 300 }),
  body('metadata').optional().isObject().withMessage('metadata must be an object')
];

const listMovementsValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

module.exports = {
  itemIdParamValidation,
  listItemsValidation,
  createItemValidation,
  updateItemValidation,
  adjustItemValidation,
  listMovementsValidation
};
