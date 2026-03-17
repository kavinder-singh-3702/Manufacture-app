const mongoose = require('mongoose');
const { AD_EVENT_TYPES, AD_PLACEMENTS } = require('../constants/ad');

const { Schema } = mongoose;

const adEventSchema = new Schema(
  {
    campaign: { type: Schema.Types.ObjectId, ref: 'AdCampaign', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    advertiserCompany: { type: Schema.Types.ObjectId, ref: 'Company' },

    type: { type: String, enum: AD_EVENT_TYPES, required: true, index: true },
    placement: { type: String, enum: AD_PLACEMENTS, default: 'dashboard_home' },

    sessionId: { type: String, trim: true, maxlength: 120 },

    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { timestamps: true }
);

adEventSchema.index({ user: 1, campaign: 1, type: 1, createdAt: -1 });
adEventSchema.index({ campaign: 1, type: 1, createdAt: -1 });
adEventSchema.index({ user: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('AdEvent', adEventSchema);
