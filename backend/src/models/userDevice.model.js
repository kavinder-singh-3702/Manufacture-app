const mongoose = require('mongoose');

const { Schema } = mongoose;

const USER_DEVICE_SCHEMA = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    platform: { type: String, enum: ['ios', 'android', 'web'], default: 'android' },
    pushProvider: { type: String, enum: ['expo'], default: 'expo' },
    pushToken: { type: String, required: true, trim: true, unique: true },
    appVersion: { type: String, trim: true },
    buildNumber: { type: String, trim: true },
    deviceModel: { type: String, trim: true },
    osVersion: { type: String, trim: true },
    locale: { type: String, trim: true },
    timezone: { type: String, trim: true },
    isActive: { type: Boolean, default: true, index: true },
    lastSeenAt: { type: Date, default: Date.now },
    lastErrorAt: Date,
    lastErrorMessage: { type: String, trim: true },
    metadata: { type: Map, of: Schema.Types.Mixed, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

USER_DEVICE_SCHEMA.index({ user: 1, isActive: 1, updatedAt: -1 });
USER_DEVICE_SCHEMA.index({ lastSeenAt: -1 });

module.exports = mongoose.model('UserDevice', USER_DEVICE_SCHEMA);
