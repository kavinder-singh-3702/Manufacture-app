const { body } = require('express-validator');

const themeOptions = ['system', 'light', 'dark'];

const updateProfileValidation = [
  body('firstName').optional().isString().withMessage('First name must be a string'),
  body('lastName').optional().isString(),
  body('displayName').optional().isString(),
  body('phone').optional().isString(),
  body('bio').optional().isString().isLength({ max: 500 }),
  body('address').optional().isObject(),
  body('address.line1').optional().isString(),
  body('address.line2').optional().isString(),
  body('address.city').optional().isString(),
  body('address.state').optional().isString(),
  body('address.postalCode').optional().isString(),
  body('address.country').optional().isString(),
  body('socialLinks').optional().isObject(),
  body('socialLinks.website').optional().isString(),
  body('socialLinks.linkedin').optional().isString(),
  body('socialLinks.twitter').optional().isString(),
  body('socialLinks.github').optional().isString(),
  body('preferences').optional().isObject(),
  body('preferences.locale').optional().isString(),
  body('preferences.timezone').optional().isString(),
  body('preferences.theme').optional().isIn(themeOptions),
  body('preferences.communications').optional().isObject(),
  body('preferences.communications.email').optional().isBoolean(),
  body('preferences.communications.sms').optional().isBoolean(),
  body('preferences.communications.push').optional().isBoolean(),
  body('activityTags').optional().isArray(),
  body('activityTags.*').optional().isString()
];

module.exports = {
  updateProfileValidation
};
