const { body, param, query } = require('express-validator');
const { VOUCHER_TYPES, VOUCHER_STATUSES, GST_TYPES } = require('../../../constants/accounting');

const voucherIdParamValidation = [param('voucherId').isMongoId().withMessage('Valid voucherId is required')];

const listVouchersValidation = [
  query('voucherType').optional().isIn(VOUCHER_TYPES),
  query('status').optional().isIn(VOUCHER_STATUSES),
  query('partyId').optional().isMongoId(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('search').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

const stockAdjustmentLineValidation = body('lines.items')
  .optional()
  .isArray({ min: 1 })
  .custom((value, { req }) => {
    if (req.body.voucherType !== 'stock_adjustment') return true;
    value.forEach((line) => {
      if (!line.product) {
        throw new Error('Each stock adjustment line requires a product id');
      }
      const adjustment = Number(line.adjustment || 0);
      if (!adjustment) {
        throw new Error('Stock adjustment line requires non-zero adjustment quantity');
      }
    });
    return true;
  });

const createVoucherValidation = [
  body('voucherType').isIn(VOUCHER_TYPES).withMessage('voucherType is required'),
  body('status').optional().isIn(['draft', 'posted']),
  body('date').optional().isISO8601().toDate(),
  body('partyId').optional().isMongoId(),
  body('referenceNumber').optional().isString().trim(),
  body('narration').optional().isString().trim(),
  body('cashBankAccount').optional().isMongoId(),
  body('fromAccount').optional().isMongoId(),
  body('toAccount').optional().isMongoId(),
  body('amount').optional().isFloat({ gt: 0 }).toFloat(),
  body('currency').optional().isString().trim(),
  body('gst').optional().isObject(),
  body('gst.enabled').optional().isBoolean().toBoolean(),
  body('gst.gstType').optional().isIn(GST_TYPES),
  body('gst.placeOfSupplyState').optional().isString().trim(),
  body('lines').optional().isObject(),
  body('lines.items').optional().isArray(),
  body('lines.items.*.product').optional().isMongoId(),
  body('lines.items.*.variant').optional().isMongoId(),
  body('lines.items.*.quantity').optional().isFloat({ gt: 0 }).toFloat(),
  body('lines.items.*.rate').optional().isFloat({ min: 0 }).toFloat(),
  body('lines.items.*.discountAmount').optional().isFloat({ min: 0 }).toFloat(),
  body('lines.items.*.tax').optional().isObject(),
  body('lines.items.*.tax.gstRate').optional().isFloat({ min: 0, max: 100 }).toFloat(),
  body('lines.items.*.tax.gstType').optional().isIn(GST_TYPES),
  body('lines.charges').optional().isArray(),
  body('lines.charges.*.account').optional().isMongoId(),
  body('lines.charges.*.amount').optional().isFloat({ min: 0 }).toFloat(),
  body('lines.charges.*.tax').optional().isObject(),
  body('lines.charges.*.tax.gstRate').optional().isFloat({ min: 0, max: 100 }).toFloat(),
  body('lines.charges.*.tax.gstType').optional().isIn(GST_TYPES),
  body('journalLines').optional().isArray(),
  body('journalLines.*.account').optional().isMongoId(),
  body('journalLines.*.debit').optional().isFloat({ min: 0 }).toFloat(),
  body('journalLines.*.credit').optional().isFloat({ min: 0 }).toFloat(),
  body('meta').optional().isObject(),
  body('idempotencyKey').optional().isString().trim().isLength({ min: 4, max: 200 }),
  stockAdjustmentLineValidation
];

const updateVoucherValidation = [
  body('voucherType').optional().isIn(VOUCHER_TYPES),
  body('status').optional().isIn(['draft', 'posted']),
  body('date').optional().isISO8601().toDate(),
  body('partyId').optional().isMongoId(),
  body('referenceNumber').optional().isString().trim(),
  body('narration').optional().isString().trim(),
  body('cashBankAccount').optional().isMongoId(),
  body('fromAccount').optional().isMongoId(),
  body('toAccount').optional().isMongoId(),
  body('amount').optional().isFloat({ gt: 0 }).toFloat(),
  body('currency').optional().isString().trim(),
  body('gst').optional().isObject(),
  body('gst.enabled').optional().isBoolean().toBoolean(),
  body('gst.gstType').optional().isIn(GST_TYPES),
  body('gst.placeOfSupplyState').optional().isString().trim(),
  body('lines').optional().isObject(),
  body('lines.items').optional().isArray(),
  body('lines.items.*.product').optional().isMongoId(),
  body('lines.items.*.variant').optional().isMongoId(),
  body('lines.items.*.quantity').optional().isFloat({ gt: 0 }).toFloat(),
  body('lines.items.*.rate').optional().isFloat({ min: 0 }).toFloat(),
  body('lines.items.*.discountAmount').optional().isFloat({ min: 0 }).toFloat(),
  body('lines.items.*.tax').optional().isObject(),
  body('lines.items.*.tax.gstRate').optional().isFloat({ min: 0, max: 100 }).toFloat(),
  body('lines.items.*.tax.gstType').optional().isIn(GST_TYPES),
  body('lines.charges').optional().isArray(),
  body('lines.charges.*.account').optional().isMongoId(),
  body('lines.charges.*.amount').optional().isFloat({ min: 0 }).toFloat(),
  body('lines.charges.*.tax').optional().isObject(),
  body('lines.charges.*.tax.gstRate').optional().isFloat({ min: 0, max: 100 }).toFloat(),
  body('lines.charges.*.tax.gstType').optional().isIn(GST_TYPES),
  body('journalLines').optional().isArray(),
  body('journalLines.*.account').optional().isMongoId(),
  body('journalLines.*.debit').optional().isFloat({ min: 0 }).toFloat(),
  body('journalLines.*.credit').optional().isFloat({ min: 0 }).toFloat(),
  body('meta').optional().isObject(),
  body('idempotencyKey').optional().isString().trim().isLength({ min: 4, max: 200 }),
  stockAdjustmentLineValidation
];

const voidVoucherValidation = [body('reason').optional().isString().trim().isLength({ max: 500 })];

const voucherLogsValidation = [
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

module.exports = {
  voucherIdParamValidation,
  listVouchersValidation,
  createVoucherValidation,
  updateVoucherValidation,
  voidVoucherValidation,
  voucherLogsValidation
};
