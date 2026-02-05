const { body, param, query } = require('express-validator');
const { ACCOUNT_TYPES } = require('../../../constants/accounting');

const accountIdParamValidation = [param('accountId').isMongoId().withMessage('Valid accountId is required')];

const listAccountsValidation = [
  query('type').optional().isIn(ACCOUNT_TYPES),
  query('group').optional().isString().trim(),
  query('search').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

const createAccountValidation = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('type').isIn(ACCOUNT_TYPES).withMessage('Invalid account type'),
  body('group').trim().notEmpty().withMessage('group is required'),
  body('key').optional().isString().trim().isLength({ max: 100 }),
  body('openingBalance').optional().isObject(),
  body('openingBalance.amount').optional().isFloat({ min: 0 }),
  body('openingBalance.drCr').optional().isIn(['debit', 'credit']),
  body('openingBalance.asOf').optional().isISO8601().toDate(),
  body('metadata').optional().isObject()
];

const updateAccountValidation = [
  body('name').optional().isString().trim().notEmpty(),
  body('type').optional().isIn(ACCOUNT_TYPES),
  body('group').optional().isString().trim().notEmpty(),
  body('openingBalance').optional().isObject(),
  body('openingBalance.amount').optional().isFloat({ min: 0 }),
  body('openingBalance.drCr').optional().isIn(['debit', 'credit']),
  body('openingBalance.asOf').optional().isISO8601().toDate(),
  body('metadata').optional().isObject()
];

module.exports = {
  accountIdParamValidation,
  listAccountsValidation,
  createAccountValidation,
  updateAccountValidation
};

