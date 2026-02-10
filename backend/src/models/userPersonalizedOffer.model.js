const mongoose = require('mongoose');
const { SERVICE_TYPES } = require('../constants/services');

const { Schema } = mongoose;

const OFFER_STATUSES = ['draft', 'active', 'expired', 'archived'];
const OFFER_TYPES = ['price_drop', 'combo', 'min_value'];
const CAMPAIGN_CONTENT_TYPES = ['product', 'service'];
const CAMPAIGN_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

const CreativeSchema = new Schema(
  {
    headline: { type: String, trim: true, maxlength: 200 },
    subheadline: { type: String, trim: true, maxlength: 400 },
    badge: { type: String, trim: true, maxlength: 60 },
    themeKey: { type: String, trim: true, maxlength: 60 },
    ctaLabel: { type: String, trim: true, maxlength: 80 }
  },
  { _id: false }
);

const ContactSchema = new Schema(
  {
    adminUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    adminName: { type: String, trim: true, maxlength: 120 },
    phone: { type: String, trim: true, maxlength: 40 },
    allowChat: { type: Boolean, default: true },
    allowCall: { type: Boolean, default: true }
  },
  { _id: false }
);

const userPersonalizedOfferSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', index: true },
    contentType: { type: String, enum: CAMPAIGN_CONTENT_TYPES, default: 'product', index: true },
    serviceType: { type: String, enum: SERVICE_TYPES },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required() {
        return this.contentType === 'product';
      }
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, trim: true, maxlength: 500 },
    creative: { type: CreativeSchema, default: () => ({}) },
    offerType: { type: String, enum: OFFER_TYPES, default: 'price_drop' },
    oldPrice: { type: Number, min: 0 },
    newPrice: { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, default: 'INR' },
    minOrderValue: { type: Number, min: 0 },
    discountPercent: { type: Number, min: 0, max: 100 },
    priority: { type: String, enum: CAMPAIGN_PRIORITIES, default: 'normal', index: true },
    startsAt: { type: Date },
    expiresAt: { type: Date },
    status: { type: String, enum: OFFER_STATUSES, default: 'active', index: true },
    contact: { type: ContactSchema, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: Map, of: Schema.Types.Mixed, default: () => ({}) }
  },
  { timestamps: true }
);

userPersonalizedOfferSchema.index({ user: 1, status: 1, startsAt: 1, expiresAt: 1 });
userPersonalizedOfferSchema.index({ user: 1, contentType: 1, status: 1 });

module.exports = {
  UserPersonalizedOffer: mongoose.model('UserPersonalizedOffer', userPersonalizedOfferSchema),
  OFFER_STATUSES,
  OFFER_TYPES,
  CAMPAIGN_CONTENT_TYPES,
  CAMPAIGN_PRIORITIES
};
