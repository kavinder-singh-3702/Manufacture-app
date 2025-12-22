const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const { logPreferenceEventController, getUserPreferenceSummaryController } = require('../controllers/preference.controller');
const {
  createPersonalizedOfferController,
  listUserOffersAdminController,
  listMyOffersController
} = require('../controllers/personalizedOffer.controller');
const { logEventValidation, userIdParamValidation, preferenceSummaryQueryValidation } = require('../validators/preference.validators');
const { createOfferValidation, listOffersQueryValidation } = require('../validators/personalizedOffer.validators');

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

// Personalized offers (admin)
router.post(
  '/admin/users/:userId/offers',
  authorizeRoles('admin'),
  validate(createOfferValidation),
  createPersonalizedOfferController
);
router.get(
  '/admin/users/:userId/offers',
  authorizeRoles('admin'),
  validate([...userIdParamValidation, ...listOffersQueryValidation]),
  listUserOffersAdminController
);

// Personalized offers for current user
router.get('/my-offers', listMyOffersController);

module.exports = router;
