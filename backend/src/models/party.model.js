const mongoose = require('mongoose');
const { PARTY_TYPES } = require('../constants/accounting');

const { Schema } = mongoose;

const PartyContactSchema = new Schema(
  {
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true, maxlength: 50 },
    contactPerson: { type: String, trim: true, maxlength: 120 }
  },
  { _id: false }
);

const PartyAddressSchema = new Schema(
  {
    line1: { type: String, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 120 },
    state: { type: String, trim: true, maxlength: 120 },
    country: { type: String, trim: true, maxlength: 120 },
    postalCode: { type: String, trim: true, maxlength: 20 }
  },
  { _id: false }
);

const partySchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, trim: true, required: true, maxlength: 160, index: true },
    type: { type: String, enum: PARTY_TYPES, default: 'customer', index: true },
    ledgerAccount: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    gstin: { type: String, trim: true, uppercase: true, maxlength: 20 },
    pan: { type: String, trim: true, uppercase: true, maxlength: 20 },
    contact: PartyContactSchema,
    address: PartyAddressSchema,
    creditDaysDefault: { type: Number, min: 0, default: 0 },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    deletedAt: Date
  },
  { timestamps: true }
);

partySchema.index(
  { company: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $exists: false }
    }
  }
);
partySchema.index(
  { company: 1, ledgerAccount: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $exists: false }
    }
  }
);
partySchema.index({ company: 1, type: 1, name: 1 });

module.exports = mongoose.model('Party', partySchema);

