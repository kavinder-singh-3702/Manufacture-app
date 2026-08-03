const Notification = require('../../../models/notification.model');
const User = require('../../../models/user.model');
const UserDevice = require('../../../models/userDevice.model');
const config = require('../../../config/env');
const { emitToUser } = require('../../../socket');
const { formatNotification } = require('../../../services/notification.service');
const {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_LIFECYCLE_STATUSES,
  NOTIFICATION_DELIVERY_ERROR_CODES
} = require('../../../constants/notification');
const { toPlainObject } = require('../../../utils/plainObject');
const { computeLifecycleStatus } = require('./notificationLifecycle.service');
const { sendEmail } = require('../../../services/email.service');
const { sendPushMessages, isExpoToken } = require('./push.providers/expo.provider');
const { resolveChannelDecision } = require('./notificationDeliveryPolicy.service');

let intervalHandle = null;
let running = false;

const retryBaseDelay = Math.max(Number(config.notificationRetryBaseMs) || 30 * 1000, 1000);
const backoffDelays = [
  retryBaseDelay,
  retryBaseDelay * 4,
  retryBaseDelay * 20,
  retryBaseDelay * 60
];

const nowDate = () => new Date();

// toPlainData/computeLifecycle used to be defined here, near-identically to
// the copies in notification.service.js — now both import the single shared
// implementations (B4).
const toPlainData = toPlainObject;
const computeLifecycle = (deliveries = []) => computeLifecycleStatus(deliveries);

const shouldUseRetryWindow = (channel) =>
  channel === NOTIFICATION_CHANNELS.PUSH || channel === NOTIFICATION_CHANNELS.EMAIL;

const normalizeEmail = (value) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return null;
  return normalized;
};

const setDeliveryState = ({ notification, channel, status, errorCode, errorMessage, providerMessageId, nextRetryAt }) => {
  const delivery = notification.deliveries.find((item) => item.channel === channel);
  if (!delivery) return;

  delivery.status = status;
  if (!delivery.attemptCount) delivery.attemptCount = 0;

  if (status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED) {
    delivery.deliveredAt = nowDate();
    delivery.sentAt = delivery.sentAt || nowDate();
    delivery.failureAt = undefined;
    delivery.errorCode = undefined;
    delivery.errorMessage = undefined;
    delivery.nextRetryAt = undefined;
    if (providerMessageId) delivery.providerMessageId = providerMessageId;
  } else if (status === NOTIFICATION_DELIVERY_STATUSES.FAILED) {
    delivery.failureAt = nowDate();
    delivery.errorCode = errorCode;
    delivery.errorMessage = errorMessage;
    delivery.nextRetryAt = undefined;
  } else if (status === NOTIFICATION_DELIVERY_STATUSES.QUEUED) {
    delivery.nextRetryAt = nextRetryAt;
    delivery.errorCode = errorCode;
    delivery.errorMessage = errorMessage;
  } else if (status === NOTIFICATION_DELIVERY_STATUSES.CANCELLED) {
    delivery.failureAt = nowDate();
    delivery.nextRetryAt = undefined;
    delivery.errorCode = errorCode;
    delivery.errorMessage = errorMessage;
  }
};

const scheduleRetry = ({ notification, channel, errorCode, errorMessage }) => {
  const delivery = notification.deliveries.find((item) => item.channel === channel);
  if (!delivery) return;

  const maxRetries = notification.deliveryPolicy?.maxRetries ?? 4;
  const attemptCount = Number(delivery.attemptCount || 1);

  if (attemptCount >= maxRetries) {
    setDeliveryState({
      notification,
      channel,
      status: NOTIFICATION_DELIVERY_STATUSES.FAILED,
      errorCode,
      errorMessage,
    });
    return;
  }

  const index = Math.max(0, Math.min(attemptCount - 1, backoffDelays.length - 1));
  const delay = Math.min(backoffDelays[index], config.notificationRetryMaxMs || backoffDelays[index]);
  setDeliveryState({
    notification,
    channel,
    status: NOTIFICATION_DELIVERY_STATUSES.QUEUED,
    errorCode,
    errorMessage,
    nextRetryAt: new Date(Date.now() + delay)
  });
};

