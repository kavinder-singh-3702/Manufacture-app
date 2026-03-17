const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  logPreferenceEventController,
  getUserPreferenceSummaryController
} = require('../controllers/preference.controller');
const {
  logEventValidation,
  userIdParamValidation,
  preferenceSummaryQueryValidation
} = require('../validators/preference.validators');

const router = Router();

// All routes require authentication
router.use(authenticate);

// User event ingestion
router.post('/events', validate(logEventValidation), logPreferenceEventController);

// Admin-only summary for a user
router.get(
  '/admin/users/:userId',
  authorizeRoles('admin'),
  validate([...userIdParamValidation, ...preferenceSummaryQueryValidation]),
  getUserPreferenceSummaryController
);

module.exports = router;
