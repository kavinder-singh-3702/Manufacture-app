const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  getAdFeedController,
  recordAdEventController,
  listAdminCampaignsController,
  createCampaignController,
  getCampaignController,
  updateCampaignController,
  activateCampaignController,
  pauseCampaignController,
  getCampaignInsightsController,
  createCampaignFromRequestController
} = require('../controllers/ad.controller');
const {
  campaignIdParamValidation,
  createCampaignValidation,
  updateCampaignValidation,
  listCampaignsValidation,
  feedValidation,
  recordEventValidation,
  fromRequestValidation
} = require('../validators/ad.validators');

const router = Router();

router.use(authenticate);

router.get('/feed', validate(feedValidation), getAdFeedController);
router.post('/events', validate(recordEventValidation), recordAdEventController);

router.get(
  '/admin/campaigns',
  authorizeRoles('admin'),
  validate(listCampaignsValidation),
  listAdminCampaignsController
);

router.post(
  '/admin/campaigns',
  authorizeRoles('admin'),
  validate(createCampaignValidation),
  createCampaignController
);

router.get(
  '/admin/campaigns/:campaignId',
  authorizeRoles('admin'),
  validate(campaignIdParamValidation),
  getCampaignController
);

router.patch(
  '/admin/campaigns/:campaignId',
  authorizeRoles('admin'),
  validate([...campaignIdParamValidation, ...updateCampaignValidation]),
  updateCampaignController
);

router.post(
  '/admin/campaigns/:campaignId/activate',
  authorizeRoles('admin'),
  validate(campaignIdParamValidation),
  activateCampaignController
);

router.post(
  '/admin/campaigns/:campaignId/pause',
  authorizeRoles('admin'),
  validate(campaignIdParamValidation),
  pauseCampaignController
);

router.get(
  '/admin/campaigns/:campaignId/insights',
  authorizeRoles('admin'),
  validate(campaignIdParamValidation),
  getCampaignInsightsController
);

router.post(
  '/admin/campaigns/from-request/:serviceRequestId',
  authorizeRoles('admin'),
  validate(fromRequestValidation),
  createCampaignFromRequestController
);

module.exports = router;
