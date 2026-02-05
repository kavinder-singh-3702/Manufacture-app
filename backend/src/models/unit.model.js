const mongoose = require('mongoose');

const { Schema } = mongoose;

const unitSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, trim: true, required: true, maxlength: 80 },
    symbol: { type: String, trim: true, required: true, maxlength: 20 },
    decimals: { type: Number, min: 0, max: 3, default: 0 },
    baseUnit: { type: Schema.Types.ObjectId, ref: 'Unit' },
    conversionFactorToBase: { type: Number, min: 0.000001, default: 1 },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    deletedAt: Date
  },
  { timestamps: true }
);

unitSchema.index(
  { company: 1, name: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $exists: false }
    }
  }
);
unitSchema.index({ company: 1, symbol: 1 });

module.exports = mongoose.model('Unit', unitSchema);

