const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const { COMPANY_STATUS } = require('../../../constants/company');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const listEntitiesValidation = [
  query('status').optional().isString().trim().isLength({ min: 1, max: 80 }),
  query('search').optional().isString().trim().isLength({ min: 1, max: 120 }),
  query('companyId').optional().custom(isObjectId).withMessage('companyId must be a valid ObjectId'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('sort').optional().isIn(['createdAt:desc', 'createdAt:asc', 'updatedAt:desc', 'updatedAt:asc'])
];

const companyIdParamValidation = [
  param('companyId').custom(isObjectId).withMessage('A valid companyId is required')
];

const setCompanyStatusValidation = [
  ...companyIdParamValidation,
  body('status').isIn(COMPANY_STATUS).withMessage('Unsupported company status'),
  body('reason').optional().isString().trim().isLength({ min: 1, max: 500 }),
  body('contextCompanyId').optional().custom(isObjectId).withMessage('contextCompanyId must be a valid ObjectId')
];

const archiveCompanyValidation = [
  ...companyIdParamValidation,
  body('reason').optional().isString().trim().isLength({ min: 1, max: 500 }),
  body('contextCompanyId').optional().custom(isObjectId).withMessage('contextCompanyId must be a valid ObjectId')
];

const hardDeleteCompanyValidation = [
  ...companyIdParamValidation,
  body('reason').isString().trim().isLength({ min: 5, max: 500 }).withMessage('A hard-delete reason is required'),
  body('contextCompanyId').optional().custom(isObjectId).withMessage('contextCompanyId must be a valid ObjectId')
];

const requestDocumentsValidation = [
  ...companyIdParamValidation,
  body('message').optional().isString().trim().isLength({ max: 500 }),
  body('sendEmail').optional().isBoolean(),
  body('sendNotification').optional().isBoolean(),
  body('contextCompanyId').optional().custom(isObjectId).withMessage('contextCompanyId must be a valid ObjectId')
];

const listAdminAuditEventsValidation = [
  query('userId').optional().custom(isObjectId).withMessage('Invalid userId'),
  query('companyId').optional().custom(isObjectId).withMessage('Invalid companyId'),
  query('action').optional().isString().trim().isLength({ min: 1, max: 200 }),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

module.exports = {
  listEntitiesValidation,
  companyIdParamValidation,
  setCompanyStatusValidation,
  archiveCompanyValidation,
  hardDeleteCompanyValidation,
  requestDocumentsValidation,
  listAdminAuditEventsValidation
};
