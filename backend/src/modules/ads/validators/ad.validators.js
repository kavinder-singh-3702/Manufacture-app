const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const {
  AD_CAMPAIGN_STATUSES,
  AD_PLACEMENTS,
  AD_MEDIA_TYPES,
  AD_TARGETING_MODES,
  AD_EVENT_TYPES,
  AD_SOURCES
} = require('../../../constants/ad');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const campaignIdParamValidation = [
  param('campaignId').custom(isObjectId).withMessage('Valid campaign id is required')
];

const serviceRequestIdParamValidation = [
  param('serviceRequestId').custom(isObjectId).withMessage('Valid service request id is required')
];

const adTargetingValidation = [
  body('targeting').optional().isObject(),
  body('targeting.mode').optional().isIn(AD_TARGETING_MODES),
  body('targeting.userIds').optional().isArray(),
  body('targeting.userIds.*').optional().custom(isObjectId).withMessage('targeting.userIds must be valid ids'),
  body('targeting.shopperCategories').optional().isArray(),
  body('targeting.shopperCategories.*').optional().isString(),
  body('targeting.shopperSubCategories').optional().isArray(),
  body('targeting.shopperSubCategories.*').optional().isString(),
  body('targeting.buyIntentCategories').optional().isArray(),
  body('targeting.buyIntentCategories.*').optional().isString(),
  body('targeting.buyIntentSubCategories').optional().isArray(),
  body('targeting.buyIntentSubCategories.*').optional().isString(),
  body('targeting.listedProductCategories').optional().isArray(),
  body('targeting.listedProductCategories.*').optional().isString(),
  body('targeting.listedProductSubCategories').optional().isArray(),
  body('targeting.listedProductSubCategories.*').optional().isString(),
  body('targeting.requireListedProductInSameCategory').optional().isBoolean(),
  body('targeting.lookbackDays').optional().isInt({ min: 1, max: 365 })
];

const adCreativeValidation = [
  body('creative').optional().isObject(),
  body('creative.priceOverride').optional({ nullable: true }).isObject(),
  body('creative.priceOverride.amount')
    .optional({ nullable: true })
    .isFloat({ gt: 0 })
    .withMessage('creative.priceOverride.amount must be greater than 0'),
  body('creative.priceOverride.currency')
    .optional({ nullable: true })
    .isString()
    .isLength({ min: 3, max: 8 }),
  body('creative.priceOverride.unit')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 60 }),
  body('creative.title').optional().isString().isLength({ max: 140 }),
  body('creative.subtitle').optional().isString().isLength({ max: 220 }),
  body('creative.ctaLabel').optional().isString().isLength({ max: 60 }),
  body('creative.badge').optional().isString().isLength({ max: 40 }),
  body('creative.bannerMediaType').optional({ nullable: true }).isIn(AD_MEDIA_TYPES),
  body('creative.bannerImageUrl').optional({ nullable: true }).isString().isLength({ max: 2048 }),
  body('creative.bannerVideoUrl').optional({ nullable: true }).isString().isLength({ max: 2048 }),
  body('creative.bannerImageBase64').optional({ nullable: true }).isString(),
  body('creative.bannerVideoBase64').optional({ nullable: true }).isString(),
  body('creative.bannerMimeType').optional({ nullable: true }).isString().isLength({ max: 120 }),
  body('creative.bannerPosterUrl').optional({ nullable: true }).isString().isLength({ max: 2048 }),
  body('creative.bannerPosterBase64').optional({ nullable: true }).isString(),
  body('creative.bannerPosterMimeType').optional({ nullable: true }).isString().isLength({ max: 120 })
];

const adScheduleValidation = [
  body('schedule').optional().isObject(),
  body('schedule.startAt').optional().isISO8601().toDate(),
  body('schedule.endAt').optional().isISO8601().toDate()
];

