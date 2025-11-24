const { body } = require('express-validator');
const {
  BUSINESS_ACCOUNT_TYPES,
  BUSINESS_CATEGORIES
} = require('../../../constants/business');

const ACCOUNT_TYPES_REQUIRING_COMPANY = BUSINESS_ACCOUNT_TYPES.filter((type) => type !== 'normal');
const requiresCompanyDetails = (accountType) => ACCOUNT_TYPES_REQUIRING_COMPANY.includes(accountType);

const signupStartValidation = [
  body('fullName').trim().isLength({ min: 2 }).withMessage('Full name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone')
    .trim()
    .isLength({ min: 7 })
    .withMessage('Phone number must be at least 7 digits')
    .matches(/^[0-9+]+$/)
    .withMessage('Phone number can only include digits and + sign')
];

const signupVerifyValidation = [body('otp').trim().notEmpty().withMessage('OTP is required')];

const signupCompleteValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('accountType')
    .isIn(BUSINESS_ACCOUNT_TYPES)
    .withMessage('Invalid account type supplied'),
  body('companyName').custom((value, { req }) => {
    if (requiresCompanyDetails(req.body.accountType) && (!value || !value.trim())) {
      throw new Error('Company name is required for trader or manufacturer');
    }
    return true;
  }),
  body('categories').custom((value, { req }) => {
    if (!requiresCompanyDetails(req.body.accountType)) {
      return true;
    }

    if (!Array.isArray(value) || !value.length) {
      throw new Error('Categories must be provided as a non-empty array');
    }

    return true;
  }),
  body('categories.*').custom((category, { req }) => {
    if (!requiresCompanyDetails(req.body.accountType)) {
      return true;
    }
    if (typeof category !== 'string' || !BUSINESS_CATEGORIES.includes(category.toLowerCase())) {
      throw new Error('One or more categories are invalid');
    }
    return true;
  })
];

const loginValidation = [
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error('Email or phone is required');
    }
    return true;
  })
];

const forgotPasswordValidation = [
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 7 })
    .withMessage('Phone number must be at least 7 digits')
    .matches(/^[0-9+]+$/)
    .withMessage('Phone number can only include digits and + sign'),
  body().custom((value) => {
    if (!value.email && !value.phone) {
      throw new Error('Email or phone is required');
    }
    return true;
  })
];

const resetPasswordValidation = [
  body('token').trim().notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];

module.exports = {
  signupStartValidation,
  signupVerifyValidation,
  signupCompleteValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation
};
