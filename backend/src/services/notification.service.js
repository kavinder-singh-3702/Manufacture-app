const mongoose = require('mongoose');
const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const UserDevice = require('../models/userDevice.model');
const {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_LIFECYCLE_STATUSES,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_AUDIENCE,
  PRIORITY_DEFAULT_CHANNELS,
  NOTIFICATION_ACTION_TYPES
} = require('../constants/notification');
const { emitToUser, emitToUsers } = require('../socket');

const CHANNEL_OPTIONS = Object.values(NOTIFICATION_CHANNELS);
const PRIORITY_OPTIONS = Object.values(NOTIFICATION_PRIORITIES);

const DEFAULT_DELIVERY_POLICY = {
  respectQuietHours: true,
  allowPush: true,
  allowInApp: true,
  maxRetries: 4,
  allowCriticalOverride: true,
};

const DEFAULT_NOTIFICATION_PREFERENCES = {
  masterEnabled: true,
  inAppEnabled: true,
  pushEnabled: true,
  emailEnabled: false,
  smsEnabled: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC',
  },
  topicOverrides: {},
  priorityOverrides: {},
};

const isValidObjectId = (id) => {
  if (!id) return false;
  try {
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  } catch {
    return false;
  }
};

const toPlainObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value.toObject === 'function') return value.toObject();
  if (typeof value === 'object') return value;
  return {};
};

const normalizeChannels = ({ channels, priority = NOTIFICATION_PRIORITIES.NORMAL }) => {
  const fallback = PRIORITY_DEFAULT_CHANNELS[priority] || PRIORITY_DEFAULT_CHANNELS[NOTIFICATION_PRIORITIES.NORMAL];
  const normalizedInput = Array.isArray(channels)
    ? channels
    : channels
      ? [channels]
      : fallback;
  const filtered = normalizedInput.filter((channel) => CHANNEL_OPTIONS.includes(channel));
  return [...new Set(filtered.length ? filtered : [NOTIFICATION_CHANNELS.IN_APP])];
};

const normalizePriority = (priority) =>
  PRIORITY_OPTIONS.includes(priority) ? priority : NOTIFICATION_PRIORITIES.NORMAL;

const normalizeAction = (action = {}) => {
  const plain = toPlainObject(action);
  const type = Object.values(NOTIFICATION_ACTION_TYPES).includes(plain.type)
    ? plain.type
    : NOTIFICATION_ACTION_TYPES.NONE;

  return {
    type,
    label: plain.label,
    routeName: plain.routeName,
    routeParams: toPlainObject(plain.routeParams),
    url: plain.url,
    phone: plain.phone,
  };
};

const normalizeDeliveryPolicy = (policy = {}) => ({
  ...DEFAULT_DELIVERY_POLICY,
  ...toPlainObject(policy),
});

const normalizeNotificationPreferences = (prefs = {}) => {
  const plain = toPlainObject(prefs);
  return {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...plain,
    quietHours: {
      ...DEFAULT_NOTIFICATION_PREFERENCES.quietHours,
      ...toPlainObject(plain.quietHours),
    },
    topicOverrides: toPlainObject(plain.topicOverrides),
    priorityOverrides: toPlainObject(plain.priorityOverrides),
  };
};

const computeLifecycleStatus = (deliveries = [], scheduledAt) => {
  if (!deliveries.length) return NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED;

  if (scheduledAt && new Date(scheduledAt) > new Date()) {
    return NOTIFICATION_LIFECYCLE_STATUSES.QUEUED;
  }

  const statuses = deliveries.map((item) => item.status);
  if (statuses.every((status) => status === NOTIFICATION_DELIVERY_STATUSES.CANCELLED)) {
    return NOTIFICATION_LIFECYCLE_STATUSES.CANCELLED;
  }
  if (
    statuses.every(
      (status) =>
        status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED ||
        status === NOTIFICATION_DELIVERY_STATUSES.CANCELLED
    )
  ) {
    return NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED;
  }
  const hasQueuedOrSending = statuses.some((status) =>
    status === NOTIFICATION_DELIVERY_STATUSES.QUEUED || status === NOTIFICATION_DELIVERY_STATUSES.SENDING
  );
  const hasDelivered = statuses.some((status) => status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED);
  const hasFailed = statuses.some((status) => status === NOTIFICATION_DELIVERY_STATUSES.FAILED);

  if (hasQueuedOrSending) return NOTIFICATION_LIFECYCLE_STATUSES.DISPATCHING;
  if (hasDelivered && hasFailed) return NOTIFICATION_LIFECYCLE_STATUSES.PARTIALLY_SENT;
  if (hasDelivered) return NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED;
  if (hasFailed) return NOTIFICATION_LIFECYCLE_STATUSES.PARTIALLY_SENT;
  return NOTIFICATION_LIFECYCLE_STATUSES.QUEUED;
};

