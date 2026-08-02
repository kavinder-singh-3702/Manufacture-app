const { Router } = require('express');
const createError = require('http-errors');
const { authenticate, authenticateOptional, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const { uploadAdMediaFields } = require('../../../middleware/upload');
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

// Named multipart file slots the campaign wizard can send — see
// uploadAdMediaFields (middleware/upload.js). Keyed by field name so the
// resulting `req.body._mediaFiles` can be handed straight to ad.service.js
// without a base64 round-trip.
const MEDIA_FIELDS = ['bannerVideo', 'bannerImage', 'bannerPoster', 'advertiserLogo'];

// Accepts either a plain JSON body or a multipart body where the campaign
// fields are a JSON string in `payload` plus zero or more of the named
// MEDIA_FIELDS uploaded as real files. Uploaded files are attached as raw
// buffers on `req.body._mediaFiles` (never re-encoded to base64) — the
// service layer prefers those and falls back to the legacy `*Base64` JSON
// fields only for callers with no multipart request to draw a buffer from
// (e.g. the service-request prefill flow).
const parseAdMultipart = (req, res, next) => {
  if (req.body && typeof req.body.payload === 'string') {
    try {
      req.body = { ...JSON.parse(req.body.payload) };
    } catch (error) {
      return next(createError(400, 'Invalid campaign payload'));
    }
  }

  const uploaded = req.files || {};
  const mediaFiles = {};
  MEDIA_FIELDS.forEach((field) => {
    const file = uploaded[field] && uploaded[field][0];
    if (file) mediaFiles[field] = { buffer: file.buffer, mimetype: file.mimetype };
  });

  if (Object.keys(mediaFiles).length) {
    req.body._mediaFiles = mediaFiles;
    // Authoritative media-type hint straight from what was actually
    // uploaded — mirrors what the old single-video shim did, now covering
    // the image case too instead of relying solely on the client's
    // `creative.bannerMediaType` claim.
    if (mediaFiles.bannerVideo || mediaFiles.bannerImage) {
      req.body.creative = { ...(req.body.creative || {}) };
      req.body.creative.bannerMediaType = mediaFiles.bannerVideo ? 'video' : 'image';
    }
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
  uploadAdMediaFields,
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
  uploadAdMediaFields,
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
