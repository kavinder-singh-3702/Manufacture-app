const mongoose = require('mongoose');

const { Schema } = mongoose;

const MOVEMENT_TYPES = ['in', 'out', 'adjust'];

const internalStockMovementSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    item: { type: Schema.Types.ObjectId, ref: 'InternalInventoryItem', required: true, index: true },
    movementType: { type: String, enum: MOVEMENT_TYPES, required: true },
    qtyDelta: { type: Number, required: true },
    qtyAfter: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, default: 0, min: 0 },
    valueDelta: { type: Number, default: 0 },
    note: { type: String, trim: true, maxlength: 300 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { timestamps: true }
);

internalStockMovementSchema.index({ company: 1, item: 1, createdAt: -1 });
internalStockMovementSchema.index({ company: 1, movementType: 1, createdAt: -1 });

module.exports = mongoose.model('InternalStockMovement', internalStockMovementSchema);
