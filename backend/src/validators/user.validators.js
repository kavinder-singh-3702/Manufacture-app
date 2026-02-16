const { body } = require('express-validator');

const themeOptions = ['system', 'light', 'dark'];

const updateProfileValidation = [
  body('firstName').optional().isString().withMessage('First name must be a string'),
  body('lastName').optional().isString(),
  body('displayName').optional().isString(),
  body('phone').optional().isString(),
  body('avatarUrl').optional().isString(),
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
  body('preferences.notifications').optional().isObject(),
  body('preferences.notifications.masterEnabled').optional().isBoolean(),
  body('preferences.notifications.inAppEnabled').optional().isBoolean(),
  body('preferences.notifications.pushEnabled').optional().isBoolean(),
  body('preferences.notifications.emailEnabled').optional().isBoolean(),
  body('preferences.notifications.smsEnabled').optional().isBoolean(),
  body('preferences.notifications.quietHours').optional().isObject(),
  body('preferences.notifications.quietHours.enabled').optional().isBoolean(),
  body('preferences.notifications.quietHours.start').optional().isString(),
  body('preferences.notifications.quietHours.end').optional().isString(),
  body('preferences.notifications.quietHours.timezone').optional().isString(),
  body('preferences.notifications.topicOverrides').optional().isObject(),
  body('preferences.notifications.priorityOverrides').optional().isObject(),
  body('activityTags').optional().isArray(),
  body('activityTags.*').optional().isString()
];

const uploadUserFileValidation = [
  body('fileName').trim().notEmpty().withMessage('File name is required'),
  body('mimeType').optional().isString(),
  body('content').isString().notEmpty().withMessage('Base64 content is required'),
  body('purpose').optional().isString()
];

module.exports = {
  updateProfileValidation,
  uploadUserFileValidation
};
