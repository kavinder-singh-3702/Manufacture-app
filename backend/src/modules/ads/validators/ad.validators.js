const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const {
  AD_CAMPAIGN_STATUSES,
  AD_PLACEMENTS,
  AD_TARGETING_MODES,
  AD_EVENT_TYPES
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
  body('creative.badge').optional().isString().isLength({ max: 40 })
];

const adScheduleValidation = [
  body('schedule').optional().isObject(),
  body('schedule.startAt').optional().isISO8601().toDate(),
  body('schedule.endAt').optional().isISO8601().toDate()
];

const createCampaignValidation = [
  body('name').trim().notEmpty().isLength({ max: 160 }),
  body('description').optional().isString().isLength({ max: 1000 }),
  body('status').optional().isIn(AD_CAMPAIGN_STATUSES),
  body('productId').custom(isObjectId).withMessage('Valid product id is required'),
  body('placements').optional().isArray(),
  body('placements.*').optional().isIn(AD_PLACEMENTS),
  ...adTargetingValidation,
  ...adScheduleValidation,
  body('frequencyCapPerDay').optional().isInt({ min: 1, max: 50 }),
  body('priority').optional().isInt({ min: 1, max: 100 }),
  ...adCreativeValidation,
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
  body('priority').optional().isInt({ min: 1, max: 100 }),
  ...adCreativeValidation,
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
  query('limit').optional().isInt({ min: 1, max: 10 })
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
  recordEventValidation,
  fromRequestValidation
};
