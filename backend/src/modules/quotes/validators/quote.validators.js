const { body, param, query } = require('express-validator');
const { QUOTE_STATUSES, QUOTE_MODES } = require('../../../constants/quote');

const quoteIdParamValidation = [param('quoteId').isMongoId().withMessage('Valid quote id is required')];

const createQuoteValidation = [
  body('productId').isMongoId().withMessage('Product id is required'),
  body('variantId').optional().isMongoId().withMessage('Variant id must be valid'),
  body('quantity').isFloat({ gt: 0 }).withMessage('Quantity must be greater than 0'),
  body('targetPrice').optional().isFloat({ min: 0 }).withMessage('Target price must be 0 or greater'),
  body('currency').optional().isString().isLength({ max: 10 }),
  body('requirements')
    .trim()
    .notEmpty()
    .withMessage('Requirements are required')
    .isLength({ max: 2000 })
    .withMessage('Requirements can be at most 2000 characters'),
  body('requiredBy').optional().isISO8601().toDate(),
  body('buyerContact').optional().isObject().withMessage('buyerContact must be an object'),
  body('buyerContact.name').optional().isString().isLength({ max: 120 }),
  body('buyerContact.phone').optional().isString().isLength({ max: 50 }),
  body('buyerContact.email').optional().isEmail().withMessage('buyerContact.email must be valid')
];

const listQuotesValidation = [
  query('mode').optional().isIn(QUOTE_MODES),
  query('status').optional().isIn(QUOTE_STATUSES),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('search').optional().isString().isLength({ max: 120 })
];

const respondToQuoteValidation = [
  body('unitPrice').isFloat({ min: 0 }).withMessage('unitPrice is required'),
  body('currency').optional().isString().isLength({ max: 10 }),
  body('minOrderQty').optional().isFloat({ gt: 0 }).withMessage('minOrderQty must be greater than 0'),
  body('leadTimeDays').optional().isInt({ min: 0 }).withMessage('leadTimeDays must be 0 or greater'),
  body('validUntil').optional().isISO8601().toDate(),
  body('notes').optional().isString().isLength({ max: 2000 })
];

const updateQuoteStatusValidation = [
  body('status')
    .isIn(['accepted', 'rejected', 'cancelled', 'expired'])
    .withMessage('Status must be accepted, rejected, cancelled, or expired'),
  body('note').optional().isString().isLength({ max: 500 })
];

module.exports = {
  quoteIdParamValidation,
  createQuoteValidation,
  listQuotesValidation,
  respondToQuoteValidation,
  updateQuoteStatusValidation
};
