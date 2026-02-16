const mongoose = require("mongoose");
const {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_ACTION_TYPES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_LIFECYCLE_STATUSES,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_AUDIENCE,
} = require("../constants/notification");

const { Schema } = mongoose;

const CHANNEL_OPTIONS = Object.values(NOTIFICATION_CHANNELS);
const PRIORITY_OPTIONS = Object.values(NOTIFICATION_PRIORITIES);
const LIFECYCLE_STATUS_OPTIONS = Object.values(NOTIFICATION_LIFECYCLE_STATUSES);
const DELIVERY_STATUS_OPTIONS = Object.values(NOTIFICATION_DELIVERY_STATUSES);
const AUDIENCE_OPTIONS = Object.values(NOTIFICATION_AUDIENCE);
const ACTION_OPTIONS = Object.values(NOTIFICATION_ACTION_TYPES);

const RECIPIENT_SCHEMA = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    company: { type: Schema.Types.ObjectId, ref: "Company" },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    pushToken: { type: String, trim: true },
    channels: [{ type: String, enum: CHANNEL_OPTIONS }],
    metadata: { type: Map, of: Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false }
);

const DELIVERY_SCHEMA = new Schema(
  {
    channel: { type: String, enum: CHANNEL_OPTIONS, required: true },
    provider: { type: String, trim: true },
    status: {
      type: String,
      enum: DELIVERY_STATUS_OPTIONS,
      default: NOTIFICATION_DELIVERY_STATUSES.QUEUED,
    },
    requestedAt: { type: Date, default: Date.now },
    attemptCount: { type: Number, default: 0 },
    sentAt: Date,
    deliveredAt: Date,
    failureAt: Date,
    nextRetryAt: Date,
    providerMessageId: { type: String, trim: true },
    errorCode: { type: String, trim: true },
    errorMessage: { type: String, trim: true },
    meta: { type: Map, of: Schema.Types.Mixed, default: () => ({}) },
  },
  { _id: false }
);

const ACTION_SCHEMA = new Schema(
  {
    type: { type: String, enum: ACTION_OPTIONS, default: NOTIFICATION_ACTION_TYPES.NONE },
    label: { type: String, trim: true },
    routeName: { type: String, trim: true },
    routeParams: { type: Map, of: Schema.Types.Mixed, default: () => ({}) },
    url: { type: String, trim: true },
    phone: { type: String, trim: true },
  },
  { _id: false }
);

const DELIVERY_POLICY_SCHEMA = new Schema(
  {
    respectQuietHours: { type: Boolean, default: true },
    allowPush: { type: Boolean, default: true },
    allowInApp: { type: Boolean, default: true },
    maxRetries: { type: Number, default: 4, min: 0, max: 10 },
    allowCriticalOverride: { type: Boolean, default: true },
  },
  { _id: false }
);

const notificationSchema = new Schema(
  {
    audience: {
      type: String,
      enum: AUDIENCE_OPTIONS,
      default: NOTIFICATION_AUDIENCE.USER,
    },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    company: { type: Schema.Types.ObjectId, ref: "Company" },
    actor: { type: Schema.Types.ObjectId, ref: "User" }, // Who triggered the notification.
    templateKey: { type: String, trim: true },
    eventKey: { type: String, required: true, trim: true }, // Namespaced event id e.g. company.verification.approved.
    topic: { type: String, trim: true }, // Used for grouping/filters such as "billing" or "security".
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    data: { type: Map, of: Schema.Types.Mixed, default: () => ({}) }, // Payload for clients/templating.
    channels: {
      type: [String],
      enum: CHANNEL_OPTIONS,
      default: [NOTIFICATION_CHANNELS.IN_APP],
    },
    priority: {
      type: String,
      enum: PRIORITY_OPTIONS,
      default: NOTIFICATION_PRIORITIES.NORMAL,
    },
    status: {
      type: String,
      enum: LIFECYCLE_STATUS_OPTIONS,
      default: NOTIFICATION_LIFECYCLE_STATUSES.QUEUED,
    }, // Lifecycle state across all channels.
    action: { type: ACTION_SCHEMA, default: () => ({}) },
    deliveryPolicy: { type: DELIVERY_POLICY_SCHEMA, default: () => ({}) },
    isSilent: { type: Boolean, default: false },
    requiresAck: { type: Boolean, default: false },
    ackAt: Date,
    deliveries: { type: [DELIVERY_SCHEMA], default: [] }, // Per-channel attempts.
    recipients: { type: [RECIPIENT_SCHEMA], default: [] }, // Explicit override for fan-out/broadcast.
    deduplicationKey: { type: String, trim: true }, // Optional idempotency key to avoid re-sends.
    scheduledAt: Date,
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    archivedAt: Date,
    expiresAt: Date, // Enables TTL cleanup for ephemeral notifications.
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    metadata: { type: Map, of: Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, status: 1, createdAt: -1 });
notificationSchema.index({ company: 1, status: 1, createdAt: -1 });
notificationSchema.index({ audience: 1, createdAt: -1 });
notificationSchema.index({ scheduledAt: 1, status: 1 });
notificationSchema.index({ deduplicationKey: 1 }, { unique: true, sparse: true });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ topic: 1, priority: 1 });
notificationSchema.index({ "deliveries.channel": 1, status: 1 });
notificationSchema.index({ archivedAt: 1, createdAt: -1 });
notificationSchema.index({ readAt: 1, createdAt: -1 });
notificationSchema.index({ "deliveries.nextRetryAt": 1, status: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
