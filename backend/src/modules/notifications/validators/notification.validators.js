const { body, query, param } = require('express-validator');
const mongoose = require('mongoose');
const {
  NOTIFICATION_AUDIENCE,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES
} = require('../../../constants/notification');

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const listNotificationsQueryValidation = [
  query('status').optional().isIn(['read', 'unread']),
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
  body('recipients').optional().isArray()
];

module.exports = {
  listNotificationsQueryValidation,
  notificationIdParamValidation,
  dispatchNotificationValidation
};
