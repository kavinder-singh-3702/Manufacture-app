const mongoose = require('mongoose');
const {
  PRODUCT_ORDER_PAYMENT_PROVIDER,
  PRODUCT_ORDER_CURRENCY
} = require('../constants/productOrder');

const { Schema } = mongoose;

const PAYMENT_ATTEMPT_STATUSES = Object.freeze([
  'created',
  'authorized',
  'captured',
  'failed',
  'cancelled',
  'refunded'
]);

const paymentAttemptSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'ProductOrder', required: true, index: true },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: {
      type: String,
      trim: true,
      maxlength: 40,
      default: PRODUCT_ORDER_PAYMENT_PROVIDER
    },
    status: {
      type: String,
      enum: PAYMENT_ATTEMPT_STATUSES,
      default: 'created',
      index: true
    },
    receipt: { type: String, trim: true, maxlength: 120, required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true, default: PRODUCT_ORDER_CURRENCY },
    providerOrderId: { type: String, trim: true, maxlength: 120, index: true },
    providerPaymentId: { type: String, trim: true, maxlength: 120, index: true },
    signatureVerifiedAt: Date,
    verifiedAt: Date,
    authorizedAt: Date,
    capturedAt: Date,
    failedAt: Date,
    refundedAt: Date,
    providerOrderPayload: Schema.Types.Mixed,
    providerPaymentPayload: Schema.Types.Mixed,
    latestVerifyPayload: Schema.Types.Mixed,
    latestWebhookPayload: Schema.Types.Mixed
  },
  { timestamps: true }
);

paymentAttemptSchema.index({ order: 1, provider: 1, createdAt: -1 });
paymentAttemptSchema.index(
  { provider: 1, providerOrderId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      providerOrderId: { $exists: true, $type: 'string', $ne: '' }
    }
  }
);
paymentAttemptSchema.index(
  { provider: 1, providerPaymentId: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      providerPaymentId: { $exists: true, $type: 'string', $ne: '' }
    }
  }
);

module.exports = mongoose.model('PaymentAttempt', paymentAttemptSchema);
