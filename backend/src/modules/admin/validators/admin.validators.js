const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const { COMPANY_STATUS } = require('../../../constants/company');
const { SERVICE_TYPES, SERVICE_STATUSES, SERVICE_PRIORITIES } = require('../../../constants/services');

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

const userIdParamValidation = [
  param('userId').custom(isObjectId).withMessage('A valid userId is required')
];

const serviceRequestIdParamValidation = [
  param('serviceRequestId').custom(isObjectId).withMessage('A valid serviceRequestId is required')
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

const listAdminServiceRequestsValidation = [
  query('serviceType').optional().isIn(SERVICE_TYPES),
  query('status').optional().isIn(SERVICE_STATUSES),
  query('priority').optional().isIn(SERVICE_PRIORITIES),
  query('companyId').optional().custom(isObjectId).withMessage('companyId must be a valid ObjectId'),
  query('createdBy').optional().custom(isObjectId).withMessage('createdBy must be a valid ObjectId'),
  query('assignedTo').optional().custom(isObjectId).withMessage('assignedTo must be a valid ObjectId'),
  query('search').optional().isString().trim().isLength({ min: 1, max: 150 }),
  query('sort')
    .optional()
    .isIn(['createdAt:desc', 'createdAt:asc', 'updatedAt:desc', 'updatedAt:asc', 'priority:desc', 'slaDueAt:asc']),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

const updateServiceRequestWorkflowValidation = [
  ...serviceRequestIdParamValidation,
  body('status').optional().isIn(SERVICE_STATUSES),
  body('priority').optional().isIn(SERVICE_PRIORITIES),
  body('assignedTo').optional({ nullable: true }).custom((value) => value === null || value === '' || isObjectId(value))
    .withMessage('assignedTo must be a valid ObjectId or null'),
  body('slaDueAt').optional({ nullable: true }).isISO8601().withMessage('slaDueAt must be a valid ISO datetime'),
  body('note').optional().isString().trim().isLength({ min: 1, max: 2000 }),
  body('reason').isString().trim().isLength({ min: 3, max: 300 }).withMessage('reason is required'),
  body('contextCompanyId').optional().custom(isObjectId).withMessage('contextCompanyId must be a valid ObjectId'),
  body('expectedUpdatedAt').optional().isISO8601().withMessage('expectedUpdatedAt must be a valid ISO datetime')
];

const updateServiceRequestContentValidation = [
  ...serviceRequestIdParamValidation,
  body('updates').isObject().withMessage('updates payload is required'),
  body('reason').isString().trim().isLength({ min: 3, max: 300 }).withMessage('reason is required'),
  body('contextCompanyId').optional().custom(isObjectId).withMessage('contextCompanyId must be a valid ObjectId'),
  body('expectedUpdatedAt').optional().isISO8601().withMessage('expectedUpdatedAt must be a valid ISO datetime')
];

const listAdminConversationsValidation = [
  query('search').optional().isString().trim().isLength({ min: 1, max: 150 }),
  query('userId').optional().custom(isObjectId).withMessage('userId must be a valid ObjectId'),
  query('companyId').optional().custom(isObjectId).withMessage('companyId must be a valid ObjectId'),
  query('sort').optional().isIn(['updatedAt:desc', 'updatedAt:asc', 'lastMessageAt:desc', 'lastMessageAt:asc']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

const listAdminCallLogsValidation = [
  query('userId').optional().custom(isObjectId).withMessage('userId must be a valid ObjectId'),
  query('companyId').optional().custom(isObjectId).withMessage('companyId must be a valid ObjectId'),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('minDuration').optional().isInt({ min: 0 }).toInt(),
  query('maxDuration').optional().isInt({ min: 0 }).toInt(),
  query('sort').optional().isIn(['startedAt:desc', 'startedAt:asc', 'duration:desc', 'duration:asc']),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

module.exports = {
  listEntitiesValidation,
  companyIdParamValidation,
  userIdParamValidation,
  serviceRequestIdParamValidation,
  setCompanyStatusValidation,
  archiveCompanyValidation,
  hardDeleteCompanyValidation,
  requestDocumentsValidation,
  listAdminAuditEventsValidation,
  listAdminServiceRequestsValidation,
  updateServiceRequestWorkflowValidation,
  updateServiceRequestContentValidation,
  listAdminConversationsValidation,
  listAdminCallLogsValidation
};
