const { body, param, query } = require('express-validator');
const mongoose = require('mongoose');
const { OFFER_TYPES } = require('../../../models/userPersonalizedOffer.model');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const createOfferValidation = [
  param('userId').custom(isObjectId).withMessage('Invalid userId'),
  body('productId').custom(isObjectId).withMessage('Invalid productId'),
  body('title').isString().trim().isLength({ min: 3, max: 200 }),
  body('message').optional().isString().trim().isLength({ min: 0, max: 500 }),
  body('offerType').optional().isIn(OFFER_TYPES),
  body('newPrice').isNumeric().withMessage('newPrice is required'),
  body('oldPrice').optional().isNumeric(),
  body('currency').optional().isString().isLength({ min: 3, max: 5 }),
  body('minOrderValue').optional().isNumeric(),
  body('expiresAt').optional().isISO8601(),
  body('metadata').optional().isObject()
];

const listOffersQueryValidation = [
  query('includeExpired').optional().isBoolean().toBoolean()
];

module.exports = {
  createOfferValidation,
  listOffersQueryValidation
};