const buildDeliveries = ({ channels, scheduledAt, deliveryPolicy }) => {
  const now = new Date();
  const runNow = !scheduledAt || new Date(scheduledAt) <= now;

  return channels.map((channel) => {
    if (channel === NOTIFICATION_CHANNELS.IN_APP) {
      if (deliveryPolicy.allowInApp === false) {
        return {
          channel,
          status: NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
          requestedAt: now,
          sentAt: now,
          deliveredAt: now,
          meta: { reason: 'in_app_disabled' },
        };
      }

      if (runNow) {
        return {
          channel,
          status: NOTIFICATION_DELIVERY_STATUSES.DELIVERED,
          requestedAt: now,
          sentAt: now,
          deliveredAt: now,
          attemptCount: 1,
        };
      }

      return {
        channel,
        status: NOTIFICATION_DELIVERY_STATUSES.QUEUED,
        requestedAt: now,
      };
    }

    return {
      channel,
      status: NOTIFICATION_DELIVERY_STATUSES.QUEUED,
      requestedAt: now,
    };
  });
};

const formatNotification = (notification) => ({
  id: String(notification._id),
  title: notification.title,
  body: notification.body,
  eventKey: notification.eventKey,
  topic: notification.topic,
  priority: notification.priority,
  data: toPlainObject(notification.data),
  action: normalizeAction(notification.action),
  channels: Array.isArray(notification.channels) ? notification.channels : [],
  requiresAck: Boolean(notification.requiresAck),
  ackAt: notification.ackAt || null,
  status: notification.readAt ? 'read' : 'unread',
  lifecycleStatus: notification.status || null,
  readAt: notification.readAt || null,
  archivedAt: notification.archivedAt || null,
  createdAt: notification.createdAt,
  deliveries: Array.isArray(notification.deliveries)
    ? notification.deliveries.map((delivery) => ({
        channel: delivery.channel,
        status: delivery.status,
        requestedAt: delivery.requestedAt,
        sentAt: delivery.sentAt,
        deliveredAt: delivery.deliveredAt,
        failureAt: delivery.failureAt,
        errorCode: delivery.errorCode,
        errorMessage: delivery.errorMessage,
      }))
    : [],
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
  createdBy,
  action,
  isSilent,
  requiresAck,
  deliveryPolicy,
}) => {
  const normalizedPriority = normalizePriority(priority);
  const normalizedDeliveryPolicy = normalizeDeliveryPolicy(deliveryPolicy);
  const resolvedChannels = normalizeChannels({ channels, priority: normalizedPriority });
  const deliveries = buildDeliveries({
    channels: resolvedChannels,
    scheduledAt,
    deliveryPolicy: normalizedDeliveryPolicy,
  });

  const notificationData = {
    audience,
    user: userId,
    eventKey,
    topic,
    title,
    body,
    data,
    channels: resolvedChannels,
    priority: normalizedPriority,
    status: computeLifecycleStatus(deliveries, scheduledAt),
    deliveries,
    sentAt: deliveries.some((d) => d.channel === NOTIFICATION_CHANNELS.IN_APP && d.status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED)
      ? new Date()
      : undefined,
    deliveredAt: deliveries.some((d) => d.channel === NOTIFICATION_CHANNELS.IN_APP && d.status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED)
      ? new Date()
      : undefined,
    templateKey,
    deduplicationKey,
    scheduledAt,
    expiresAt,
    recipients,
    metadata,
    createdBy,
    action: normalizeAction(action),
    isSilent: Boolean(isSilent),
    requiresAck: Boolean(requiresAck),
    deliveryPolicy: normalizedDeliveryPolicy,
  };

  if (isValidObjectId(companyId)) {
    notificationData.company = companyId;
  }

  if (isValidObjectId(actorId)) {
    notificationData.actor = actorId;
  }

  return notificationData;
};

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
  channels,
  templateKey,
  deduplicationKey,
  scheduledAt,
  expiresAt,
  recipients,
  metadata,
  createdBy,
  action,
  isSilent,
  requiresAck,
  deliveryPolicy,
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
      createdBy,
      action,
      isSilent,
      requiresAck,
      deliveryPolicy,
    });

    const notification = await Notification.create(notificationData);

    const inAppDelivery = notification.deliveries.find((item) => item.channel === NOTIFICATION_CHANNELS.IN_APP);
    if (inAppDelivery?.status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED && userId) {
      emitNotification(userId, notification);
    }

    return {
      success: true,
      notificationId: notification._id.toString(),
      notification,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
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
  channels,
  templateKey,
  deduplicationKey,
  scheduledAt,
  expiresAt,
  recipients,
  metadata,
  createdBy,
  action,
  isSilent,
  requiresAck,
  deliveryPolicy,
}) => {
  const uniqueUserIds = [...new Set((userIds || []).filter(Boolean))];
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
      createdBy,
      action,
      isSilent,
      requiresAck,
      deliveryPolicy,
    })
  );

  try {
    const notifications = await Notification.insertMany(notificationsData, { ordered: false });

    const immediate = notifications.filter((item) =>
      item.deliveries.some(
        (delivery) =>
          delivery.channel === NOTIFICATION_CHANNELS.IN_APP &&
          delivery.status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED
      )
    );

    emitNotificationsBulk(
      immediate.map((item) => String(item.user)),
      immediate
    );

    return {
      success: true,
      notificationIds: notifications.map((notification) => notification._id.toString()),
      count: notifications.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
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
  createdBy,
  action,
  isSilent,
  requiresAck,
  deliveryPolicy,
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
        createdBy,
        action,
        isSilent,
        requiresAck,
        deliveryPolicy,
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
      createdBy,
      action,
      isSilent,
      requiresAck,
      deliveryPolicy,
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
      createdBy,
      action,
      isSilent,
      requiresAck,
      deliveryPolicy,
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
      createdBy,
      action,
      isSilent,
      requiresAck,
      deliveryPolicy,
    });

    const notification = await Notification.create(notificationData);

    return {
      success: true,
      notificationId: notification._id.toString(),
      notification,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

const createDocumentRequestNotification = async ({
  userId,
  companyId,
  companyName,
  actorId,
  customMessage,
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
      actionUrl: `/company/${companyId}/verification`,
    },
    action: {
      type: NOTIFICATION_ACTION_TYPES.ROUTE,
      label: 'Submit documents',
      routeName: 'CompanyVerification',
      routeParams: { companyId },
    },
    channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH],
    createdBy: actorId,
  });
};

