const mongoose = require('mongoose');
const { PRODUCT_VARIANT_LOG_ACTIONS } = require('../constants/productVariant');

const { Schema } = mongoose;

const ChangeSchema = new Schema(
  {
    path: { type: String, required: true, trim: true, maxlength: 200 },
    from: Schema.Types.Mixed,
    to: Schema.Types.Mixed
  },
  { _id: false }
);

const productVariantLogSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: Schema.Types.ObjectId, ref: 'ProductVariant', index: true },
    action: { type: String, enum: PRODUCT_VARIANT_LOG_ACTIONS, required: true, index: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    changes: { type: [ChangeSchema], default: [] },
    before: Schema.Types.Mixed,
    after: Schema.Types.Mixed,
    note: { type: String, trim: true, maxlength: 500 },
    meta: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { timestamps: true }
);

productVariantLogSchema.index({ company: 1, product: 1, createdAt: -1 });
productVariantLogSchema.index({ company: 1, variant: 1, createdAt: -1 });
productVariantLogSchema.index({ product: 1, createdAt: -1 });
productVariantLogSchema.index({ variant: 1, createdAt: -1 });

module.exports = mongoose.model('ProductVariantLog', productVariantLogSchema);

