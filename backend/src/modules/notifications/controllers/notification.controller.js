const createError = require('http-errors');
const {
  dispatchNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  archiveNotification,
  unarchiveNotification,
  acknowledgeNotification,
  getUnreadCount,
  registerUserDevice,
  unregisterUserDevice,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  listAdminNotifications,
  getAdminNotificationById,
  cancelAdminNotification,
  resendAdminNotification,
} = require('../../../services/notification.service');
const { NOTIFICATION_AUDIENCE } = require('../../../constants/notification');

const listNotifications = async (req, res, next) => {
  try {
    const result = await getUserNotifications(req.user.id, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getUnreadCountController = async (req, res, next) => {
  try {
    const count = await getUnreadCount(req.user.id);
    return res.json({ count });
  } catch (error) {
    return next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const result = await markAsRead(req.params.notificationId, req.user.id);
    if (!result.success) {
      return next(createError(404, result.error));
    }
    return res.json({ notification: result.notification });
  } catch (error) {
    return next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await markAllAsRead(req.user.id);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const archiveNotificationController = async (req, res, next) => {
  try {
    const result = await archiveNotification(req.params.notificationId, req.user.id);
    if (!result.success) {
      return next(createError(404, result.error));
    }
    return res.json({ notification: result.notification });
  } catch (error) {
    return next(error);
  }
};

const unarchiveNotificationController = async (req, res, next) => {
  try {
    const result = await unarchiveNotification(req.params.notificationId, req.user.id);
    if (!result.success) {
      return next(createError(404, result.error));
    }
    return res.json({ notification: result.notification });
  } catch (error) {
    return next(error);
  }
};

const acknowledgeNotificationController = async (req, res, next) => {
  try {
    const result = await acknowledgeNotification(req.params.notificationId, req.user.id);
    if (!result.success) {
      return next(createError(404, result.error));
    }
    return res.json({ notification: result.notification });
  } catch (error) {
    return next(error);
  }
};

const registerDeviceController = async (req, res, next) => {
  try {
    const result = await registerUserDevice(req.user.id, req.body);
    if (!result.success) {
      return next(createError(400, result.error || 'Unable to register device'));
    }
    return res.status(201).json({ device: result.device });
  } catch (error) {
    return next(error);
  }
};

const unregisterDeviceController = async (req, res, next) => {
  try {
    const token = decodeURIComponent(req.params.pushToken);
    const result = await unregisterUserDevice(req.user.id, token);
    if (!result.success) {
      return next(createError(404, result.error));
    }
    return res.json({ device: result.device });
  } catch (error) {
    return next(error);
  }
};

const getNotificationPreferencesController = async (req, res, next) => {
  try {
    const preferences = await getUserNotificationPreferences(req.user.id);
    return res.json({ preferences });
  } catch (error) {
    return next(error);
  }
};

const updateNotificationPreferencesController = async (req, res, next) => {
  try {
    const preferences = await updateUserNotificationPreferences(req.user.id, req.body);
    if (!preferences) {
      return next(createError(404, 'User not found'));
    }
    return res.json({ preferences });
  } catch (error) {
    return next(error);
  }
};

const dispatchNotificationController = async (req, res, next) => {
  try {
    const audience = req.body.audience || NOTIFICATION_AUDIENCE.USER;
    const userIds = Array.isArray(req.body.userIds) ? req.body.userIds : [];
    const userId = req.body.userId;
    const targets = [userId, ...userIds].filter(Boolean);

    if (audience === NOTIFICATION_AUDIENCE.USER && !targets.length) {
      throw createError(400, 'Provide at least one userId to dispatch notifications.');
    }

    if (audience !== NOTIFICATION_AUDIENCE.USER && !targets.length) {
      throw createError(400, 'Provide userIds to fan out company or broadcast notifications.');
    }

    const result = await dispatchNotification({
      audience,
      userId,
      userIds,
      companyId: req.body.companyId,
      title: req.body.title,
      body: req.body.body,
      eventKey: req.body.eventKey,
      topic: req.body.topic,
      priority: req.body.priority,
      actorId: req.user.id,
      data: req.body.data,
      channels: req.body.channels,
      templateKey: req.body.templateKey,
      deduplicationKey: req.body.deduplicationKey,
      scheduledAt: req.body.scheduledAt,
      expiresAt: req.body.expiresAt,
      recipients: req.body.recipients,
      metadata: req.body.metadata,
      createdBy: req.user.id,
      action: req.body.action,
      isSilent: req.body.isSilent,
      requiresAck: req.body.requiresAck,
      deliveryPolicy: req.body.deliveryPolicy,
    });

    if (!result.success) {
      throw createError(400, result.error || 'Failed to dispatch notification');
    }

    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

const adminListNotificationsController = async (req, res, next) => {
  try {
    const result = await listAdminNotifications(req.user.id, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const adminGetNotificationController = async (req, res, next) => {
  try {
    const notification = await getAdminNotificationById(req.params.notificationId, req.user.id);
    if (!notification) {
      return next(createError(404, 'Notification not found'));
    }
    return res.json({ notification });
  } catch (error) {
    return next(error);
  }
};

const adminCancelNotificationController = async (req, res, next) => {
  try {
    const notification = await cancelAdminNotification(req.params.notificationId, req.user.id);
    if (!notification) {
      return next(createError(404, 'Notification not found'));
    }
    return res.json({ notification });
  } catch (error) {
    return next(error);
  }
};

const adminResendNotificationController = async (req, res, next) => {
  try {
    const result = await resendAdminNotification(req.params.notificationId, req.user.id);
    if (!result) {
      return next(createError(404, 'Notification not found'));
    }
    if (!result.success) {
      return next(createError(400, result.error || 'Unable to resend notification'));
    }
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
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
  adminResendNotificationController,
};