const processPushNotification = async (notification) => {
  const delivery = notification.deliveries.find((item) => item.channel === NOTIFICATION_CHANNELS.PUSH);
  if (!delivery) return;

  const user = await User.findById(notification.user)
    .select('preferences')
    .lean();

  if (!user || !resolveChannelDecision({ user, notification, channel: NOTIFICATION_CHANNELS.PUSH })) {
    setDeliveryState({
      notification,
      channel: NOTIFICATION_CHANNELS.PUSH,
      status: NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
      errorCode: NOTIFICATION_DELIVERY_ERROR_CODES.PUSH_DISABLED,
      errorMessage: 'Push delivery disabled by preferences or policy.'
    });
    notification.status = computeLifecycle(notification.deliveries);
    await notification.save();
    return;
  }

  const devices = await UserDevice.find({
    user: notification.user,
    isActive: true,
    pushProvider: 'expo'
  }).lean();

  const tokens = devices
    .map((device) => device.pushToken)
    .filter((token) => isExpoToken(token));

  if (!tokens.length) {
    scheduleRetry({
      notification,
      channel: NOTIFICATION_CHANNELS.PUSH,
      errorCode: NOTIFICATION_DELIVERY_ERROR_CODES.MISSING_DEVICE_TOKEN,
      errorMessage: 'No active push token found for user.'
    });
    notification.status = computeLifecycle(notification.deliveries);
    await notification.save();
    return;
  }

  const payloadData = {
    notificationId: String(notification._id),
    eventKey: notification.eventKey,
    topic: notification.topic,
    priority: notification.priority,
    action: toPlainData(notification.action),
    data: toPlainData(notification.data)
  };

  const messages = tokens.map((token) => ({
    to: token,
    title: notification.title,
    body: notification.body,
    data: payloadData,
    sound: notification.isSilent ? undefined : 'default',
    priority: notification.priority === 'critical' || notification.priority === 'high' ? 'high' : 'default',
    channelId: notification.priority === 'critical' ? 'critical-alerts' : 'default',
  }));

  try {
    const result = await sendPushMessages(messages);
    const successTicket = result.results.find((item) => item.status === 'ok');

    // `.forEach(async …)` doesn't wait for its callbacks — the loop returned
    // immediately while these updates were still in flight, racing against
    // `notification.save()` below and, worse, against the *next* dispatch
    // cycle's read of UserDevice for the same user (B8). Await them all.
    const deadTokenUpdates = result.results
      .filter((item) => item.status === 'error' && item.details?.error === 'DeviceNotRegistered')
      .map((item) =>
        UserDevice.updateOne(
          { pushToken: item.token },
          {
            $set: {
              isActive: false,
              lastErrorAt: nowDate(),
              lastErrorMessage: item.message || 'DeviceNotRegistered'
            }
          }
        )
      );
    if (deadTokenUpdates.length) await Promise.all(deadTokenUpdates);

    if (result.successCount > 0) {
      setDeliveryState({
        notification,
        channel: NOTIFICATION_CHANNELS.PUSH,
        status: NOTIFICATION_DELIVERY_STATUSES.DELIVERED,
        providerMessageId: successTicket?.id
      });
      notification.sentAt = notification.sentAt || nowDate();
      notification.deliveredAt = nowDate();
    } else {
      scheduleRetry({
        notification,
        channel: NOTIFICATION_CHANNELS.PUSH,
        errorCode: NOTIFICATION_DELIVERY_ERROR_CODES.PUSH_SEND_FAILED,
        errorMessage: result.results[0]?.message || 'Push provider failed to deliver.'
      });
    }
  } catch (error) {
    scheduleRetry({
      notification,
      channel: NOTIFICATION_CHANNELS.PUSH,
      errorCode: NOTIFICATION_DELIVERY_ERROR_CODES.PUSH_EXCEPTION,
      errorMessage: error?.message || 'Unhandled push dispatch error'
    });
  }

  notification.status = computeLifecycle(notification.deliveries);
  await notification.save();
};