const buildUserFilter = ({ userId, status, topic, priority, from, to, search, archived }) => {
  const filter = { user: userId };

  if (archived === true || archived === 'true') {
    filter.archivedAt = { $ne: null };
  } else {
    filter.archivedAt = null;
  }

  if (status === 'unread') {
    filter.readAt = null;
  } else if (status === 'read') {
    filter.readAt = { $ne: null };
  }

  if (topic) filter.topic = topic;
  if (priority && PRIORITY_OPTIONS.includes(priority)) filter.priority = priority;

  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) filter.createdAt.$lte = new Date(to);
  }

  if (search) {
    const regex = new RegExp(String(search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { title: regex },
      { body: regex },
      { eventKey: regex },
      { topic: regex },
    ];
  }

  return filter;
};

const getUserNotifications = async (userId, options = {}) => {
  const limit = Math.min(Math.max(parseInt(options.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(options.offset, 10) || 0, 0);

  const filter = buildUserFilter({ userId, ...options });

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    notifications: notifications.map((notification) => formatNotification(notification)),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + notifications.length < total,
    },
  };
};

const markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { readAt: new Date() },
    { new: true }
  ).lean();

  if (!notification) {
    return { success: false, error: 'Notification not found' };
  }

  return { success: true, notification: formatNotification(notification) };
};

const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { user: userId, readAt: null, archivedAt: null },
    { readAt: new Date() }
  );

  return {
    success: true,
    modifiedCount: result.modifiedCount,
  };
};

const archiveNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { archivedAt: new Date() },
    { new: true }
  ).lean();

  if (!notification) {
    return { success: false, error: 'Notification not found' };
  }

  return { success: true, notification: formatNotification(notification) };
};

const unarchiveNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { archivedAt: null },
    { new: true }
  ).lean();

  if (!notification) {
    return { success: false, error: 'Notification not found' };
  }

  return { success: true, notification: formatNotification(notification) };
};

const acknowledgeNotification = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { ackAt: new Date() },
    { new: true }
  ).lean();

  if (!notification) {
    return { success: false, error: 'Notification not found' };
  }

  return { success: true, notification: formatNotification(notification) };
};

const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ user: userId, readAt: null, archivedAt: null });
};

const registerUserDevice = async (userId, payload) => {
  const now = new Date();

  const update = {
    user: userId,
    platform: payload.platform,
    pushProvider: payload.pushProvider || 'expo',
    pushToken: payload.pushToken,
    appVersion: payload.appVersion,
    buildNumber: payload.buildNumber,
    deviceModel: payload.deviceModel,
    osVersion: payload.osVersion,
    locale: payload.locale,
    timezone: payload.timezone,
    metadata: payload.metadata,
    isActive: true,
    lastSeenAt: now,
    lastErrorAt: undefined,
    lastErrorMessage: undefined,
  };

  const device = await UserDevice.findOneAndUpdate(
    { pushToken: payload.pushToken },
    { $set: update },
    { upsert: true, new: true }
  ).lean();

  return { success: true, device };
};

