const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  logPreferenceEventController,
  getUserPreferenceSummaryController,
  getHomeFeedController
} = require('../controllers/preference.controller');
const {
  createPersonalizedOfferController,
  listUserOffersAdminController,
  listCampaignsAdminController,
  updateCampaignController,
  listMyOffersController
} = require('../controllers/personalizedOffer.controller');
const {
  logEventValidation,
  userIdParamValidation,
  preferenceSummaryQueryValidation,
  homeFeedQueryValidation
} = require('../validators/preference.validators');
const {
  createOfferValidation,
  updateCampaignValidation,
  listOffersQueryValidation
} = require('../validators/personalizedOffer.validators');

const router = Router();

// All routes require authentication
router.use(authenticate);

// User event ingestion
router.post('/events', validate(logEventValidation), logPreferenceEventController);
router.get('/home-feed', validate(homeFeedQueryValidation), getHomeFeedController);

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
router.post(
  '/admin/users/:userId/campaigns',
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
router.get(
  '/admin/users/:userId/campaigns',
  authorizeRoles('admin'),
  validate([...userIdParamValidation, ...listOffersQueryValidation]),
  listUserOffersAdminController
);
router.patch(
  '/admin/users/:userId/campaigns/:campaignId',
  authorizeRoles('admin'),
  validate(updateCampaignValidation),
  updateCampaignController
);
router.get('/admin/campaigns', authorizeRoles('admin'), validate(listOffersQueryValidation), listCampaignsAdminController);

// Personalized offers for current user
router.get('/my-offers', listMyOffersController);
router.get('/my-campaigns', listMyOffersController);

module.exports = router;
