const { param, query } = require('express-validator');

const dateRangeValidation = [
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601()
];

const partyOutstandingValidation = [
  ...dateRangeValidation,
  query('type').optional().isIn(['customer', 'supplier']),
  query('asOf').optional().isISO8601()
];

const stockSummaryValidation = [
  ...dateRangeValidation,
  query('level').optional().isIn(['variant', 'product'])
];

const stockLedgerValidation = [
  ...dateRangeValidation,
  query('productId').optional().isMongoId(),
  query('variantId').optional().isMongoId(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

const ledgerReportValidation = [
  ...dateRangeValidation,
  param('accountId').isMongoId().withMessage('Valid accountId is required'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

module.exports = {
  dateRangeValidation,
  partyOutstandingValidation,
  stockSummaryValidation,
  stockLedgerValidation,
  ledgerReportValidation
};

