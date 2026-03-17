const mongoose = require('mongoose');

const { Schema } = mongoose;

const internalInventoryItemSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    sku: { type: String, trim: true, uppercase: true, maxlength: 80 },
    category: { type: String, required: true, trim: true, maxlength: 120 },
    unit: { type: String, trim: true, default: 'units', maxlength: 40 },
    onHandQty: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },
    avgCost: { type: Number, default: 0, min: 0 },
    totalValue: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    deletedAt: Date
  },
  { timestamps: true }
);

internalInventoryItemSchema.index({ company: 1, name: 1, deletedAt: 1 });
internalInventoryItemSchema.index(
  { company: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: {
      sku: { $type: 'string' },
      deletedAt: { $exists: false }
    }
  }
);

module.exports = mongoose.model('InternalInventoryItem', internalInventoryItemSchema);
