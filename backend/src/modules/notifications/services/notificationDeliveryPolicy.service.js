const { NOTIFICATION_PRIORITIES } = require('../../../constants/notification');

const DEFAULT_NOTIFICATION_PREFS = {
  masterEnabled: true,
  inAppEnabled: true,
  pushEnabled: true,
  emailEnabled: false,
  smsEnabled: false,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC'
  },
  topicOverrides: {},
  priorityOverrides: {}
};

const toPlainObject = (value) => {
  if (!value) return {};
  if (value instanceof Map) return Object.fromEntries(value.entries());
  if (typeof value.toObject === 'function') return value.toObject();
  return typeof value === 'object' ? value : {};
};

const normalizePrefs = (user = {}) => {
  const notificationPrefs = toPlainObject(user.preferences?.notifications);
  return {
    ...DEFAULT_NOTIFICATION_PREFS,
    ...notificationPrefs,
    quietHours: {
      ...DEFAULT_NOTIFICATION_PREFS.quietHours,
      ...toPlainObject(notificationPrefs.quietHours)
    },
    topicOverrides: toPlainObject(notificationPrefs.topicOverrides),
    priorityOverrides: toPlainObject(notificationPrefs.priorityOverrides)
  };
};

const toMinutes = (value) => {
  if (typeof value !== 'string') return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
};

const getUserMinutes = (timezone = 'UTC', now = new Date()) => {
  try {
    const locale = now.toLocaleString('en-US', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const [hourStr, minuteStr] = locale.split(':');
    const hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    return hour * 60 + minute;
  } catch {
    return null;
  }
};

const isWithinQuietHours = (quietHours = {}, now = new Date()) => {
  if (!quietHours?.enabled) return false;
  const start = toMinutes(quietHours.start);
  const end = toMinutes(quietHours.end);
  const current = getUserMinutes(quietHours.timezone || 'UTC', now);

  if (start === null || end === null || current === null) return false;

  if (start === end) return true;
  if (start < end) {
    return current >= start && current < end;
  }
  return current >= start || current < end;
};

const getTopicOverride = (prefs, topic) => {
  if (!topic) return {};
  const override = prefs.topicOverrides?.[topic];
  return toPlainObject(override);
};

const getPriorityOverride = (prefs, priority) => {
  if (!priority) return {};
  const normalizedPriority = Object.values(NOTIFICATION_PRIORITIES).includes(priority)
    ? priority
    : NOTIFICATION_PRIORITIES.NORMAL;
  const override = prefs.priorityOverrides?.[normalizedPriority];
  return toPlainObject(override);
};

const resolveChannelDecision = ({ user, notification, channel }) => {
  const prefs = normalizePrefs(user);
  const topicOverride = getTopicOverride(prefs, notification.topic);
  const priorityOverride = getPriorityOverride(prefs, notification.priority);

  if (!prefs.masterEnabled && notification.priority !== NOTIFICATION_PRIORITIES.CRITICAL) {
    return false;
  }

  if (channel === 'in_app') {
    if (notification.deliveryPolicy?.allowInApp === false) return false;
    if (typeof topicOverride.inApp === 'boolean') return topicOverride.inApp;
    if (typeof priorityOverride.inApp === 'boolean') return priorityOverride.inApp;
    return prefs.inAppEnabled !== false;
  }

  if (channel === 'push') {
    if (notification.deliveryPolicy?.allowPush === false) return false;
    if (typeof topicOverride.push === 'boolean') return topicOverride.push;
    if (typeof priorityOverride.push === 'boolean') return priorityOverride.push;

    const pushEnabled = prefs.pushEnabled !== false;
    if (!pushEnabled && !(notification.priority === NOTIFICATION_PRIORITIES.CRITICAL && notification.deliveryPolicy?.allowCriticalOverride !== false)) {
      return false;
    }

    if (
      notification.priority !== NOTIFICATION_PRIORITIES.CRITICAL &&
      notification.deliveryPolicy?.respectQuietHours !== false &&
      isWithinQuietHours(prefs.quietHours)
    ) {
      return false;
    }

    return true;
  }

  return true;
};

module.exports = {
  normalizePrefs,
  isWithinQuietHours,
  resolveChannelDecision
};