const adExternalValidation = [
  body('adSource').optional().isIn(AD_SOURCES),
  body('external').optional().isObject(),
  body('external.destinationUrl')
    .optional({ nullable: true })
    .isURL({ protocols: ['https'], require_protocol: true })
    .withMessage('external.destinationUrl must be a valid https:// URL')
    .isLength({ max: 2048 }),
  body('external.advertiserName').optional({ nullable: true }).isString().isLength({ max: 120 }),
  body('external.advertiserLogoUrl').optional({ nullable: true }).isString().isLength({ max: 2048 }),
  body('external.advertiserLogoBase64').optional({ nullable: true }).isString(),
  body('external.category').optional({ nullable: true }).isString().isLength({ max: 120 }),
  body('external.subCategory').optional({ nullable: true }).isString().isLength({ max: 120 })
];

// productId/destinationUrl are cross-conditional on adSource, so they're
// validated with a single custom() per field rather than two exclusive chains.
const createCampaignValidation = [
  body('name').trim().notEmpty().isLength({ max: 160 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('status').optional().isIn(AD_CAMPAIGN_STATUSES),
  body('productId')
    .if((value, { req }) => req.body.adSource !== 'external')
    .custom(isObjectId)
    .withMessage('Valid product id is required'),
  body('external.destinationUrl')
    .if((value, { req }) => req.body.adSource === 'external')
    .notEmpty()
    .withMessage('external.destinationUrl is required for external campaigns'),
  body('external.advertiserName')
    .if((value, { req }) => req.body.adSource === 'external')
    .trim()
    .notEmpty()
    .withMessage('external.advertiserName is required for external campaigns'),
  body('placements').optional().isArray(),
  body('placements.*').optional().isIn(AD_PLACEMENTS),
  ...adTargetingValidation,
  ...adScheduleValidation,
  body('frequencyCapPerDay').optional().isInt({ min: 1, max: 50 }),
  body('popupCooldownMinutes').optional().isInt({ min: 5, max: 1440 }),
  body('priority').optional().isInt({ min: 1, max: 100 }),
  ...adCreativeValidation,
  ...adExternalValidation,
  body('sourceServiceRequest').optional().custom(isObjectId).withMessage('sourceServiceRequest must be valid id'),
  body('metadata').optional().isObject()
];

const updateCampaignValidation = [
  body('name').optional().isString().isLength({ max: 160 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('status').optional().isIn(AD_CAMPAIGN_STATUSES),
  body('productId').optional().custom(isObjectId).withMessage('productId must be valid id'),
  body('placements').optional().isArray(),
  body('placements.*').optional().isIn(AD_PLACEMENTS),
  ...adTargetingValidation,
  ...adScheduleValidation,
  body('frequencyCapPerDay').optional().isInt({ min: 1, max: 50 }),
  body('popupCooldownMinutes').optional().isInt({ min: 5, max: 1440 }),
  body('priority').optional().isInt({ min: 1, max: 100 }),
  ...adCreativeValidation,
  ...adExternalValidation,
  body('metadata').optional().isObject()
];

const listCampaignsValidation = [
  query('status').optional().isIn(AD_CAMPAIGN_STATUSES),
  query('search').optional().isString().isLength({ max: 160 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
];

const feedValidation = [
  query('placement').optional().isIn(AD_PLACEMENTS),
  query('limit').optional().isInt({ min: 1, max: 10 }),
  // Cross-sell placement: category + sub-category of the cart item that triggered the feed.
  query('category').optional().isString().trim().isLength({ max: 120 }),
  query('subCategory').optional().isString().trim().isLength({ max: 120 }),
  query('excludeProductId').optional().custom(isObjectId).withMessage('excludeProductId must be valid id')
];

const insightsValidation = [
  ...campaignIdParamValidation,
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601()
];

const recordEventValidation = [
  body('campaignId').custom(isObjectId).withMessage('Valid campaign id is required'),
  body('type').isIn(AD_EVENT_TYPES).withMessage('Invalid ad event type'),
  body('placement').optional().isIn(AD_PLACEMENTS),
  body('sessionId').optional().isString().isLength({ max: 120 }),
  body('metadata').optional().isObject()
];

const fromRequestValidation = [
  ...serviceRequestIdParamValidation,
  body('activate').optional().isBoolean(),
  body('prefillOnly').optional().isBoolean()
];

module.exports = {
  campaignIdParamValidation,
  serviceRequestIdParamValidation,
  createCampaignValidation,
  updateCampaignValidation,
  listCampaignsValidation,
  feedValidation,
  insightsValidation,
  recordEventValidation,
  fromRequestValidation
};
