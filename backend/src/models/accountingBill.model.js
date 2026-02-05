const mongoose = require('mongoose');
const { BILL_TYPES, BILL_STATUSES } = require('../constants/accounting');

const { Schema } = mongoose;

const accountingBillSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    party: { type: Schema.Types.ObjectId, ref: 'Party', required: true, index: true },
    voucher: { type: Schema.Types.ObjectId, ref: 'AccountingVoucher', required: true, index: true },
    billType: { type: String, enum: BILL_TYPES, required: true, index: true },
    billNumber: { type: String, trim: true, required: true },
    billDate: { type: Date, required: true },
    dueDate: Date,
    totalAmount: { type: Number, required: true, min: 0 },
    settledAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: BILL_STATUSES, default: 'open', index: true },
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

accountingBillSchema.index({ company: 1, party: 1, status: 1, dueDate: 1 });
accountingBillSchema.index({ company: 1, voucher: 1 }, { unique: true });

module.exports = mongoose.model('AccountingBill', accountingBillSchema);

