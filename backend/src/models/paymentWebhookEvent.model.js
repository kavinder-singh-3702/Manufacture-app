const mongoose = require('mongoose');

const { Schema } = mongoose;

const paymentWebhookEventSchema = new Schema(
  {
    provider: { type: String, required: true, trim: true, maxlength: 40 },
    event: { type: String, required: true, trim: true, maxlength: 120 },
    eventId: { type: String, trim: true, maxlength: 120 },
    dedupeKey: { type: String, required: true, trim: true, maxlength: 220, unique: true },
    signature: { type: String, trim: true, maxlength: 300 },
    payloadHash: { type: String, trim: true, maxlength: 128 },
    rawBody: { type: String },
    payload: Schema.Types.Mixed,
    order: { type: Schema.Types.ObjectId, ref: 'ProductOrder', index: true },
    paymentAttempt: { type: Schema.Types.ObjectId, ref: 'PaymentAttempt', index: true },
    processedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

paymentWebhookEventSchema.index(
  { provider: 1, eventId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      eventId: { $exists: true, $type: 'string', $ne: '' }
    }
  }
);

module.exports = mongoose.model('PaymentWebhookEvent', paymentWebhookEventSchema);
