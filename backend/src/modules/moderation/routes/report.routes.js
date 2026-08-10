const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  createReportController,
  listReportsController,
  resolveReportController,
} = require('../controllers/report.controller');
const {
  createReportValidation,
  listReportsValidation,
  resolveReportValidation,
} = require('../validators/moderation.validators');

const router = Router();

// User-facing: submit a report on a product, chat message, or user.
router.post('/', authenticate, validate(createReportValidation), createReportController);

// Admin queue: list + resolve.
router.get('/admin', authenticate, authorizeRoles('admin', 'super-admin'), validate(listReportsValidation), listReportsController);
router.post(
  '/admin/:reportId/resolve',
  authenticate,
  authorizeRoles('admin', 'super-admin'),
  validate(resolveReportValidation),
  resolveReportController
);

module.exports = router;
