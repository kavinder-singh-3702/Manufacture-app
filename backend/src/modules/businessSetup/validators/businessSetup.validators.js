const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const {
  BUSINESS_SETUP_STATUSES,
  BUSINESS_SETUP_PRIORITIES,
  WORK_MODE_IDS,
  BUDGET_RANGE_IDS,
  START_TIMELINE_IDS,
  SUPPORT_AREA_IDS,
  FOUNDER_EXPERIENCE_OPTIONS,
  CONTACT_CHANNEL_OPTIONS
} = require('../../../constants/businessSetup');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createBusinessSetupRequestValidation = [
  body('title').optional().isString().trim().isLength({ max: 200 }),
  body('businessType').isString().trim().notEmpty().isLength({ max: 120 }),
  body('workModel').isIn(WORK_MODE_IDS),
  body('location').isString().trim().notEmpty().isLength({ max: 200 }),
  body('budgetRange').isIn(BUDGET_RANGE_IDS),
  body('startTimeline').isIn(START_TIMELINE_IDS),
  body('supportAreas').optional().isArray(),
  body('supportAreas.*').optional().isIn(SUPPORT_AREA_IDS),
  body('founderExperience').optional().isIn(FOUNDER_EXPERIENCE_OPTIONS),
  body('teamSize').optional().isInt({ min: 0 }),
  body('preferredContactChannel').optional().isIn(CONTACT_CHANNEL_OPTIONS),
  body('contactName').optional().isString().trim().isLength({ max: 120 }),
  body('contactEmail').optional().isEmail(),
  body('contactPhone').optional().isString().trim().isLength({ max: 50 }),
  body('notes').optional().isString().trim().isLength({ max: 3000 }),
  body().custom((_, { req }) => {
    if (req.user?.id) return true;

    const contactName = String(req.body?.contactName || '').trim();
    const contactEmail = String(req.body?.contactEmail || '').trim();
    const contactPhone = String(req.body?.contactPhone || '').trim();

    if (!contactName) {
      throw new Error('contactName is required for guest submissions');
    }
    if (!contactEmail && !contactPhone) {
      throw new Error('Provide at least one contact method (contactEmail or contactPhone)');
    }
    return true;
  })
];

const listMyBusinessSetupRequestsValidation = [
  query('status').optional().isIn(BUSINESS_SETUP_STATUSES),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('sort').optional().isIn(['newest', 'oldest'])
];

const businessSetupRequestIdParamValidation = [
  param('requestId').custom(isObjectId).withMessage('A valid requestId is required')
];

const listAdminBusinessSetupRequestsValidation = [
  query('status').optional().isIn(BUSINESS_SETUP_STATUSES),
  query('priority').optional().isIn(BUSINESS_SETUP_PRIORITIES),
  query('source').optional().isIn(['authenticated', 'guest']),
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

const updateBusinessSetupWorkflowValidation = [
  ...businessSetupRequestIdParamValidation,
  body('status').optional().isIn(BUSINESS_SETUP_STATUSES),
  body('priority').optional().isIn(BUSINESS_SETUP_PRIORITIES),
  body('assignedTo')
    .optional({ nullable: true })
    .custom((value) => value === null || value === '' || isObjectId(value))
    .withMessage('assignedTo must be a valid ObjectId or null'),
  body('slaDueAt').optional({ nullable: true }).isISO8601().withMessage('slaDueAt must be a valid ISO datetime'),
  body('note').optional().isString().trim().isLength({ min: 1, max: 2000 }),
  body('reason').isString().trim().isLength({ min: 3, max: 300 }).withMessage('reason is required'),
  body('contextCompanyId').optional().custom(isObjectId).withMessage('contextCompanyId must be a valid ObjectId'),
  body('expectedUpdatedAt').optional().isISO8601().withMessage('expectedUpdatedAt must be a valid ISO datetime')
];

const listAdminOpsRequestsValidation = [
  query('kind').optional().isIn(['all', 'service', 'business_setup']),
  query('statusBucket').optional().isIn(['all', 'open', 'closed', 'rejected']),
  query('serviceType').optional().isString().trim().isLength({ min: 1, max: 100 }),
  query('status').optional().isString().trim().isLength({ min: 1, max: 80 }),
  query('priority').optional().isString().trim().isLength({ min: 1, max: 80 }),
  query('companyId').optional().custom(isObjectId).withMessage('companyId must be a valid ObjectId'),
  query('createdBy').optional().custom(isObjectId).withMessage('createdBy must be a valid ObjectId'),
  query('assignedTo').optional().custom(isObjectId).withMessage('assignedTo must be a valid ObjectId'),
  query('search').optional().isString().trim().isLength({ min: 1, max: 150 }),
  query('sort').optional().isIn(['createdAt:desc', 'createdAt:asc', 'updatedAt:desc', 'updatedAt:asc', 'priority:desc']),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

module.exports = {
  createBusinessSetupRequestValidation,
  listMyBusinessSetupRequestsValidation,
  businessSetupRequestIdParamValidation,
  listAdminBusinessSetupRequestsValidation,
  updateBusinessSetupWorkflowValidation,
  listAdminOpsRequestsValidation
};
