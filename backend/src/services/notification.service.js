const crypto = require('crypto');
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
  NOTIFICATION_ACTION_TYPES,
  DEFAULT_DELIVERY_POLICY,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_DELIVERY_ERROR_CODES,
} = require('../constants/notification');
const { toPlainObject } = require('../utils/plainObject');
const { computeLifecycleStatus } = require('../modules/notifications/services/notificationLifecycle.service');
const { resolveAudienceUserIds } = require('../modules/notifications/services/notificationAudience.service');
const { resolveChannelDecision } = require('../modules/notifications/services/notificationDeliveryPolicy.service');
const { emitToUser, emitToUsers } = require('../socket');

const CHANNEL_OPTIONS = Object.values(NOTIFICATION_CHANNELS);
const PRIORITY_OPTIONS = Object.values(NOTIFICATION_PRIORITIES);
const AUDIENCE_OPTIONS = Object.values(NOTIFICATION_AUDIENCE);

// insertMany chunk size — keeps a single write (and the in-memory doc array)
// bounded regardless of how large a broadcast's resolved audience is.
const INSERT_CHUNK_SIZE = 500;

const isValidObjectId = (id) => {
  if (!id) return false;
  try {
    return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  } catch {
    return false;
  }
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
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

// Every channel starts queued. In-app delivery for notifications that are due
// immediately is resolved synchronously by `applyImmediateDelivery` right
// after this (still respecting user preferences — see B3); anything else
// (push, email, or a future-dated in-app row) is picked up by the periodic
// dispatcher (notificationDispatcher.service.js), which already runs the same
// policy check.
const buildDeliveries = ({ channels }) => {
  const now = new Date();
  return channels.map((channel) => ({
    channel,
    status: NOTIFICATION_DELIVERY_STATUSES.QUEUED,
    requestedAt: now,
  }));
};

const formatNotification = (notification) => ({
  id: String(notification._id),
  batchId: notification.batchId || String(notification._id),
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
  batchId,
  audienceSnapshot,
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
  const deliveries = buildDeliveries({ channels: resolvedChannels });

  const notificationData = {
    audience,
    user: userId,
    batchId,
    audienceSnapshot,
    eventKey,
    topic,
    title,
    body,
    data,
    channels: resolvedChannels,
    priority: normalizedPriority,
    status: computeLifecycleStatus(deliveries, { scheduledAt }),
    deliveries,
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

// Resolves the in-app delivery for every notification that's due right now
// (not scheduled for the future), consulting the same preference/policy
// engine the periodic dispatcher uses for push/email. Previously in-app was
// unconditionally marked `delivered` at build time — this is what actually
// makes the "In-app" toggle on both preference screens do something (B3).
const applyImmediateDelivery = (notificationsData, usersById) => {
  const now = new Date();

  return notificationsData.map((data) => {
    const dueNow = !data.scheduledAt || new Date(data.scheduledAt) <= now;
    const inAppIndex = data.deliveries.findIndex((item) => item.channel === NOTIFICATION_CHANNELS.IN_APP);

    if (!dueNow || inAppIndex === -1 || !data.user) {
      return data;
    }

    const user = usersById.get(String(data.user));
    const allowed = user ? resolveChannelDecision({ user, notification: data, channel: NOTIFICATION_CHANNELS.IN_APP }) : false;

    const deliveries = [...data.deliveries];
    deliveries[inAppIndex] = allowed
      ? {
          ...deliveries[inAppIndex],
          status: NOTIFICATION_DELIVERY_STATUSES.DELIVERED,
          sentAt: now,
          deliveredAt: now,
          attemptCount: 1,
        }
      : {
          ...deliveries[inAppIndex],
          status: NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
          failureAt: now,
          errorCode: NOTIFICATION_DELIVERY_ERROR_CODES.IN_APP_DISABLED,
          errorMessage: 'In-app delivery disabled by preferences or policy.',
        };

    return {
      ...data,
      deliveries,
      status: computeLifecycleStatus(deliveries, { scheduledAt: data.scheduledAt }),
      sentAt: allowed ? now : data.sentAt,
      deliveredAt: allowed ? now : data.deliveredAt,
    };
  });
};

/**
 * Single entry point for creating notifications, for every audience type.
 *
 * Resolves `audience` (user / company / broadcast) into a concrete recipient
 * list via notificationAudience.service, fans out one Notification doc per
 * recipient (so per-user read/archive/ack state and the existing dispatcher
 * keep working unmodified), and tags every doc in the fan-out with a shared
 * `batchId` so the admin history can show one row per dispatch instead of one
 * per recipient.
 *
 * Replaces the old three-way split (createNotification /
 * createNotificationsForUsers / dispatchNotification) that duplicated this
 * parameter list four times and had no way to resolve `company`/`broadcast`
 * audiences at all (B1, B2, B6).
 */
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
  const normalizedAudience = AUDIENCE_OPTIONS.includes(audience) ? audience : NOTIFICATION_AUDIENCE.USER;

  const { userIds: resolvedUserIds, audienceSnapshot } = await resolveAudienceUserIds({
    audience: normalizedAudience,
    userId,
    userIds,
    companyId,
  });

  if (!resolvedUserIds.length) {
    return { success: false, error: 'No recipients matched the requested audience.' };
  }

  const batchId = crypto.randomUUID();
  const suffixDedupKey = resolvedUserIds.length > 1;

  const notificationsData = resolvedUserIds.map((id) =>
    buildNotificationData({
      audience: normalizedAudience,
      userId: id,
      batchId,
      audienceSnapshot,
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
      deduplicationKey: deduplicationKey && suffixDedupKey ? `${deduplicationKey}:${id}` : deduplicationKey,
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

  const needsUserLookup = notificationsData.some((item) =>
    item.deliveries.some((delivery) => delivery.channel === NOTIFICATION_CHANNELS.IN_APP)
  );
  const usersById = new Map();
  if (needsUserLookup) {
    const users = await User.find({ _id: { $in: resolvedUserIds } }).select('preferences').lean();
    users.forEach((user) => usersById.set(String(user._id), user));
  }

  const preparedData = applyImmediateDelivery(notificationsData, usersById);

  const insertedDocs = [];
  const errors = [];
  for (const chunk of chunkArray(preparedData, INSERT_CHUNK_SIZE)) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const inserted = await Notification.insertMany(chunk, { ordered: false });
      insertedDocs.push(...inserted);
    } catch (error) {
      // With ordered:false, Mongoose still inserts every document that
      // didn't collide (e.g. on the sparse-unique deduplicationKey index) and
      // attaches the successful ones to `error.insertedDocs` — previously
      // this branch just returned `success: false` and discarded them (B9).
      const partial = Array.isArray(error?.insertedDocs) ? error.insertedDocs : [];
      insertedDocs.push(...partial);
      errors.push(error.message);
    }
  }

  if (!insertedDocs.length) {
    return { success: false, error: errors[0] || 'Failed to dispatch notification' };
  }

  const delivered = insertedDocs.filter((doc) =>
    doc.deliveries.some(
      (delivery) =>
        delivery.channel === NOTIFICATION_CHANNELS.IN_APP &&
        delivery.status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED
    )
  );
  emitNotificationsBulk(
    delivered.map((item) => String(item.user)),
    delivered
  );

  return {
    success: true,
    batchId,
    notificationId: insertedDocs.length === 1 ? String(insertedDocs[0]._id) : undefined,
    notification: insertedDocs.length === 1 ? insertedDocs[0] : undefined,
    notificationIds: insertedDocs.map((item) => String(item._id)),
    count: insertedDocs.length,
    skipped: resolvedUserIds.length - insertedDocs.length,
    audience: normalizedAudience,
    audienceSnapshot,
  };
};

// Thin wrappers kept for the existing call sites (quotes, feedback,
// businessSetup, admin document requests) — all fan-out now goes through
// dispatchNotification, so these no longer duplicate the parameter list.
const createNotification = async ({ userId, ...rest }) =>
  dispatchNotification({ audience: NOTIFICATION_AUDIENCE.USER, userId, ...rest });

const createNotificationsForUsers = async ({ userIds, ...rest }) =>
  dispatchNotification({ audience: NOTIFICATION_AUDIENCE.USER, userIds, ...rest });

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

// A notification whose in-app delivery was cancelled (most commonly: the
// recipient turned off the "In-app" preference toggle — see B3/
// applyImmediateDelivery above) was never actually shown to that user, so it
// must not appear in their notification center or count toward their unread
// badge. Without this, disabling "in-app" only changed a delivery-record
// field nobody looked at — the notification still showed up regardless,
// which is exactly the "toggle does nothing" bug this whole pass fixes.
const excludeHiddenInAppFilter = {
  deliveries: {
    $not: {
      $elemMatch: {
        channel: NOTIFICATION_CHANNELS.IN_APP,
        status: NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
      },
    },
  },
};

const buildUserFilter = ({ userId, status, topic, priority, from, to, search, archived }) => {
  const filter = { user: userId, ...excludeHiddenInAppFilter };

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
  return Notification.countDocuments({
    user: userId,
    readAt: null,
    archivedAt: null,
    ...excludeHiddenInAppFilter,
  });
};

const registerUserDevice = async (userId, payload) => {
  const now = new Date();

  // Fields that should be cleared (not just left unset) on every successful
  // re-registration go through $unset — an earlier version put them in the
  // same $set as `undefined`, which Mongo silently drops, so a device that
  // failed once stayed flagged with a stale lastErrorAt/lastErrorMessage
  // forever even after registering successfully again (B8).
  const setFields = {
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
  };

  const device = await UserDevice.findOneAndUpdate(
    { pushToken: payload.pushToken },
    { $set: setFields, $unset: { lastErrorAt: '', lastErrorMessage: '' } },
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

// ── Admin batch surface ─────────────────────────────────────────────────
//
// One dispatch call fans out to N per-recipient Notification docs sharing a
// `batchId`. Everything below aggregates that fan-out back into one logical
// row per dispatch for the admin studios, instead of the raw N-row list the
// old implementation returned (B6). Rows written before this migration have
// no `batchId`, so every match falls back to the doc's own `_id` as its
// group key — a legacy row simply becomes a batch of one.

const batchGroupKeyExpr = { $ifNull: ['$batchId', { $toString: '$_id' }] };

const buildBatchMatch = (filters = {}) => {
  const match = {};

  if (filters.mine === true || filters.mine === 'true') {
    if (isValidObjectId(filters.adminId)) match.createdBy = new mongoose.Types.ObjectId(filters.adminId);
  }
  if (filters.userId && isValidObjectId(filters.userId)) match.user = new mongoose.Types.ObjectId(filters.userId);
  if (filters.topic) match.topic = filters.topic;
  if (filters.priority && PRIORITY_OPTIONS.includes(filters.priority)) match.priority = filters.priority;
  if (filters.eventKey) match.eventKey = filters.eventKey;
  if (filters.audience && AUDIENCE_OPTIONS.includes(filters.audience)) match.audience = filters.audience;
  if (filters.status) match.status = filters.status;

  if (filters.from || filters.to) {
    match.createdAt = {};
    if (filters.from) match.createdAt.$gte = new Date(filters.from);
    if (filters.to) match.createdAt.$lte = new Date(filters.to);
  }

  if (filters.search) {
    const regex = new RegExp(String(filters.search).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    match.$or = [{ title: regex }, { body: regex }, { eventKey: regex }, { topic: regex }];
  }

  return match;
};

const batchFilterFor = (batchId) => (isValidObjectId(batchId) ? { $or: [{ batchId }, { _id: batchId }] } : { batchId });

// Per-channel delivery status counts for each batch, computed via a separate
// $unwind pipeline so we never have to pull every recipient's full deliveries
// array into Node for large broadcasts.
const fetchDeliveryRollups = async (match, groupKeys) => {
  if (!groupKeys.length) return new Map();

  const rows = await Notification.aggregate([
    { $match: match },
    { $addFields: { groupKey: batchGroupKeyExpr } },
    { $match: { groupKey: { $in: groupKeys } } },
    { $unwind: '$deliveries' },
    {
      $group: {
        _id: { groupKey: '$groupKey', channel: '$deliveries.channel', status: '$deliveries.status' },
        count: { $sum: 1 },
      },
    },
  ]);

  const rollups = new Map();
  rows.forEach((row) => {
    const { groupKey, channel, status } = row._id;
    if (!rollups.has(groupKey)) rollups.set(groupKey, {});
    const byChannel = rollups.get(groupKey);
    if (!byChannel[channel]) byChannel[channel] = {};
    byChannel[channel][status] = row.count;
  });
  return rollups;
};

const formatBatchSummary = (row, { creator, deliveryRollup } = {}) => ({
  batchId: row.batchId,
  title: row.title,
  body: row.body,
  eventKey: row.eventKey,
  topic: row.topic,
  priority: row.priority,
  audience: row.audience,
  channels: Array.isArray(row.channels) ? row.channels : [],
  createdAt: row.createdAt,
  scheduledAt: row.scheduledAt || null,
  createdBy: row.createdBy ? String(row.createdBy) : null,
  createdByName: creator?.displayName || creator?.email || null,
  recipientCount: row.recipientCount,
  readCount: row.readCount,
  cancelledCount: row.cancelledCount,
  completedCount: row.completedCount,
  deliveryRollup: deliveryRollup || {},
});

const runBatchAggregation = async (match, { limit, offset } = {}) => {
  const groupStage = {
    $group: {
      _id: '$groupKey',
      batchId: { $first: '$groupKey' },
      title: { $first: '$title' },
      body: { $first: '$body' },
      eventKey: { $first: '$eventKey' },
      topic: { $first: '$topic' },
      priority: { $first: '$priority' },
      audience: { $first: '$audience' },
      channels: { $first: '$channels' },
      createdAt: { $max: '$createdAt' },
      scheduledAt: { $first: '$scheduledAt' },
      createdBy: { $first: '$createdBy' },
      recipientCount: { $sum: 1 },
      readCount: { $sum: { $cond: [{ $ne: ['$readAt', null] }, 1, 0] } },
      cancelledCount: {
        $sum: { $cond: [{ $eq: ['$status', NOTIFICATION_LIFECYCLE_STATUSES.CANCELLED] }, 1, 0] },
      },
      completedCount: {
        $sum: { $cond: [{ $eq: ['$status', NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED] }, 1, 0] },
      },
    },
  };

  const basePipeline = [{ $match: match }, { $addFields: { groupKey: batchGroupKeyExpr } }, groupStage];

  const [items, totalRows] = await Promise.all([
    Notification.aggregate([
      ...basePipeline,
      { $sort: { createdAt: -1 } },
      { $skip: offset },
      { $limit: limit },
    ]),
    Notification.aggregate([...basePipeline, { $count: 'total' }]),
  ]);

  return { items, total: totalRows[0]?.total || 0 };
};

const attachRollupsAndCreators = async (items, match) => {
  if (!items.length) return items;

  const groupKeys = items.map((item) => item.batchId);
  const creatorIds = [...new Set(items.map((item) => item.createdBy).filter(Boolean).map(String))];

  const [rollups, creators] = await Promise.all([
    fetchDeliveryRollups(match, groupKeys),
    creatorIds.length ? User.find({ _id: { $in: creatorIds } }).select('displayName email').lean() : [],
  ]);

  const creatorById = new Map(creators.map((creator) => [String(creator._id), creator]));

  return items.map((item) =>
    formatBatchSummary(item, {
      creator: item.createdBy ? creatorById.get(String(item.createdBy)) : null,
      deliveryRollup: rollups.get(item.batchId) || {},
    })
  );
};

const listAdminNotifications = async (adminId, filters = {}) => {
  const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 20, 1), 100);
  const offset = Math.max(parseInt(filters.offset, 10) || 0, 0);

  const match = buildBatchMatch({ ...filters, adminId });
  const { items, total } = await runBatchAggregation(match, { limit, offset });
  const notifications = await attachRollupsAndCreators(items, match);

  return {
    notifications,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    },
  };
};

const getAdminBatch = async (batchId, { limit = 50, offset = 0 } = {}) => {
  const filter = batchFilterFor(batchId);
  const { items } = await runBatchAggregation(
    { ...filter },
    { limit: 1, offset: 0 }
  );
  if (!items.length) return null;

  const [batch] = await attachRollupsAndCreators(items, filter);

  const boundedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
  const boundedOffset = Math.max(parseInt(offset, 10) || 0, 0);

  const [recipients, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(boundedOffset)
      .limit(boundedLimit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return {
    batch,
    recipients: recipients.map((item) => formatNotification(item)),
    pagination: {
      total,
      limit: boundedLimit,
      offset: boundedOffset,
      hasMore: boundedOffset + recipients.length < total,
    },
  };
};

// Any admin can act on any admin-dispatched batch — the routes already
// restrict these endpoints to authorizeRoles('admin'), so scoping reads to
// `createdBy: adminId` (as the old getAdminNotificationById did) was a false
// floor that let one admin cancel/resend a batch it couldn't even list (B5).
// `mine` on listAdminNotifications is the opt-in filter for "just my sends".
const cancelAdminBatch = async (batchId) => {
  const filter = batchFilterFor(batchId);
  const existing = await Notification.countDocuments(filter);
  if (!existing) return null;

  const now = new Date();
  await Notification.updateMany(
    filter,
    {
      $set: { status: NOTIFICATION_LIFECYCLE_STATUSES.CANCELLED },
    }
  );
  await Notification.updateMany(
    filter,
    {
      $set: {
        'deliveries.$[undelivered].status': NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
        'deliveries.$[undelivered].failureAt': now,
        'deliveries.$[undelivered].errorCode': NOTIFICATION_DELIVERY_ERROR_CODES.CANCELLED_BY_ADMIN,
        'deliveries.$[undelivered].errorMessage': 'Cancelled by admin',
      },
    },
    { arrayFilters: [{ 'undelivered.status': { $ne: NOTIFICATION_DELIVERY_STATUSES.DELIVERED } }] }
  );

  return getAdminBatch(batchId, { limit: 1, offset: 0 });
};

const resendAdminBatch = async (batchId, adminId) => {
  const filter = batchFilterFor(batchId);
  const originals = await Notification.find(filter).lean();
  if (!originals.length) return null;

  const sample = originals[0];
  // Resend targets the exact original recipient list rather than
  // re-resolving a broadcast/company audience, so a resend can't silently
  // pick up people who joined after the original dispatch.
  const userIds = [...new Set(originals.map((item) => item.user).filter(Boolean).map(String))];

  return dispatchNotification({
    audience: NOTIFICATION_AUDIENCE.USER,
    userIds,
    title: sample.title,
    body: sample.body,
    eventKey: sample.eventKey,
    topic: sample.topic,
    priority: sample.priority,
    actorId: adminId,
    data: toPlainObject(sample.data),
    channels: Array.isArray(sample.channels) ? sample.channels : undefined,
    templateKey: sample.templateKey,
    expiresAt: sample.expiresAt,
    recipients: sample.recipients,
    metadata: toPlainObject(sample.metadata),
    createdBy: adminId,
    action: normalizeAction(sample.action),
    isSilent: sample.isSilent,
    requiresAck: sample.requiresAck,
    deliveryPolicy: toPlainObject(sample.deliveryPolicy),
  });
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
  getAdminBatch,
  cancelAdminBatch,
  resendAdminBatch,
  formatNotification,
};
