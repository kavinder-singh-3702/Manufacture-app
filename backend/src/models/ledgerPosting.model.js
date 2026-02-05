const mongoose = require('mongoose');

const { Schema } = mongoose;

const ledgerPostingSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    voucher: { type: Schema.Types.ObjectId, ref: 'AccountingVoucher', required: true, index: true },
    revision: { type: Number, min: 1, default: 1 },
    voucherType: { type: String, trim: true, required: true },
    voucherNumber: { type: String, trim: true },
    date: { type: Date, required: true },
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    party: { type: Schema.Types.ObjectId, ref: 'Party', index: true },
    debit: { type: Number, min: 0, default: 0 },
    credit: { type: Number, min: 0, default: 0 },
    meta: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    isVoided: { type: Boolean, default: false, index: true },
    voidedAt: Date
  },
  { timestamps: true }
);

ledgerPostingSchema.index({ company: 1, account: 1, date: -1 });
ledgerPostingSchema.index({ company: 1, party: 1, date: -1 });
ledgerPostingSchema.index({ company: 1, voucher: 1, revision: 1 });

module.exports = mongoose.model('LedgerPosting', ledgerPostingSchema);

