const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const {
  OFFER_TYPES,
  OFFER_STATUSES,
  CAMPAIGN_CONTENT_TYPES,
  CAMPAIGN_PRIORITIES
} = require('../../../models/userPersonalizedOffer.model');
const { SERVICE_TYPES } = require('../../../constants/services');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const getContentType = (req) => (req.body?.contentType || 'product');

const validateProductIdForContentType = (value, { req }) => {
  const contentType = getContentType(req);
  if (contentType === 'product') {
    return isObjectId(value);
  }
  if (value === undefined || value === null || value === '') return true;
  return isObjectId(value);
};

const validateServiceTypeForContentType = (value, { req }) => {
  const contentType = getContentType(req);
  if (contentType === 'service') {
    return typeof value === 'string' && SERVICE_TYPES.includes(value);
  }
  if (value === undefined || value === null || value === '') return true;
  return SERVICE_TYPES.includes(value);
};

const validateNewPriceForContentType = (value, { req }) => {
  const contentType = getContentType(req);
  if (contentType === 'service') {
    if (value === undefined || value === null || value === '') return true;
  } else if (value === undefined || value === null || value === '') {
    return false;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
};

const sharedCampaignBodyValidation = [
  body('contentType').optional().isIn(CAMPAIGN_CONTENT_TYPES),
  body('serviceType')
    .optional({ nullable: true })
    .custom(validateServiceTypeForContentType)
    .withMessage('serviceType is required for service campaigns and must be valid'),
  body('productId')
    .optional({ nullable: true })
    .custom(validateProductIdForContentType)
    .withMessage('productId is required for product campaigns and must be valid'),
  body('title').optional().isString().trim().isLength({ min: 3, max: 200 }),
  body('message').optional().isString().trim().isLength({ min: 0, max: 500 }),
  body('offerType').optional().isIn(OFFER_TYPES),
  body('newPrice')
    .optional({ nullable: true })
    .custom(validateNewPriceForContentType)
    .withMessage('newPrice is required for product campaigns and must be a valid amount'),
  body('oldPrice').optional({ nullable: true }).isNumeric(),
  body('currency').optional().isString().isLength({ min: 3, max: 5 }),
  body('minOrderValue').optional({ nullable: true }).isNumeric(),
  body('priority').optional().isIn(CAMPAIGN_PRIORITIES),
  body('startsAt').optional({ nullable: true }).isISO8601(),
  body('expiresAt').optional({ nullable: true }).isISO8601(),
  body('status').optional().isIn(OFFER_STATUSES),
  body('creative').optional().isObject(),
  body('creative.headline').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('creative.subheadline').optional().isString().trim().isLength({ min: 1, max: 400 }),
  body('creative.badge').optional().isString().trim().isLength({ min: 1, max: 60 }),
  body('creative.themeKey').optional().isString().trim().isLength({ min: 1, max: 60 }),
  body('creative.ctaLabel').optional().isString().trim().isLength({ min: 1, max: 80 }),
  body('contact').optional().isObject(),
  body('contact.adminUserId').optional({ nullable: true }).custom(isObjectId).withMessage('Invalid contact.adminUserId'),
  body('contact.adminName').optional().isString().trim().isLength({ min: 1, max: 120 }),
  body('contact.phone').optional().isString().trim().isLength({ min: 3, max: 40 }),
  body('contact.allowChat').optional().isBoolean(),
  body('contact.allowCall').optional().isBoolean(),
  body('metadata').optional().isObject()
];

const createOfferValidation = [
  param('userId').custom(isObjectId).withMessage('Invalid userId'),
  body('title').isString().trim().isLength({ min: 3, max: 200 }),
  ...sharedCampaignBodyValidation
];

const updateCampaignValidation = [
  param('userId').custom(isObjectId).withMessage('Invalid userId'),
  param('campaignId').custom(isObjectId).withMessage('Invalid campaignId'),
  body().custom((value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    return Object.keys(value).length > 0;
  }).withMessage('At least one field is required to update'),
  ...sharedCampaignBodyValidation
];

const listOffersQueryValidation = [
  query('includeExpired').optional().isBoolean().toBoolean(),
  query('status').optional().isIn(OFFER_STATUSES),
  query('contentType').optional().isIn(CAMPAIGN_CONTENT_TYPES),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('userId').optional().custom(isObjectId).withMessage('Invalid userId')
];

module.exports = {
  createOfferValidation,
  updateCampaignValidation,
  listOffersQueryValidation
};
