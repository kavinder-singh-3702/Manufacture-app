const mongoose = require('mongoose');
const {
  PRODUCT_CATEGORIES,
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITY,
  DISCOUNT_TYPES,
  DEFAULT_CURRENCY
} = require('../constants/product');

const { Schema } = mongoose;

const CATEGORY_IDS = PRODUCT_CATEGORIES.map((c) => c.id);

const PriceSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: DEFAULT_CURRENCY, uppercase: true },
    unit: { type: String, default: 'unit', trim: true }
  },
  { _id: false }
);

const ImageSchema = new Schema(
  {
    key: String,
    url: String,
    fileName: String,
    contentType: String,
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: false }
);

const TargetedDiscountSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: DISCOUNT_TYPES, default: 'percentage' },
    value: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, maxlength: 300 },
    expiresAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 2000 },
    sku: { type: String, trim: true, uppercase: true },
    category: { type: String, required: true, enum: CATEGORY_IDS },
    subCategory: { type: String, trim: true, maxlength: 120 },
    price: { type: PriceSchema, required: true },
    minStockQuantity: { type: Number, default: 0, min: 0 },
    availableQuantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: 'units', trim: true },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'active' },
    visibility: { type: String, enum: PRODUCT_VISIBILITY, default: 'public' },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    contactPreferences: {
      allowChat: { type: Boolean, default: true },
      allowCall: { type: Boolean, default: true }
    },
    images: {
      type: [ImageSchema],
      default: []
    },
    targetedDiscounts: {
      type: [TargetedDiscountSchema],
      default: []
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    deletedAt: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

productSchema.index({ company: 1, category: 1, status: 1 });
productSchema.index({ company: 1, name: 1 });
productSchema.index({ company: 1, sku: 1 }, { unique: true, sparse: true });
productSchema.index({ 'targetedDiscounts.user': 1 });

productSchema.virtual('stockStatus').get(function () {
  if (this.availableQuantity <= 0) return 'out_of_stock';
  if (this.availableQuantity <= this.minStockQuantity) return 'low_stock';
  return 'in_stock';
});

productSchema.pre('save', function (next) {
  if (this.isModified('availableQuantity') && this.availableQuantity < 0) {
    this.availableQuantity = 0;
  }
  return next();
});

module.exports = mongoose.model('Product', productSchema);
