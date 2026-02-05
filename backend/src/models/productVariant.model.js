const mongoose = require('mongoose');
const { DEFAULT_CURRENCY } = require('../constants/product');
const { PRODUCT_VARIANT_STATUSES } = require('../constants/productVariant');

const { Schema } = mongoose;

const PriceSchema = new Schema(
  {
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: DEFAULT_CURRENCY, uppercase: true },
    unit: { type: String, default: 'unit', trim: true }
  },
  { _id: false }
);

const normalizeOptionValue = (value) => {
  if (value === undefined || value === null) return undefined;

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeOptionValue).filter((v) => v !== undefined);
  }

  if (value instanceof Map) {
    return normalizeOptionValue(Object.fromEntries(value));
  }

  if (typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        const normalized = normalizeOptionValue(value[key]);
        if (normalized === undefined) return acc;
        acc[key] = normalized;
        return acc;
      }, {});
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed.toLowerCase() : undefined;
  }

  return value;
};

const computeOptionsSignature = (options) => {
  const raw =
    options instanceof Map ? Object.fromEntries(options) : options && typeof options === 'object' ? options : {};

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return '{}';
  }

  const cleaned = Object.keys(raw)
    .sort()
    .reduce((acc, key) => {
      const normalizedKey = String(key).trim().toLowerCase();
      if (!normalizedKey) return acc;
      const normalizedValue = normalizeOptionValue(raw[key]);
      if (normalizedValue === undefined) return acc;
      acc[normalizedKey] = normalizedValue;
      return acc;
    }, {});

  return JSON.stringify(cleaned);
};

const productVariantSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    title: { type: String, trim: true, maxlength: 200 },
    sku: { type: String, trim: true, uppercase: true },
    barcode: { type: String, trim: true, maxlength: 120 },
    options: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    optionsSignature: { type: String, required: true, index: true },
    price: { type: PriceSchema },
    minStockQuantity: { type: Number, default: 0, min: 0 },
    availableQuantity: { type: Number, default: 0, min: 0 },
    unit: { type: String, trim: true, maxlength: 50 },
    status: { type: String, enum: PRODUCT_VARIANT_STATUSES, default: 'active', index: true },
    attributes: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    deletedAt: Date
  },
  { timestamps: true }
);

productVariantSchema.index({ company: 1, sku: 1 }, { unique: true, sparse: true });
productVariantSchema.index(
  { product: 1, optionsSignature: 1 },
  { unique: true, partialFilterExpression: { deletedAt: { $exists: false } } }
);
productVariantSchema.index({ product: 1, status: 1, createdAt: -1 });

productVariantSchema.pre('validate', function (next) {
  this.optionsSignature = computeOptionsSignature(this.options);
  return next();
});

productVariantSchema.pre('save', function (next) {
  if (this.isModified('availableQuantity') && this.availableQuantity < 0) {
    this.availableQuantity = 0;
  }
  return next();
});

productVariantSchema.statics.computeOptionsSignature = computeOptionsSignature;

module.exports = mongoose.model('ProductVariant', productVariantSchema);

