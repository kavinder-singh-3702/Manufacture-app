const mongoose = require('mongoose');
const { STOCK_DIRECTIONS } = require('../constants/accounting');

const { Schema } = mongoose;

const stockMoveSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    voucher: { type: Schema.Types.ObjectId, ref: 'AccountingVoucher', required: true, index: true },
    revision: { type: Number, min: 1, default: 1 },
    voucherType: { type: String, trim: true, required: true },
    voucherNumber: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', index: true },
    direction: { type: String, enum: STOCK_DIRECTIONS, required: true },
    quantityBase: { type: Number, required: true, min: 0.000001 },
    displayQuantity: { type: Number, required: true, min: 0.000001 },
    displayUnit: { type: String, trim: true, maxlength: 40 },
    rate: { type: Number, min: 0, default: 0 },
    value: { type: Number, min: 0, default: 0 },
    costRate: { type: Number, min: 0, default: 0 },
    costValue: { type: Number, min: 0, default: 0 },
    isVoided: { type: Boolean, default: false, index: true },
    voidedAt: Date,
    meta: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { timestamps: true }
);

stockMoveSchema.index({ company: 1, product: 1, variant: 1, date: -1 });
stockMoveSchema.index({ company: 1, voucher: 1, revision: 1 });

module.exports = mongoose.model('StockMove', stockMoveSchema);

