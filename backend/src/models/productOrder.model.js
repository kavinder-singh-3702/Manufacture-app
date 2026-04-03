const mongoose = require('mongoose');
const {
  PRODUCT_ORDER_SOURCES,
  PRODUCT_ORDER_STATUSES,
  PRODUCT_ORDER_PAYMENT_STATUSES,
  PRODUCT_ORDER_PAYMENT_PROVIDER,
  PRODUCT_ORDER_CURRENCY
} = require('../constants/productOrder');

const { Schema } = mongoose;

const AddressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 120 },
    state: { type: String, required: true, trim: true, maxlength: 120 },
    postalCode: { type: String, required: true, trim: true, maxlength: 40 },
    country: { type: String, required: true, trim: true, maxlength: 80 }
  },
  { _id: false }
);

const BuyerSnapshotSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    displayName: { type: String, trim: true, maxlength: 160 },
    email: { type: String, trim: true, maxlength: 200 },
    phone: { type: String, trim: true, maxlength: 40 }
  },
  { _id: false }
);

const PurchaseConfigSnapshotSchema = new Schema(
  {
    prepaidEnabled: { type: Boolean, default: false },
    paymentMode: { type: String, trim: true, maxlength: 40, default: 'none' },
    provider: { type: String, trim: true, maxlength: 40, default: 'none' }
  },
  { _id: false }
);

const ProductOrderLineItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    productName: { type: String, required: true, trim: true, maxlength: 200 },
    productSku: { type: String, trim: true, maxlength: 80 },
    productCategory: { type: String, trim: true, maxlength: 120 },
    productSubCategory: { type: String, trim: true, maxlength: 120 },
    variantTitle: { type: String, trim: true, maxlength: 200 },
    variantSku: { type: String, trim: true, maxlength: 80 },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true, default: PRODUCT_ORDER_CURRENCY },
    unit: { type: String, trim: true, maxlength: 60 },
    purchaseConfig: {
      type: PurchaseConfigSnapshotSchema,
      default: () => ({})
    }
  },
  { _id: false }
);

const TotalsSchema = new Schema(
  {
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true, default: PRODUCT_ORDER_CURRENCY },
    itemCount: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const productOrderSchema = new Schema(
  {
    clientRequestId: { type: String, trim: true, maxlength: 120 },
    buyer: { type: BuyerSnapshotSchema, required: true },
    shippingAddress: { type: AddressSchema, required: true },
    source: { type: String, enum: PRODUCT_ORDER_SOURCES, required: true },
    status: {
      type: String,
      enum: PRODUCT_ORDER_STATUSES,
      default: 'payment_pending',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: PRODUCT_ORDER_PAYMENT_STATUSES,
      default: 'pending',
      index: true
    },
    paymentProvider: {
      type: String,
      trim: true,
      maxlength: 40,
      default: PRODUCT_ORDER_PAYMENT_PROVIDER
    },
    lineItems: {
      type: [ProductOrderLineItemSchema],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one line item is required'
      }
    },
    totals: { type: TotalsSchema, required: true },
    paidAt: Date,
    refundedAt: Date,
    cancelledAt: Date,
    lastPaymentEventAt: Date,
    notes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { timestamps: true }
);

productOrderSchema.index({ 'buyer.user': 1, createdAt: -1 });
productOrderSchema.index({ status: 1, paymentStatus: 1, createdAt: -1 });
productOrderSchema.index(
  { 'buyer.user': 1, clientRequestId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      clientRequestId: { $exists: true, $type: 'string', $ne: '' }
    }
  }
);

module.exports = mongoose.model('ProductOrder', productOrderSchema);
