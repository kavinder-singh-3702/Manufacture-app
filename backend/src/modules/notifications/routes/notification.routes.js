const { Router } = require('express');
const {
  listNotifications,
  getUnreadCountController,
  markNotificationRead,
  markAllNotificationsRead,
  archiveNotificationController,
  unarchiveNotificationController,
  acknowledgeNotificationController,
  registerDeviceController,
  unregisterDeviceController,
  getNotificationPreferencesController,
  updateNotificationPreferencesController,
  dispatchNotificationController,
  adminListNotificationsController,
  adminGetNotificationController,
  adminCancelNotificationController,
  adminResendNotificationController
} = require('../controllers/notification.controller');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  listNotificationsQueryValidation,
  notificationIdParamValidation,
  dispatchNotificationValidation,
  deviceRegistrationValidation,
  pushTokenParamValidation,
  notificationPreferencesValidation,
  adminListNotificationsQueryValidation
} = require('../validators/notification.validators');

const router = Router();

router.use(authenticate);

router.get('/', validate(listNotificationsQueryValidation), listNotifications);
router.get('/unread-count', getUnreadCountController);
router.get('/preferences', getNotificationPreferencesController);
router.patch('/preferences', validate(notificationPreferencesValidation), updateNotificationPreferencesController);
router.post('/devices/register', validate(deviceRegistrationValidation), registerDeviceController);
router.delete('/devices/:pushToken', validate(pushTokenParamValidation), unregisterDeviceController);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:notificationId/read', validate(notificationIdParamValidation), markNotificationRead);
router.patch('/:notificationId/archive', validate(notificationIdParamValidation), archiveNotificationController);
router.patch('/:notificationId/unarchive', validate(notificationIdParamValidation), unarchiveNotificationController);
router.post('/:notificationId/ack', validate(notificationIdParamValidation), acknowledgeNotificationController);

router.get('/admin', authorizeRoles('admin'), validate(adminListNotificationsQueryValidation), adminListNotificationsController);
router.get('/admin/:notificationId', authorizeRoles('admin'), validate(notificationIdParamValidation), adminGetNotificationController);
router.patch('/admin/:notificationId/cancel', authorizeRoles('admin'), validate(notificationIdParamValidation), adminCancelNotificationController);
router.post('/admin/:notificationId/resend', authorizeRoles('admin'), validate(notificationIdParamValidation), adminResendNotificationController);

router.post(
  '/dispatch',
  authorizeRoles('admin'),
  validate(dispatchNotificationValidation),
  dispatchNotificationController
);

module.exports = router;
