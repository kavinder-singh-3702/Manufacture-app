const { body, param, query } = require('express-validator');
const { REPORT_TARGET_TYPES, REPORT_REASONS, REPORT_STATUSES } = require('../../../models/report.model');

const createReportValidation = [
  body('targetType').isIn(REPORT_TARGET_TYPES).withMessage('Invalid targetType'),
  body('targetId').isMongoId().withMessage('Invalid targetId'),
  body('reason').isIn(REPORT_REASONS).withMessage('Invalid reason'),
  body('details').optional().isString().isLength({ max: 2000 }),
];

const listReportsValidation = [
  query('status').optional().isIn(REPORT_STATUSES),
  query('targetType').optional().isIn(REPORT_TARGET_TYPES),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
];

const resolveReportValidation = [
  param('reportId').isMongoId(),
  body('action').isIn(['resolved', 'dismissed']),
  body('notes').optional().isString().isLength({ max: 2000 }),
];

const blockUserValidation = [
  param('userId').isMongoId(),
  body('reason').optional().isString().isLength({ max: 500 }),
];

const unblockUserValidation = [
  param('userId').isMongoId(),
];

module.exports = {
  createReportValidation,
  listReportsValidation,
  resolveReportValidation,
  blockUserValidation,
  unblockUserValidation,
};
