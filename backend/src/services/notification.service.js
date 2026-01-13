const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_LIFECYCLE_STATUSES,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_AUDIENCE
} = require('../constants/notification');
const { emitToUser, emitToUsers } = require('../socket');

/**
 * Notification Service
 * Handles creating and managing in-app notifications
 */

const CHANNEL_OPTIONS = Object.values(NOTIFICATION_CHANNELS);

/**
 * Check if a string is a valid MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  if (!id) return false;
  try {
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  } catch {
    return false;
  }
};

const normalizeChannels = (channels = [NOTIFICATION_CHANNELS.IN_APP]) => {
  const normalized = Array.isArray(channels) ? channels : [channels];
  const filtered = normalized.filter((channel) => CHANNEL_OPTIONS.includes(channel));
  return [...new Set(filtered.length ? filtered : [NOTIFICATION_CHANNELS.IN_APP])];
};

const buildDeliveries = (channels) => {
  const now = new Date();
  return channels.map((channel) => {
    const immediate = channel === NOTIFICATION_CHANNELS.IN_APP;
    return {
      channel,
      status: immediate ? NOTIFICATION_DELIVERY_STATUSES.DELIVERED : NOTIFICATION_DELIVERY_STATUSES.QUEUED,
      requestedAt: now,
      sentAt: immediate ? now : undefined,
      deliveredAt: immediate ? now : undefined
    };
  });
};

const buildNotificationData = ({
  audience = NOTIFICATION_AUDIENCE.USER,
  userId,
  title,
  body,
  eventKey,
  topic = 'system',
  priority = NOTIFICATION_PRIORITIES.NORMAL,
  actorId,
  companyId,
  data = {},
  channels,
  templateKey,
  deduplicationKey,
  scheduledAt,
  expiresAt,
  recipients,
  metadata,
  createdBy
}) => {
  const resolvedChannels = normalizeChannels(channels);
  const deliveries = buildDeliveries(resolvedChannels);
  const allDelivered = deliveries.every(
    (delivery) => delivery.status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED
  );
  const notificationData = {
    audience,
    user: userId,
    eventKey,
    topic,
    title,
    body,
    data,
    channels: resolvedChannels,
    priority,
    status: allDelivered
      ? NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED
      : NOTIFICATION_LIFECYCLE_STATUSES.QUEUED,
    deliveries,
    sentAt: allDelivered ? new Date() : undefined,
    deliveredAt: allDelivered ? new Date() : undefined,
    templateKey,
    deduplicationKey,
    scheduledAt,
    expiresAt,
    recipients,
    metadata,
    createdBy
  };

  if (isValidObjectId(companyId)) {
    notificationData.company = companyId;
  }

  if (isValidObjectId(actorId)) {
    notificationData.actor = actorId;
  }

  return notificationData;
};

const formatNotification = (notification) => ({
  id: notification._id.toString(),
  title: notification.title,
  body: notification.body,
  eventKey: notification.eventKey,
  topic: notification.topic,
  priority: notification.priority,
  data: notification.data,
  status: notification.readAt ? 'read' : 'unread',
  readAt: notification.readAt,
  createdAt: notification.createdAt
});

const emitNotification = (userId, notification) => {
  if (!userId || !notification) return;
  emitToUser(userId, 'notification:new', formatNotification(notification));
};

const emitNotificationsBulk = (userIds, notifications) => {
  if (!Array.isArray(userIds) || !Array.isArray(notifications)) return;
  const payloadByUser = notifications.reduce((acc, notification) => {
    const userId = notification.user?.toString();
    if (!userId) return acc;
    acc[userId] = formatNotification(notification);
    return acc;
  }, {});
  emitToUsers(userIds, 'notification:new', payloadByUser);
};

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {string} options.userId - Target user ID
 * @param {string} options.title - Notification title
 * @param {string} options.body - Notification body/message
 * @param {string} options.eventKey - Event identifier (e.g., 'company.verification.request')
 * @param {string} options.topic - Topic/category (e.g., 'compliance', 'system')
 * @param {string} options.priority - Priority level (low, normal, high, critical)
 * @param {string} options.actorId - User ID who triggered this notification
 * @param {string} options.companyId - Associated company ID (optional)
 * @param {Object} options.data - Additional data payload
 * @param {Array} options.channels - Delivery channels (default: in_app)
 * @returns {Promise<Object>} - Created notification
 */