const unregisterUserDevice = async (userId, pushToken) => {
  const result = await UserDevice.findOneAndUpdate(
    { user: userId, pushToken },
    { $set: { isActive: false, lastSeenAt: new Date() } },
    { new: true }
  ).lean();

  if (!result) {
    return { success: false, error: 'Device not found' };
  }

  return { success: true, device: result };
};

const getUserNotificationPreferences = async (userId) => {
  const user = await User.findById(userId).select('preferences.notifications').lean();
  return normalizeNotificationPreferences(user?.preferences?.notifications);
};

const updateUserNotificationPreferences = async (userId, patch) => {
  const user = await User.findById(userId);
  if (!user) return null;

  const existing = normalizeNotificationPreferences(user.preferences?.notifications);
  const incoming = toPlainObject(patch);

  user.preferences = {
    ...toPlainObject(user.preferences),
    notifications: {
      ...existing,
      ...incoming,
      quietHours: {
        ...existing.quietHours,
        ...toPlainObject(incoming.quietHours),
      },
      topicOverrides: {
        ...toPlainObject(existing.topicOverrides),
        ...toPlainObject(incoming.topicOverrides),
      },
      priorityOverrides: {
        ...toPlainObject(existing.priorityOverrides),
        ...toPlainObject(incoming.priorityOverrides),
      },
    },
  };

  await user.save();

  return normalizeNotificationPreferences(user.preferences?.notifications);
};

const listAdminNotifications = async (adminId, filters = {}) => {
  const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(filters.offset, 10) || 0, 0);

  const query = { createdBy: adminId };

  if (filters.userId && isValidObjectId(filters.userId)) query.user = filters.userId;
  if (filters.topic) query.topic = filters.topic;
  if (filters.priority && PRIORITY_OPTIONS.includes(filters.priority)) query.priority = filters.priority;
  if (filters.eventKey) query.eventKey = filters.eventKey;
  if (filters.status) query.status = filters.status;

  if (filters.search) {
    const regex = new RegExp(String(filters.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ title: regex }, { body: regex }, { eventKey: regex }, { topic: regex }];
  }

  const [items, total] = await Promise.all([
    Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Notification.countDocuments(query),
  ]);

  return {
    notifications: items.map((item) => formatNotification(item)),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    },
  };
};

const getAdminNotificationById = async (notificationId, adminId) => {
  const notification = await Notification.findOne({ _id: notificationId, createdBy: adminId }).lean();
  if (!notification) return null;
  return formatNotification(notification);
};

const cancelAdminNotification = async (notificationId, adminId) => {
  const notification = await Notification.findOne({ _id: notificationId, createdBy: adminId });
  if (!notification) return null;

  notification.status = NOTIFICATION_LIFECYCLE_STATUSES.CANCELLED;
  notification.deliveries = notification.deliveries.map((delivery) => ({
    ...delivery.toObject(),
    status: delivery.status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED
      ? delivery.status
      : NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
    failureAt: delivery.status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED ? delivery.failureAt : new Date(),
    errorCode: delivery.status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED ? delivery.errorCode : 'cancelled_by_admin',
    errorMessage: delivery.status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED ? delivery.errorMessage : 'Cancelled by admin',
  }));

  await notification.save();
  return formatNotification(notification.toObject());
};

const resendAdminNotification = async (notificationId, adminId) => {
  const original = await Notification.findOne({ _id: notificationId, createdBy: adminId }).lean();
  if (!original) return null;

  const result = await dispatchNotification({
    audience: original.audience,
    userId: original.user ? String(original.user) : undefined,
    userIds: original.user ? [String(original.user)] : undefined,
    companyId: original.company ? String(original.company) : undefined,
    title: original.title,
    body: original.body,
    eventKey: original.eventKey,
    topic: original.topic,
    priority: original.priority,
    actorId: adminId,
    data: toPlainObject(original.data),
    channels: Array.isArray(original.channels) ? original.channels : undefined,
    templateKey: original.templateKey,
    deduplicationKey: undefined,
    scheduledAt: undefined,
    expiresAt: original.expiresAt,
    recipients: original.recipients,
    metadata: toPlainObject(original.metadata),
    createdBy: adminId,
    action: normalizeAction(original.action),
    isSilent: original.isSilent,
    requiresAck: original.requiresAck,
    deliveryPolicy: toPlainObject(original.deliveryPolicy),
  });

  if (!result.success) {
    return { success: false, error: result.error };
  }

  return { success: true, notification: formatNotification(result.notification) };
};

module.exports = {
  createNotification,
  createNotificationsForUsers,
  dispatchNotification,
  createDocumentRequestNotification,
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
  formatNotification,
};
