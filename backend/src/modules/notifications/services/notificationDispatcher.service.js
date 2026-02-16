const Notification = require('../../../models/notification.model');
const User = require('../../../models/user.model');
const UserDevice = require('../../../models/userDevice.model');
const config = require('../../../config/env');
const { emitToUser } = require('../../../socket');
const { formatNotification } = require('../../../services/notification.service');
const {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_LIFECYCLE_STATUSES
} = require('../../../constants/notification');
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

const toPlainData = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value.toObject === 'function') return value.toObject();
  return typeof value === 'object' ? value : {};
};

const computeLifecycle = (deliveries = []) => {
  const statuses = deliveries.map((d) => d.status);
  if (!statuses.length) return NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED;
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
  if (statuses.every((status) => status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED)) {
    return NOTIFICATION_LIFECYCLE_STATUSES.COMPLETED;
  }
  if (statuses.some((status) => status === NOTIFICATION_DELIVERY_STATUSES.FAILED)) {
    if (statuses.some((status) => status === NOTIFICATION_DELIVERY_STATUSES.DELIVERED || status === NOTIFICATION_DELIVERY_STATUSES.QUEUED)) {
      return NOTIFICATION_LIFECYCLE_STATUSES.PARTIALLY_SENT;
    }
  }
  if (statuses.some((status) => status === NOTIFICATION_DELIVERY_STATUSES.QUEUED || status === NOTIFICATION_DELIVERY_STATUSES.SENDING)) {
    return NOTIFICATION_LIFECYCLE_STATUSES.DISPATCHING;
  }
  return NOTIFICATION_LIFECYCLE_STATUSES.PARTIALLY_SENT;
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
      errorCode: 'push_disabled',
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
      errorCode: 'missing_device_token',
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

    result.results
      .filter((item) => item.status === 'error' && item.details?.error === 'DeviceNotRegistered')
      .forEach(async (item) => {
        await UserDevice.updateOne(
          { pushToken: item.token },
          {
            $set: {
              isActive: false,
              lastErrorAt: nowDate(),
              lastErrorMessage: item.message || 'DeviceNotRegistered'
            }
          }
        );
      });

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
        errorCode: 'push_send_failed',
        errorMessage: result.results[0]?.message || 'Push provider failed to deliver.'
      });
    }
  } catch (error) {
    scheduleRetry({
      notification,
      channel: NOTIFICATION_CHANNELS.PUSH,
      errorCode: 'push_exception',
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
      errorCode: 'in_app_disabled',
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

const fetchCandidatesByChannel = async (channel) => {
  const now = nowDate();
  const deliveryFilter = {
    channel,
    status: { $in: [NOTIFICATION_DELIVERY_STATUSES.QUEUED, NOTIFICATION_DELIVERY_STATUSES.SENDING] },
  };

  if (channel === NOTIFICATION_CHANNELS.PUSH) {
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
  if (channel === NOTIFICATION_CHANNELS.PUSH) {
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
        'push_globally_disabled',
        'Push dispatch disabled by server configuration.'
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
