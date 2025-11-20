const { body, param } = require('express-validator');
const {
  BUSINESS_ACCOUNT_TYPES,
  BUSINESS_CATEGORIES
} = require('../../../constants/business');
const { COMPANY_SIZE_BUCKETS } = require('../../../constants/company');

const createCompanyValidation = [
  body('displayName').trim().notEmpty().withMessage('Display name is required'),
  body('type').optional().isIn(BUSINESS_ACCOUNT_TYPES).withMessage('Invalid company type supplied'),
  body('categories')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Categories must be provided as an array'),
  body('categories.*')
    .optional()
    .isString()
    .custom((value) => BUSINESS_CATEGORIES.includes(value.toLowerCase()))
    .withMessage('One or more categories are invalid'),
  body('sizeBucket')
    .optional()
    .isIn(COMPANY_SIZE_BUCKETS)
    .withMessage('Invalid size bucket supplied'),
  body('slug')
    .optional()
    .isString()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug may only contain lowercase letters, numbers and hyphens'),
  body('contact').optional().isObject().withMessage('Contact must be an object'),
  body('headquarters').optional().isObject().withMessage('Headquarters must be an object'),
  body('locations')
    .optional()
    .isArray()
    .withMessage('Locations must be an array of addresses'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('settings').optional().isObject().withMessage('Settings must be an object')
];

const companyIdParamValidation = [
  param('companyId').isMongoId().withMessage('A valid company id is required')
];

const updateCompanyValidation = [
  body('displayName').optional().trim().notEmpty().withMessage('Display name cannot be empty'),
  body('type').optional().isIn(BUSINESS_ACCOUNT_TYPES).withMessage('Invalid company type supplied'),
  body('categories')
    .optional()
    .isArray({ min: 1 })
    .withMessage('Categories must be provided as an array'),
  body('categories.*')
    .optional()
    .isString()
    .custom((value) => BUSINESS_CATEGORIES.includes(value.toLowerCase()))
    .withMessage('One or more categories are invalid'),
  body('sizeBucket')
    .optional()
    .isIn(COMPANY_SIZE_BUCKETS)
    .withMessage('Invalid size bucket supplied'),
  body('slug')
    .optional()
    .isString()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug may only contain lowercase letters, numbers and hyphens'),
  body('contact').optional().isObject().withMessage('Contact must be an object'),
  body('headquarters').optional().isObject().withMessage('Headquarters must be an object'),
  body('locations')
    .optional()
    .isArray()
    .withMessage('Locations must be an array of addresses'),
  body('metadata').optional().isObject().withMessage('Metadata must be an object'),
  body('settings').optional().isObject().withMessage('Settings must be an object')
];

module.exports = {
  createCompanyValidation,
  companyIdParamValidation,
  updateCompanyValidation
};
