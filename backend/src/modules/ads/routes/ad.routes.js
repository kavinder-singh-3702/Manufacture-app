const { Router } = require('express');
const createError = require('http-errors');
const { authenticate, authenticateOptional, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const { uploadAdMedia } = require('../../../middleware/upload');
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
  insightsValidation,
  recordEventValidation,
  fromRequestValidation
} = require('../validators/ad.validators');

const router = Router();

// Accepts either a JSON body or a multipart body where the campaign fields are a
// JSON string in `payload` and an optional banner video is uploaded as `bannerVideo`.
const parseAdMultipart = (req, res, next) => {
  if (req.body && typeof req.body.payload === 'string') {
    try {
      req.body = { ...JSON.parse(req.body.payload) };
    } catch (error) {
      return next(createError(400, 'Invalid campaign payload'));
    }
  }

  if (req.file) {
    req.body.creative = { ...(req.body.creative || {}) };
    req.body.creative.bannerVideoBase64 = req.file.buffer.toString('base64');
    req.body.creative.bannerMimeType = req.file.mimetype;
    req.body.creative.bannerMediaType = 'video';
  }

  return next();
};

// Feed + event logging are public — anonymous web/app visitors see ads too.
// authenticateOptional attaches req.user when a session/token is present and
// otherwise just calls next(), so getFeed/recordAdEvent handle both cases.
router.get('/feed', authenticateOptional, validate(feedValidation), getAdFeedController);
router.post('/events', authenticateOptional, validate(recordEventValidation), recordAdEventController);

router.get(
  '/admin/campaigns',
  authenticate,
  authorizeRoles('admin'),
  validate(listCampaignsValidation),
  listAdminCampaignsController
);

router.post(
  '/admin/campaigns',
  authenticate,
  authorizeRoles('admin'),
  uploadAdMedia.single('bannerVideo'),
  parseAdMultipart,
  validate(createCampaignValidation),
  createCampaignController
);

router.get(
  '/admin/campaigns/:campaignId',
  authenticate,
  authorizeRoles('admin'),
  validate(campaignIdParamValidation),
  getCampaignController
);

router.patch(
  '/admin/campaigns/:campaignId',
  authenticate,
  authorizeRoles('admin'),
  uploadAdMedia.single('bannerVideo'),
  parseAdMultipart,
  validate([...campaignIdParamValidation, ...updateCampaignValidation]),
  updateCampaignController
);

router.post(
  '/admin/campaigns/:campaignId/activate',
  authenticate,
  authorizeRoles('admin'),
  validate(campaignIdParamValidation),
  activateCampaignController
);

router.post(
  '/admin/campaigns/:campaignId/pause',
  authenticate,
  authorizeRoles('admin'),
  validate(campaignIdParamValidation),
  pauseCampaignController
);

router.get(
  '/admin/campaigns/:campaignId/insights',
  authenticate,
  authorizeRoles('admin'),
  validate(insightsValidation),
  getCampaignInsightsController
);

router.post(
  '/admin/campaigns/from-request/:serviceRequestId',
  authenticate,
  authorizeRoles('admin'),
  validate(fromRequestValidation),
  createCampaignFromRequestController
);

module.exports = router;
