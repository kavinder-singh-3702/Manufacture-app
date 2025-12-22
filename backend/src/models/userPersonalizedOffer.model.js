const mongoose = require('mongoose');

const { Schema } = mongoose;

const OFFER_STATUSES = ['draft', 'active', 'expired', 'archived'];
const OFFER_TYPES = ['price_drop', 'combo', 'min_value'];

const userPersonalizedOfferSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, trim: true, maxlength: 500 },
    offerType: { type: String, enum: OFFER_TYPES, default: 'price_drop' },
    oldPrice: { type: Number, min: 0 },
    newPrice: { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, default: 'INR' },
    minOrderValue: { type: Number, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100 },
    expiresAt: { type: Date },
    status: { type: String, enum: OFFER_STATUSES, default: 'active', index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: Map, of: Schema.Types.Mixed, default: () => ({}) }
  },
  { timestamps: true }
);

userPersonalizedOfferSchema.index({ user: 1, status: 1, expiresAt: 1 });

module.exports = {
  UserPersonalizedOffer: mongoose.model('UserPersonalizedOffer', userPersonalizedOfferSchema),
  OFFER_STATUSES,
  OFFER_TYPES
};
