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
  getAdminBatch,
  cancelAdminBatch,
  resendAdminBatch,
} = require('../../../services/notification.service');

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
    // Audience -> recipient resolution (including company/broadcast) now
    // happens entirely inside dispatchNotification via
    // notificationAudience.service — this controller no longer needs to
    // pre-validate that a userId/userIds list was provided for those
    // audiences (that check was actively wrong: it rejected the exact
    // 'broadcast' requests both admin studios send, since neither passes an
    // explicit userIds list for "everyone").
    const result = await dispatchNotification({
      audience: req.body.audience,
      userId: req.body.userId,
      userIds: req.body.userIds,
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

// Batch listing/detail/cancel/resend — one dispatch (whatever its audience
// fanned out to) is one logical row. Any admin can act on any admin's batch;
// routes already gate these behind authorizeRoles('admin'), and
// `?mine=true` is the opt-in filter for "just what I sent" (B5).
const adminListNotificationsController = async (req, res, next) => {
  try {
    const result = await listAdminNotifications(req.user.id, req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const adminGetBatchController = async (req, res, next) => {
  try {
    const result = await getAdminBatch(req.params.batchId, req.query);
    if (!result) {
      return next(createError(404, 'Notification batch not found'));
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const adminCancelBatchController = async (req, res, next) => {
  try {
    const result = await cancelAdminBatch(req.params.batchId);
    if (!result) {
      return next(createError(404, 'Notification batch not found'));
    }
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const adminResendBatchController = async (req, res, next) => {
  try {
    const result = await resendAdminBatch(req.params.batchId, req.user.id);
    if (!result) {
      return next(createError(404, 'Notification batch not found'));
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
  adminGetBatchController,
  adminCancelBatchController,
  adminResendBatchController,
};
