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

// Single source of truth for delivery-policy defaults. Previously copied
// verbatim in notification.service.js and referenced only implicitly by the
// notification.model.js schema defaults — a change to one could silently
// drift from the others.
const DEFAULT_DELIVERY_POLICY = Object.freeze({
  respectQuietHours: true,
  allowPush: true,
  allowInApp: true,
  allowEmail: true,
  maxRetries: 4,
  allowCriticalOverride: true,
});

// Single source of truth for a user's notification preferences shape/defaults.
// Previously duplicated in notification.service.js and
// notificationDeliveryPolicy.service.js with no shared import between them.
const DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
  masterEnabled: true,
  inAppEnabled: true,
  pushEnabled: true,
  emailEnabled: false,
  smsEnabled: false,
  quietHours: Object.freeze({
    enabled: false,
    start: '22:00',
    end: '08:00',
    timezone: 'UTC',
  }),
  topicOverrides: Object.freeze({}),
  priorityOverrides: Object.freeze({}),
});

const NOTIFICATION_DELIVERY_ERROR_CODES = Object.freeze({
  IN_APP_DISABLED: 'in_app_disabled',
  PUSH_DISABLED: 'push_disabled',
  EMAIL_DISABLED: 'email_disabled',
  MISSING_DEVICE_TOKEN: 'missing_device_token',
  MISSING_EMAIL_RECIPIENT: 'missing_email_recipient',
  RECIPIENT_USER_NOT_FOUND: 'recipient_user_not_found',
  PUSH_SEND_FAILED: 'push_send_failed',
  PUSH_EXCEPTION: 'push_exception',
  EMAIL_SEND_FAILED: 'email_send_failed',
  PUSH_GLOBALLY_DISABLED: 'push_globally_disabled',
  EMAIL_GLOBALLY_DISABLED: 'email_globally_disabled',
  CANCELLED_BY_ADMIN: 'cancelled_by_admin',
});

module.exports = {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_ACTION_TYPES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_LIFECYCLE_STATUSES,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_AUDIENCE,
  PRIORITY_DEFAULT_CHANNELS,
  DEFAULT_DELIVERY_POLICY,
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_DELIVERY_ERROR_CODES,
};
