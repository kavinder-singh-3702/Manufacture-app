const { param, body, query } = require('express-validator');
const mongoose = require('mongoose');
const { EVENT_TYPES } = require('../../../models/userPreferenceEvent.model');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const logEventValidation = [
  body('type').isString().isIn(EVENT_TYPES),
  body('productId').optional().custom(isObjectId).withMessage('Invalid productId'),
  body('category').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('searchTerm').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('quantity').optional().isNumeric(),
  body('meta').optional().isObject()
];

const userIdParamValidation = [param('userId').custom(isObjectId).withMessage('Invalid userId')];

const preferenceSummaryQueryValidation = [
  query('days').optional().isInt({ min: 1, max: 365 }),
  query('limit').optional().isInt({ min: 1, max: 20 }),
  query('companyId').optional().custom(isObjectId).withMessage('Invalid companyId')
];

const homeFeedQueryValidation = [
  query('campaignLimit').optional().isInt({ min: 1, max: 20 }).toInt(),
  query('recommendationLimit').optional().isInt({ min: 1, max: 30 }).toInt()
];

module.exports = {
  logEventValidation,
  userIdParamValidation,
  preferenceSummaryQueryValidation,
  homeFeedQueryValidation
};