const processInAppNotification = async (notification) => {
  const delivery = notification.deliveries.find((item) => item.channel === NOTIFICATION_CHANNELS.IN_APP);
  if (!delivery) return;

  const user = await User.findById(notification.user)
    .select('preferences')
    .lean();

  if (!user || !resolveChannelDecision({ user, notification, channel: NOTIFICATION_CHANNELS.IN_APP })) {
    setDeliveryState({
      notification,
      channel: NOTIFICATION_CHANNELS.IN_APP,
      status: NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
      errorCode: NOTIFICATION_DELIVERY_ERROR_CODES.IN_APP_DISABLED,
      errorMessage: 'In-app delivery disabled by preferences or policy.',
    });
    notification.status = computeLifecycle(notification.deliveries);
    await notification.save();
    return;
  }

  setDeliveryState({
    notification,
    channel: NOTIFICATION_CHANNELS.IN_APP,
    status: NOTIFICATION_DELIVERY_STATUSES.DELIVERED,
  });
  notification.sentAt = notification.sentAt || nowDate();
  notification.deliveredAt = nowDate();
  notification.status = computeLifecycle(notification.deliveries);
  await notification.save();

  if (notification.user) {
    emitToUser(String(notification.user), 'notification:new', formatNotification(notification));
  }
};

const resolveEmailRecipient = ({ notification, user }) => {
  const primaryFromUser = normalizeEmail(user?.email);
  if (primaryFromUser) return primaryFromUser;

  const recipients = Array.isArray(notification.recipients) ? notification.recipients : [];
  for (const recipient of recipients) {
    const candidate = normalizeEmail(recipient?.email);
    if (candidate) return candidate;
  }

  const metadata = toPlainData(notification.metadata);
  return normalizeEmail(metadata.email);
};

const processEmailNotification = async (notification) => {
  const delivery = notification.deliveries.find((item) => item.channel === NOTIFICATION_CHANNELS.EMAIL);
  if (!delivery) return;

  const hasUser = Boolean(notification.user);
  const user = hasUser
    ? await User.findById(notification.user)
        .select('email preferences')
        .lean()
    : null;

  if (hasUser && !user) {
    setDeliveryState({
      notification,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      status: NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
      errorCode: NOTIFICATION_DELIVERY_ERROR_CODES.RECIPIENT_USER_NOT_FOUND,
      errorMessage: 'Email delivery cancelled because target user no longer exists.'
    });
    notification.status = computeLifecycle(notification.deliveries);
    await notification.save();
    return;
  }

  if (user && !resolveChannelDecision({ user, notification, channel: NOTIFICATION_CHANNELS.EMAIL })) {
    setDeliveryState({
      notification,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      status: NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
      errorCode: NOTIFICATION_DELIVERY_ERROR_CODES.EMAIL_DISABLED,
      errorMessage: 'Email delivery disabled by preferences or policy.'
    });
    notification.status = computeLifecycle(notification.deliveries);
    await notification.save();
    return;
  }

  const recipientEmail = resolveEmailRecipient({ notification, user });
  if (!recipientEmail) {
    setDeliveryState({
      notification,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      status: NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
      errorCode: NOTIFICATION_DELIVERY_ERROR_CODES.MISSING_EMAIL_RECIPIENT,
      errorMessage: 'Email delivery cancelled because no recipient email is available.'
    });
    notification.status = computeLifecycle(notification.deliveries);
    await notification.save();
    return;
  }

  const result = await sendEmail({
    to: recipientEmail,
    subject: notification.title,
    text: notification.body
  });

  if (result.success) {
    setDeliveryState({
      notification,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      status: NOTIFICATION_DELIVERY_STATUSES.DELIVERED,
      providerMessageId: result.providerMessageId || undefined
    });
    notification.sentAt = notification.sentAt || nowDate();
    notification.deliveredAt = nowDate();
  } else {
    scheduleRetry({
      notification,
      channel: NOTIFICATION_CHANNELS.EMAIL,
      errorCode: result.errorCode || NOTIFICATION_DELIVERY_ERROR_CODES.EMAIL_SEND_FAILED,
      errorMessage: result.errorMessage || 'Email provider failed to deliver.'
    });
  }

  notification.status = computeLifecycle(notification.deliveries);
  await notification.save();
};

const fetchCandidatesByChannel = async (channel) => {
  const now = nowDate();
  const deliveryFilter = {
    channel,
    status: { $in: [NOTIFICATION_DELIVERY_STATUSES.QUEUED, NOTIFICATION_DELIVERY_STATUSES.SENDING] },
  };

  if (shouldUseRetryWindow(channel)) {
    deliveryFilter.$or = [
      { nextRetryAt: { $exists: false } },
      { nextRetryAt: null },
      { nextRetryAt: { $lte: now } },
    ];
  }

  return Notification.find({
    status: { $in: [NOTIFICATION_LIFECYCLE_STATUSES.QUEUED, NOTIFICATION_LIFECYCLE_STATUSES.DISPATCHING, NOTIFICATION_LIFECYCLE_STATUSES.PARTIALLY_SENT] },
    archivedAt: null,
    channels: channel,
    $or: [{ scheduledAt: { $exists: false } }, { scheduledAt: null }, { scheduledAt: { $lte: now } }],
    deliveries: {
      $elemMatch: deliveryFilter
    }
  })
    .sort({ createdAt: 1 })
    .limit(config.notificationsDispatchBatchSize || 30);
};

