const mongoose = require("mongoose");
const {
  NOTIFICATION_CHANNELS,
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
    sentAt: Date,
    deliveredAt: Date,
    failureAt: Date,
    errorCode: { type: String, trim: true },
    errorMessage: { type: String, trim: true },
    meta: { type: Map, of: Schema.Types.Mixed, default: () => ({}) },
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

module.exports = mongoose.model("Notification", notificationSchema);
