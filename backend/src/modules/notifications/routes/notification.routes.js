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
  adminGetBatchController,
  adminCancelBatchController,
  adminResendBatchController
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
  adminListNotificationsQueryValidation,
  batchIdParamValidation,
  batchDetailQueryValidation
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
router.get('/admin/batches/:batchId', authorizeRoles('admin'), validate(batchDetailQueryValidation), adminGetBatchController);
router.patch('/admin/batches/:batchId/cancel', authorizeRoles('admin'), validate(batchIdParamValidation), adminCancelBatchController);
router.post('/admin/batches/:batchId/resend', authorizeRoles('admin'), validate(batchIdParamValidation), adminResendBatchController);

router.post(
  '/dispatch',
  authorizeRoles('admin'),
  validate(dispatchNotificationValidation),
  dispatchNotificationController
);

module.exports = router;
