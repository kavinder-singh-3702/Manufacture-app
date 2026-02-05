const mongoose = require('mongoose');

const { Schema } = mongoose;

const inventoryBalanceSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', default: null, index: true },
    onHandQtyBase: { type: Number, default: 0 },
    onHandValue: { type: Number, default: 0 },
    avgCost: { type: Number, default: 0 }
  },
  { timestamps: true }
);

inventoryBalanceSchema.index({ company: 1, product: 1, variant: 1 }, { unique: true });
inventoryBalanceSchema.index({ company: 1, updatedAt: -1 });

module.exports = mongoose.model('InventoryBalance', inventoryBalanceSchema);

