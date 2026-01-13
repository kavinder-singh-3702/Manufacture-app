const createError = require('http-errors');
const {
  dispatchNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
} = require('../../../services/notification.service');
const { NOTIFICATION_AUDIENCE } = require('../../../constants/notification');

const listNotifications = async (req, res, next) => {
  try {
    const result = await getUserNotifications(req.user.id, {
      status: req.query.status,
      limit: req.query.limit,
      offset: req.query.offset
    });

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
      createdBy: req.user.id
    });

    if (!result.success) {
      throw createError(400, result.error || 'Failed to dispatch notification');
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
  dispatchNotificationController
};
