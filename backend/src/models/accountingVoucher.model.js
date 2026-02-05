const mongoose = require('mongoose');
const { DEFAULT_CURRENCY } = require('../constants/product');
const { VOUCHER_TYPES, VOUCHER_STATUSES, GST_TYPES, ACCOUNT_DR_CR } = require('../constants/accounting');

const { Schema } = mongoose;

const LineTaxSchema = new Schema(
  {
    gstRate: { type: Number, min: 0, max: 100, default: 0 },
    gstType: { type: String, enum: GST_TYPES }
  },
  { _id: false }
);

const VoucherItemLineSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant' },
    description: { type: String, trim: true, maxlength: 300 },
    quantity: { type: Number, required: true, min: 0.000001 },
    unit: Schema.Types.Mixed,
    rate: { type: Number, min: 0, default: 0 },
    discountAmount: { type: Number, min: 0, default: 0 },
    amount: { type: Number, min: 0, default: 0 },
    tax: LineTaxSchema,
    meta: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { _id: false }
);

const VoucherChargeLineSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    description: { type: String, trim: true, maxlength: 300 },
    amount: { type: Number, required: true, min: 0 },
    tax: LineTaxSchema
  },
  { _id: false }
);

const VoucherJournalLineSchema = new Schema(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    debit: { type: Number, min: 0, default: 0 },
    credit: { type: Number, min: 0, default: 0 },
    drCr: { type: String, enum: ACCOUNT_DR_CR },
    narration: { type: String, trim: true, maxlength: 300 }
  },
  { _id: false }
);

const VoucherTotalsSchema = new Schema(
  {
    taxable: { type: Number, default: 0 },
    gstTotal: { type: Number, default: 0 },
    gross: { type: Number, default: 0 },
    roundOff: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    qtyIn: { type: Number, default: 0 },
    qtyOut: { type: Number, default: 0 },
    cogs: { type: Number, default: 0 }
  },
  { _id: false }
);

const VoucherGstSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    placeOfSupplyState: { type: String, trim: true, maxlength: 120 },
    gstType: { type: String, enum: GST_TYPES }
  },
  { _id: false }
);

const accountingVoucherSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    voucherType: { type: String, enum: VOUCHER_TYPES, required: true, index: true },
    status: { type: String, enum: VOUCHER_STATUSES, default: 'draft', index: true },
    voucherNumber: { type: String, trim: true },
    sequenceNumber: { type: Number, min: 1 },
    fiscalYearKey: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
    party: { type: Schema.Types.ObjectId, ref: 'Party', index: true },
    referenceNumber: { type: String, trim: true, maxlength: 120 },
    narration: { type: String, trim: true, maxlength: 800 },
    currency: { type: String, default: DEFAULT_CURRENCY, trim: true, uppercase: true },
    gst: { type: VoucherGstSchema, default: () => ({}) },
    lines: {
      items: { type: [VoucherItemLineSchema], default: [] },
      charges: { type: [VoucherChargeLineSchema], default: [] },
      journal: { type: [VoucherJournalLineSchema], default: [] }
    },
    totals: { type: VoucherTotalsSchema, default: () => ({}) },
    revision: { type: Number, min: 1, default: 1 },
    idempotencyKey: { type: String, trim: true, maxlength: 200 },
    postedAt: Date,
    postedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    voidedAt: Date,
    voidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    voidReason: { type: String, trim: true, maxlength: 500 },
    meta: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { timestamps: true }
);

accountingVoucherSchema.index(
  { company: 1, voucherType: 1, fiscalYearKey: 1, sequenceNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $ne: 'voided' },
      sequenceNumber: { $exists: true }
    }
  }
);
accountingVoucherSchema.index({ company: 1, date: -1 });
accountingVoucherSchema.index({ company: 1, party: 1, date: -1 });
accountingVoucherSchema.index({ company: 1, status: 1, date: -1 });
accountingVoucherSchema.index({ company: 1, idempotencyKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('AccountingVoucher', accountingVoucherSchema);