const claimNotificationByChannel = async (notificationId, channel) => {
  const now = nowDate();
  const deliveryMatch = {
    channel,
    status: { $in: [NOTIFICATION_DELIVERY_STATUSES.QUEUED, NOTIFICATION_DELIVERY_STATUSES.SENDING] },
  };
  if (shouldUseRetryWindow(channel)) {
    deliveryMatch.$or = [
      { nextRetryAt: { $exists: false } },
      { nextRetryAt: null },
      { nextRetryAt: { $lte: now } },
    ];
  }

  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      deliveries: {
        $elemMatch: deliveryMatch
      }
    },
    {
      $set: {
        status: NOTIFICATION_LIFECYCLE_STATUSES.DISPATCHING,
        'deliveries.$[d].status': NOTIFICATION_DELIVERY_STATUSES.SENDING,
        'deliveries.$[d].sentAt': now
      },
      $inc: {
        'deliveries.$[d].attemptCount': 1
      }
    },
    {
      arrayFilters: [{ 'd.channel': channel }],
      new: true
    }
  );
};

const processChannel = async (channel) => {
  const candidates = await fetchCandidatesByChannel(channel);
  for (const candidate of candidates) {
    const claimed = await claimNotificationByChannel(candidate._id, channel);
    if (!claimed) continue;

    if (channel === NOTIFICATION_CHANNELS.PUSH) {
      await processPushNotification(claimed);
      continue;
    }

    if (channel === NOTIFICATION_CHANNELS.IN_APP) {
      await processInAppNotification(claimed);
      continue;
    }

    if (channel === NOTIFICATION_CHANNELS.EMAIL) {
      await processEmailNotification(claimed);
    }
  }
};

const cancelQueuedChannel = async (channel, reasonCode, reasonMessage) => {
  const candidates = await fetchCandidatesByChannel(channel);
  for (const candidate of candidates) {
    const claimed = await claimNotificationByChannel(candidate._id, channel);
    if (!claimed) continue;

    setDeliveryState({
      notification: claimed,
      channel,
      status: NOTIFICATION_DELIVERY_STATUSES.CANCELLED,
      errorCode: reasonCode,
      errorMessage: reasonMessage,
    });
    claimed.status = computeLifecycle(claimed.deliveries);
    await claimed.save();
  }
};

const runDispatchCycle = async () => {
  if (running || !config.notificationsDispatcherEnabled) return;

  running = true;
  try {
    if (config.notificationsPushEnabled) {
      await processChannel(NOTIFICATION_CHANNELS.PUSH);
    } else {
      await cancelQueuedChannel(
        NOTIFICATION_CHANNELS.PUSH,
        NOTIFICATION_DELIVERY_ERROR_CODES.PUSH_GLOBALLY_DISABLED,
        'Push dispatch disabled by server configuration.'
      );
    }

    if (config.notificationsEmailEnabled) {
      await processChannel(NOTIFICATION_CHANNELS.EMAIL);
    } else {
      await cancelQueuedChannel(
        NOTIFICATION_CHANNELS.EMAIL,
        NOTIFICATION_DELIVERY_ERROR_CODES.EMAIL_GLOBALLY_DISABLED,
        'Email dispatch disabled by server configuration.'
      );
    }

    await processChannel(NOTIFICATION_CHANNELS.IN_APP);
  } catch (error) {
    console.error('[NotificationDispatcher] cycle failed:', error?.message || error);
  } finally {
    running = false;
  }
};

const startNotificationDispatcher = () => {
  if (intervalHandle || !config.notificationsDispatcherEnabled) return;
  intervalHandle = setInterval(runDispatchCycle, config.notificationsDispatchIntervalMs || 10000);
};

const stopNotificationDispatcher = () => {
  if (!intervalHandle) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
};

module.exports = {
  startNotificationDispatcher,
  stopNotificationDispatcher,
  runDispatchCycle
};
