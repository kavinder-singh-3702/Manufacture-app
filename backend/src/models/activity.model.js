const mongoose = require('mongoose');

const { Schema } = mongoose;

const activitySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Actor performing the action.
    company: { type: Schema.Types.ObjectId, ref: 'Company' }, // Optional workspace context.
    companyName: { type: String, trim: true }, // Cached company label for quick timeline rendering.
    action: { type: String, required: true, trim: true }, // Namespaced action key, e.g. auth.login.
    category: { type: String, trim: true }, // Broad grouping such as auth/user/company.
    label: { type: String, required: true, trim: true }, // Human-friendly headline shown in the UI.
    description: { type: String, trim: true }, // Optional detail for the event.
    meta: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    }, // Structured payload used by the client if present.
    ip: { type: String, trim: true }, // IP address recorded for audit visibility.
    userAgent: { type: String, trim: true } // Browser or client identifier when available.
  },
  { timestamps: true }
);

activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);
