const mongoose = require('mongoose');
const { QUOTE_STATUSES } = require('../constants/quote');
const { DEFAULT_CURRENCY } = require('../constants/product');

const { Schema } = mongoose;

const ContactSnapshotSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 50 },
    email: { type: String, trim: true, maxlength: 200 }
  },
  { _id: false }
);

const QuoteRequestSchema = new Schema(
  {
    quantity: { type: Number, required: true, min: 1 },
    targetPrice: { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, default: DEFAULT_CURRENCY },
    requirements: { type: String, required: true, trim: true, maxlength: 2000 },
    requiredBy: Date,
    buyerContact: ContactSnapshotSchema
  },
  { _id: false }
);

const QuoteResponseSchema = new Schema(
  {
    unitPrice: { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, default: DEFAULT_CURRENCY },
    minOrderQty: { type: Number, min: 1 },
    leadTimeDays: { type: Number, min: 0 },
    validUntil: Date,
    notes: { type: String, trim: true, maxlength: 2000 },
    respondedAt: Date,
    respondedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
);

const QuoteHistorySchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User' },
    action: { type: String, required: true, trim: true, maxlength: 60 },
    statusFrom: { type: String, enum: QUOTE_STATUSES },
    statusTo: { type: String, enum: QUOTE_STATUSES },
    note: { type: String, trim: true, maxlength: 500 },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const productQuoteSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    buyerCompany: { type: Schema.Types.ObjectId, ref: 'Company' },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerCompany: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    request: { type: QuoteRequestSchema, required: true },
    response: QuoteResponseSchema,
    status: { type: String, enum: QUOTE_STATUSES, default: 'pending', index: true },
    history: { type: [QuoteHistorySchema], default: [] },
    deletedAt: Date
  },
  {
    timestamps: true
  }
);

productQuoteSchema.index({ buyer: 1, status: 1, updatedAt: -1 });
productQuoteSchema.index({ seller: 1, status: 1, updatedAt: -1 });
productQuoteSchema.index({ product: 1, createdAt: -1 });
productQuoteSchema.index({ sellerCompany: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model('ProductQuote', productQuoteSchema);
