const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_LIFECYCLE_STATUSES,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_AUDIENCE
} = require('../constants/notification');

/**
 * Notification Service
 * Handles creating and managing in-app notifications
 */

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
  channels = [NOTIFICATION_CHANNELS.IN_APP]
}) => {
  try {
    // Build notification data, only including valid ObjectIds
    const notificationData = {
      audience: NOTIFICATION_AUDIENCE.USER,
      user: userId,
      eventKey,
      topic,
      title,
      body,
      data,
      channels,
      priority,
      status: NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED,
      deliveries: channels.map(channel => ({
        channel,
        status: NOTIFICATION_DELIVERY_STATUSES.DELIVERED,
        sentAt: new Date(),
        deliveredAt: new Date()
      })),
      sentAt: new Date(),
      deliveredAt: new Date()
    };

    // Only add company if valid ObjectId
    if (isValidObjectId(companyId)) {
      notificationData.company = companyId;
    }

    // Only add actor if valid ObjectId
    if (isValidObjectId(actorId)) {
      notificationData.actor = actorId;
    }

    const notification = new Notification(notificationData);

    await notification.save();
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

  return createNotification({
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
    channels: [NOTIFICATION_CHANNELS.IN_APP]
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

  const formatted = notifications.map(n => ({
    id: n._id.toString(),
    title: n.title,
    body: n.body,
    eventKey: n.eventKey,
    topic: n.topic,
    priority: n.priority,
    data: n.data,
    status: n.readAt ? 'read' : 'unread',
    readAt: n.readAt,
    createdAt: n.createdAt
  }));

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
  createDocumentRequestNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount
};
