const mongoose = require('mongoose');
const { VOUCHER_TYPES } = require('../constants/accounting');

const { Schema } = mongoose;

const accountingSequenceSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    fiscalYearKey: { type: String, required: true, trim: true },
    voucherType: { type: String, enum: VOUCHER_TYPES, required: true, index: true },
    prefix: { type: String, trim: true, default: '' },
    padding: { type: Number, min: 1, max: 12, default: 5 },
    nextNumber: { type: Number, min: 1, default: 1 }
  },
  { timestamps: true }
);

accountingSequenceSchema.index({ company: 1, fiscalYearKey: 1, voucherType: 1 }, { unique: true });

module.exports = mongoose.model('AccountingSequence', accountingSequenceSchema);

