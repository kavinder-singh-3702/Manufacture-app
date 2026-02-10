const mongoose = require('mongoose');

const { Schema } = mongoose;

const EVENT_TYPES = [
  'search',
  'view_category',
  'view_product',
  'add_to_cart',
  'remove_from_cart',
  'campaign_impression',
  'campaign_click',
  'campaign_message',
  'campaign_call',
  'checkout_start'
];

const userPreferenceEventSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    type: { type: String, enum: EVENT_TYPES, required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    category: { type: String, trim: true },
    searchTerm: { type: String, trim: true },
    quantity: { type: Number, min: 0, default: 1 },
    meta: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { timestamps: true }
);

userPreferenceEventSchema.index({ user: 1, createdAt: -1 });
userPreferenceEventSchema.index({ user: 1, type: 1, createdAt: -1 });
userPreferenceEventSchema.index({ user: 1, category: 1 });
userPreferenceEventSchema.index({ user: 1, searchTerm: 1 });

module.exports = {
  UserPreferenceEvent: mongoose.model('UserPreferenceEvent', userPreferenceEventSchema),
  EVENT_TYPES
};