const createNotification = async ({
  userId,
  title,
  body,
  eventKey,
  topic = 'system',
  priority = NOTIFICATION_PRIORITIES.NORMAL,
  actorId,
  companyId,
  data = {},
  channels = [NOTIFICATION_CHANNELS.IN_APP],
  templateKey,
  deduplicationKey,
  scheduledAt,
  expiresAt,
  recipients,
  metadata,
  createdBy
}) => {
  try {
    const notificationData = buildNotificationData({
      audience: NOTIFICATION_AUDIENCE.USER,
      userId,
      title,
      body,
      eventKey,
      topic,
      priority,
      actorId,
      companyId,
      data,
      channels,
      templateKey,
      deduplicationKey,
      scheduledAt,
      expiresAt,
      recipients,
      metadata,
      createdBy
    });

    const notification = await Notification.create(notificationData);

    emitNotification(userId, notification);
    console.log(`[NotificationService] Created notification for user ${userId}: ${title}`);

    return {
      success: true,
      notificationId: notification._id.toString(),
      notification
    };
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

const createNotificationsForUsers = async ({
  userIds,
  title,
  body,
  eventKey,
  topic = 'system',
  priority = NOTIFICATION_PRIORITIES.NORMAL,
  actorId,
  companyId,
  data = {},
  channels = [NOTIFICATION_CHANNELS.IN_APP],
  templateKey,
  deduplicationKey,
  scheduledAt,
  expiresAt,
  recipients,
  metadata,
  createdBy
}) => {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];
  if (!uniqueUserIds.length) {
    return { success: false, error: 'No recipients provided' };
  }

  const notificationsData = uniqueUserIds.map((id) =>
    buildNotificationData({
      audience: NOTIFICATION_AUDIENCE.USER,
      userId: id,
      title,
      body,
      eventKey,
      topic,
      priority,
      actorId,
      companyId,
      data,
      channels,
      templateKey,
      deduplicationKey: deduplicationKey ? `${deduplicationKey}:${id}` : undefined,
      scheduledAt,
      expiresAt,
      recipients,
      metadata,
      createdBy
    })
  );

  try {
    const notifications = await Notification.insertMany(notificationsData, { ordered: false });
    emitNotificationsBulk(uniqueUserIds, notifications);

    return {
      success: true,
      notificationIds: notifications.map((notification) => notification._id.toString()),
      count: notifications.length
    };
  } catch (error) {
    console.error('[NotificationService] Failed to create bulk notifications:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

const dispatchNotification = async ({
  audience = NOTIFICATION_AUDIENCE.USER,
  userId,
  userIds = [],
  companyId,
  title,
  body,
  eventKey,
  topic,
  priority,
  actorId,
  data,
  channels,
  templateKey,
  deduplicationKey,
  scheduledAt,
  expiresAt,
  recipients,
  metadata,
  createdBy
}) => {
  const targets = [...new Set([userId, ...userIds].filter(Boolean))];
  if (audience === NOTIFICATION_AUDIENCE.USER) {
    if (targets.length === 1) {
      return createNotification({
        userId: targets[0],
        title,
        body,
        eventKey,
        topic,
        priority,
        actorId,
        companyId,
        data,
        channels,
        templateKey,
        deduplicationKey,
        scheduledAt,
        expiresAt,
        recipients,
        metadata,
        createdBy
      });
    }
    return createNotificationsForUsers({
      userIds: targets,
      title,
      body,
      eventKey,
      topic,
      priority,
      actorId,
      companyId,
      data,
      channels,
      templateKey,
      deduplicationKey,
      scheduledAt,
      expiresAt,
      recipients,
      metadata,
      createdBy
    });
  }

  if (targets.length) {
    return createNotificationsForUsers({
      userIds: targets,
      title,
      body,
      eventKey,
      topic,
      priority,
      actorId,
      companyId,
      data,
      channels,
      templateKey,
      deduplicationKey,
      scheduledAt,
      expiresAt,
      recipients,
      metadata,
      createdBy
    });
  }

  try {
    const notificationData = buildNotificationData({
      audience,
      userId: undefined,
      title,
      body,
      eventKey,
      topic,
      priority,
      actorId,
      companyId,
      data,
      channels,
      templateKey,
      deduplicationKey,
      scheduledAt,
      expiresAt,
      recipients,
      metadata,
      createdBy
    });

    const notification = await Notification.create(notificationData);

    return {
      success: true,
      notificationId: notification._id.toString(),
      notification
    };
  } catch (error) {
    console.error('[NotificationService] Failed to dispatch notification:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Create a document request notification for company owner
 * @param {Object} options - Notification options
 * @param {string} options.userId - Owner's user ID
 * @param {string} options.companyId - Company ID
 * @param {string} options.companyName - Company display name
 * @param {string} options.actorId - Admin user ID who sent the request
 * @param {string} options.customMessage - Optional custom message
 * @returns {Promise<Object>} - Created notification result
 */
const createDocumentRequestNotification = async ({
  userId,
  companyId,
  companyName,
  actorId,
  customMessage
}) => {
  const title = 'Document Verification Required';
  const body = customMessage
    ? `Please submit verification documents for "${companyName}". Admin message: ${customMessage}`
    : `Please submit verification documents for "${companyName}" to complete the verification process.`;

  return dispatchNotification({
    userId,
    title,
    body,
    eventKey: 'company.verification.documents_requested',
    topic: 'compliance',
    priority: NOTIFICATION_PRIORITIES.HIGH,
    actorId,
    companyId,
    data: {
      companyId,
      companyName,
      customMessage,
      action: 'submit_documents',
      actionUrl: `/company/${companyId}/verification`
    },
    channels: [NOTIFICATION_CHANNELS.IN_APP],
    createdBy: actorId
  });
};

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {string} options.status - Filter by read/unread status
 * @param {number} options.limit - Max results
 * @param {number} options.offset - Skip results
 * @returns {Promise<Object>} - Notifications list with pagination
 */
const getUserNotifications = async (userId, { status, limit = 20, offset = 0 } = {}) => {
  const filter = { user: userId };

  if (status === 'unread') {
    filter.readAt = null;
  } else if (status === 'read') {
    filter.readAt = { $ne: null };
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter)
  ]);

  const formatted = notifications.map((notification) => formatNotification(notification));

  return {
    notifications: formatted,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + notifications.length < total
    }
  };
};

/**
 * Mark a notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for verification)
 * @returns {Promise<Object>} - Update result
 */
const markAsRead = async (notificationId, userId) => {
  const result = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { readAt: new Date() },
    { new: true }
  );

  if (!result) {
    return { success: false, error: 'Notification not found' };
  }

  return { success: true, notification: result };
};

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Update result
 */
const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, readAt: null },
    { readAt: new Date() }
  );

  return {
    success: true,
    modifiedCount: result.modifiedCount
  };
};

/**
 * Get unread notification count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} - Unread count
 */
const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, readAt: null });
};

module.exports = {
  createNotification,
  createNotificationsForUsers,
  dispatchNotification,
  createDocumentRequestNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
