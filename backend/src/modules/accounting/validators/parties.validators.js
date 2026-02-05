const { body, param, query } = require('express-validator');
const { PARTY_TYPES } = require('../../../constants/accounting');

const partyIdParamValidation = [param('partyId').isMongoId().withMessage('Valid partyId is required')];

const listPartiesValidation = [
  query('type').optional().isIn(PARTY_TYPES),
  query('search').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

const createPartyValidation = [
  body('name').trim().notEmpty().withMessage('name is required'),
  body('type').isIn(PARTY_TYPES).withMessage('Invalid party type'),
  body('gstin').optional().isString().trim(),
  body('pan').optional().isString().trim(),
  body('contact').optional().isObject(),
  body('contact.email').optional().isEmail(),
  body('contact.phone').optional().isString().trim(),
  body('contact.contactPerson').optional().isString().trim(),
  body('address').optional().isObject(),
  body('creditDaysDefault').optional().isInt({ min: 0 }).toInt(),
  body('metadata').optional().isObject()
];

const updatePartyValidation = [
  body('name').optional().isString().trim().notEmpty(),
  body('type').optional().isIn(PARTY_TYPES),
  body('gstin').optional().isString().trim(),
  body('pan').optional().isString().trim(),
  body('contact').optional().isObject(),
  body('contact.email').optional().isEmail(),
  body('contact.phone').optional().isString().trim(),
  body('contact.contactPerson').optional().isString().trim(),
  body('address').optional().isObject(),
  body('creditDaysDefault').optional().isInt({ min: 0 }).toInt(),
  body('metadata').optional().isObject()
];

const deletePartyValidation = [query('force').optional().isBoolean().toBoolean()];

module.exports = {
  partyIdParamValidation,
  listPartiesValidation,
  createPartyValidation,
  updatePartyValidation,
  deletePartyValidation
};

