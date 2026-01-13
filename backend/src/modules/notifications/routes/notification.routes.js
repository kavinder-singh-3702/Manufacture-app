const { Router } = require('express');
const {
  listNotifications,
  getUnreadCountController,
  markNotificationRead,
  markAllNotificationsRead,
  dispatchNotificationController
} = require('../controllers/notification.controller');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  listNotificationsQueryValidation,
  notificationIdParamValidation,
  dispatchNotificationValidation
} = require('../validators/notification.validators');

const router = Router();

router.use(authenticate);

router.get('/', validate(listNotificationsQueryValidation), listNotifications);
router.get('/unread-count', getUnreadCountController);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:notificationId/read', validate(notificationIdParamValidation), markNotificationRead);
router.post(
  '/dispatch',
  authorizeRoles('admin'),
  validate(dispatchNotificationValidation),
  dispatchNotificationController
);

module.exports = router;
