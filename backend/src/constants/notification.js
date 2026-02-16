const NOTIFICATION_CHANNELS = Object.freeze({
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  WEBHOOK: 'webhook'
});

const NOTIFICATION_ACTION_TYPES = Object.freeze({
  NONE: 'none',
  ROUTE: 'route',
  URL: 'url',
  CHAT: 'chat',
  CALL: 'call'
});

const NOTIFICATION_PRIORITIES = Object.freeze({
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  CRITICAL: 'critical'
});

const NOTIFICATION_LIFECYCLE_STATUSES = Object.freeze({
  DRAFT: 'draft',
  QUEUED: 'queued',
  DISPATCHING: 'dispatching',
  PARTIALLY_SENT: 'partially-sent',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

const NOTIFICATION_DELIVERY_STATUSES = Object.freeze({
  QUEUED: 'queued',
  SENDING: 'sending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
});

const NOTIFICATION_AUDIENCE = Object.freeze({
  USER: 'user',
  COMPANY: 'company',
  BROADCAST: 'broadcast'
});

const PRIORITY_DEFAULT_CHANNELS = Object.freeze({
  low: [NOTIFICATION_CHANNELS.IN_APP],
  normal: [NOTIFICATION_CHANNELS.IN_APP],
  high: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH],
  critical: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH]
});

module.exports = {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_ACTION_TYPES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_LIFECYCLE_STATUSES,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_AUDIENCE,
  PRIORITY_DEFAULT_CHANNELS
};
