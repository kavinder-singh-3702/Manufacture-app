const mongoose = require('mongoose');
const { VOUCHER_LOG_ACTIONS } = require('../constants/accounting');

const { Schema } = mongoose;

const ChangeSchema = new Schema(
  {
    path: { type: String, trim: true, required: true, maxlength: 200 },
    from: Schema.Types.Mixed,
    to: Schema.Types.Mixed
  },
  { _id: false }
);

const accountingVoucherLogSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    voucher: { type: Schema.Types.ObjectId, ref: 'AccountingVoucher', required: true, index: true },
    revision: { type: Number, min: 1, required: true },
    action: { type: String, enum: VOUCHER_LOG_ACTIONS, required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    changes: { type: [ChangeSchema], default: [] }
  },
  { timestamps: true }
);

accountingVoucherLogSchema.index({ company: 1, voucher: 1, revision: -1 });

module.exports = mongoose.model('AccountingVoucherLog', accountingVoucherLogSchema);

