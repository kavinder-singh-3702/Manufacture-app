const { body, query, param } = require('express-validator');
const mongoose = require('mongoose');
const {
  NOTIFICATION_AUDIENCE,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_ACTION_TYPES,
} = require('../../../constants/notification');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const listNotificationsQueryValidation = [
  query('status').optional().isIn(['read', 'unread']),
  query('topic').optional().isString().trim().isLength({ min: 1, max: 100 }),
  query('priority').optional().isIn(Object.values(NOTIFICATION_PRIORITIES)),
  query('archived').optional().isIn(['true', 'false']),
  query('search').optional().isString().trim().isLength({ min: 1, max: 120 }),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
];

const notificationIdParamValidation = [
  param('notificationId').custom(isObjectId).withMessage('Invalid notificationId')
];

const dispatchNotificationValidation = [
  body('audience').optional().isIn(Object.values(NOTIFICATION_AUDIENCE)),
  body('userId').optional().custom(isObjectId).withMessage('Invalid userId'),
  body('userIds').optional().isArray({ min: 1 }),
  body('userIds.*').optional().custom(isObjectId).withMessage('Invalid userId'),
  body('companyId').optional().custom(isObjectId).withMessage('Invalid companyId'),
  body('title').isString().trim().isLength({ min: 1, max: 200 }),
  body('body').isString().trim().isLength({ min: 1, max: 2000 }),
  body('eventKey').isString().trim().isLength({ min: 1, max: 200 }),
  body('topic').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('priority').optional().isIn(Object.values(NOTIFICATION_PRIORITIES)),
  body('channels').optional().isArray({ min: 1 }),
  body('channels.*').optional().isIn(Object.values(NOTIFICATION_CHANNELS)),
  body('data').optional().isObject(),
  body('templateKey').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('deduplicationKey').optional().isString().trim().isLength({ min: 1, max: 200 }),
  body('metadata').optional().isObject(),
  body('scheduledAt').optional().isISO8601(),
  body('expiresAt').optional().isISO8601(),
  body('recipients').optional().isArray(),
  body('action').optional().isObject(),
  body('action.type').optional().isIn(Object.values(NOTIFICATION_ACTION_TYPES)),
  body('action.label').optional().isString().trim().isLength({ min: 1, max: 80 }),
  body('action.routeName').optional().isString().trim().isLength({ min: 1, max: 80 }),
  body('action.routeParams').optional().isObject(),
  body('action.url').optional().isString().trim().isLength({ min: 1, max: 500 }),
  body('action.phone').optional().isString().trim().isLength({ min: 3, max: 30 }),
  body('isSilent').optional().isBoolean(),
  body('requiresAck').optional().isBoolean(),
  body('deliveryPolicy').optional().isObject(),
  body('deliveryPolicy.respectQuietHours').optional().isBoolean(),
  body('deliveryPolicy.allowPush').optional().isBoolean(),
  body('deliveryPolicy.allowInApp').optional().isBoolean(),
  body('deliveryPolicy.maxRetries').optional().isInt({ min: 0, max: 10 }),
  body('deliveryPolicy.allowCriticalOverride').optional().isBoolean(),
];

const deviceRegistrationValidation = [
  body('pushToken').isString().trim().isLength({ min: 10, max: 300 }),
  body('platform').optional().isIn(['ios', 'android', 'web']),
  body('pushProvider').optional().isIn(['expo']),
  body('appVersion').optional().isString().trim().isLength({ max: 30 }),
  body('buildNumber').optional().isString().trim().isLength({ max: 30 }),
  body('deviceModel').optional().isString().trim().isLength({ max: 80 }),
  body('osVersion').optional().isString().trim().isLength({ max: 30 }),
  body('locale').optional().isString().trim().isLength({ max: 20 }),
  body('timezone').optional().isString().trim().isLength({ max: 80 }),
  body('metadata').optional().isObject(),
];

const pushTokenParamValidation = [
  param('pushToken').isString().trim().isLength({ min: 10, max: 300 }),
];

const notificationPreferencesValidation = [
  body('masterEnabled').optional().isBoolean(),
  body('inAppEnabled').optional().isBoolean(),
  body('pushEnabled').optional().isBoolean(),
  body('emailEnabled').optional().isBoolean(),
  body('smsEnabled').optional().isBoolean(),
  body('quietHours').optional().isObject(),
  body('quietHours.enabled').optional().isBoolean(),
  body('quietHours.start').optional().isString().trim().matches(/^\d{2}:\d{2}$/),
  body('quietHours.end').optional().isString().trim().matches(/^\d{2}:\d{2}$/),
  body('quietHours.timezone').optional().isString().trim().isLength({ min: 1, max: 80 }),
  body('topicOverrides').optional().isObject(),
  body('priorityOverrides').optional().isObject(),
];

const adminListNotificationsQueryValidation = [
  query('userId').optional().custom(isObjectId).withMessage('Invalid userId'),
  query('topic').optional().isString().trim().isLength({ min: 1, max: 100 }),
  query('priority').optional().isIn(Object.values(NOTIFICATION_PRIORITIES)),
  query('eventKey').optional().isString().trim().isLength({ min: 1, max: 200 }),
  query('status').optional().isString().trim().isLength({ min: 1, max: 40 }),
  query('search').optional().isString().trim().isLength({ min: 1, max: 120 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
];

module.exports = {
  listNotificationsQueryValidation,
  notificationIdParamValidation,
  dispatchNotificationValidation,
  deviceRegistrationValidation,
  pushTokenParamValidation,
  notificationPreferencesValidation,
  adminListNotificationsQueryValidation,
};
