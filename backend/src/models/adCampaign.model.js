const mongoose = require('mongoose');
const {
  AD_CAMPAIGN_STATUSES,
  AD_PLACEMENTS,
  AD_TARGETING_MODES
} = require('../constants/ad');

const { Schema } = mongoose;

const AdTargetingSchema = new Schema(
  {
    mode: { type: String, enum: AD_TARGETING_MODES, default: 'any' },
    userIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    shopperCategories: [{ type: String, trim: true }],
    shopperSubCategories: [{ type: String, trim: true }],
    buyIntentCategories: [{ type: String, trim: true }],
    buyIntentSubCategories: [{ type: String, trim: true }],
    listedProductCategories: [{ type: String, trim: true }],
    listedProductSubCategories: [{ type: String, trim: true }],
    requireListedProductInSameCategory: { type: Boolean, default: false },
    lookbackDays: { type: Number, default: 60, min: 1, max: 365 }
  },
  { _id: false }
);

const AdScheduleSchema = new Schema(
  {
    startAt: Date,
    endAt: Date
  },
  { _id: false }
);

const AdCreativeSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 140 },
    subtitle: { type: String, trim: true, maxlength: 220 },
    ctaLabel: { type: String, trim: true, maxlength: 60 },
    badge: { type: String, trim: true, maxlength: 40 }
  },
  { _id: false }
);

const adCampaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: AD_CAMPAIGN_STATUSES, default: 'draft', index: true },

    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    advertiserUser: { type: Schema.Types.ObjectId, ref: 'User' },
    advertiserCompany: { type: Schema.Types.ObjectId, ref: 'Company', index: true },

    placements: {
      type: [String],
      enum: AD_PLACEMENTS,
      default: ['dashboard_home']
    },

    targeting: { type: AdTargetingSchema, default: () => ({}) },
    schedule: { type: AdScheduleSchema, default: () => ({}) },

    frequencyCapPerDay: { type: Number, default: 3, min: 1, max: 50 },
    priority: { type: Number, default: 50, min: 1, max: 100 },

    creative: { type: AdCreativeSchema, default: () => ({}) },

    sourceServiceRequest: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },

    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },

    activatedAt: Date,
    pausedAt: Date,
    archivedAt: Date,

    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    }
  },
  { timestamps: true }
);

adCampaignSchema.index({ status: 1, placements: 1, 'schedule.startAt': 1, 'schedule.endAt': 1, priority: -1 });
adCampaignSchema.index({ advertiserCompany: 1, status: 1, createdAt: -1 });
adCampaignSchema.index({ sourceServiceRequest: 1 }, { sparse: true });
adCampaignSchema.index({ 'targeting.userIds': 1, status: 1 });

module.exports = mongoose.model('AdCampaign', adCampaignSchema);
