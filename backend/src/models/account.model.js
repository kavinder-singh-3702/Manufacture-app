const mongoose = require('mongoose');
const { ACCOUNT_TYPES, ACCOUNT_DR_CR } = require('../constants/accounting');

const { Schema } = mongoose;

const OpeningBalanceSchema = new Schema(
  {
    amount: { type: Number, min: 0, default: 0 },
    drCr: { type: String, enum: ACCOUNT_DR_CR, default: 'debit' },
    asOf: Date
  },
  { _id: false }
);

const accountSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    key: { type: String, trim: true, lowercase: true },
    name: { type: String, trim: true, required: true, maxlength: 160 },
    type: { type: String, enum: ACCOUNT_TYPES, required: true, index: true },
    group: { type: String, trim: true, required: true, index: true },
    isSystem: { type: Boolean, default: false, index: true },
    openingBalance: { type: OpeningBalanceSchema, default: () => ({}) },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    deletedAt: Date
  },
  { timestamps: true }
);

accountSchema.index(
  { company: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $exists: false }
    }
  }
);
accountSchema.index(
  { company: 1, key: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      key: { $exists: true, $type: 'string' },
      deletedAt: { $exists: false }
    }
  }
);
accountSchema.index({ company: 1, type: 1, group: 1 });

module.exports = mongoose.model('Account', accountSchema);

