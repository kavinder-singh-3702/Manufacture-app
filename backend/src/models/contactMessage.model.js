const mongoose = require('mongoose');
const { CONTACT_MESSAGE_STATUSES } = require('../constants/contact');

const { Schema } = mongoose;

const contactMessageSchema = new Schema(
  {
    name:    { type: String, required: true, trim: true, maxlength: 120 },
    email:   { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    company: { type: String, trim: true, maxlength: 200 },
    topic:   { type: String, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    // Linked when the sender is signed in (best-effort via optional auth).
    user:    { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status:  { type: String, enum: CONTACT_MESSAGE_STATUSES, default: 'new', index: true },
    adminNotes: { type: String, trim: true, maxlength: 2000 },
    // Lightweight metadata for abuse triage.
    meta: {
      ip:        { type: String, trim: true, maxlength: 64 },
      userAgent: { type: String, trim: true, maxlength: 400 },
    },
  },
  { timestamps: true }
);

contactMessageSchema.index({ status: 1, createdAt: -1 });
contactMessageSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
