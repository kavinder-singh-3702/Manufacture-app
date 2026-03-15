const mongoose = require('mongoose');
const {
  BUSINESS_SETUP_STATUSES,
  BUSINESS_SETUP_PRIORITIES,
  WORK_MODE_IDS,
  BUDGET_RANGE_IDS,
  START_TIMELINE_IDS,
  SUPPORT_AREA_IDS,
  FOUNDER_EXPERIENCE_OPTIONS,
  CONTACT_CHANNEL_OPTIONS,
  REQUEST_SOURCE_OPTIONS
} = require('../constants/businessSetup');

const { Schema } = mongoose;

const StatusHistorySchema = new Schema(
  {
    from: { type: String, enum: BUSINESS_SETUP_STATUSES },
    to: { type: String, enum: BUSINESS_SETUP_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true, maxlength: 300 },
    note: { type: String, trim: true, maxlength: 1000 }
  },
  { _id: false }
);

const AssignmentHistorySchema = new Schema(
  {
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    unassignedFrom: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, trim: true, maxlength: 300 }
  },
  { _id: false }
);

const InternalNoteSchema = new Schema(
  {
    message: { type: String, trim: true, maxlength: 2000, required: true },
    kind: {
      type: String,
      enum: ['workflow', 'content', 'assignment', 'system', 'other'],
      default: 'workflow'
    },
    reason: { type: String, trim: true, maxlength: 300 },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now }
  },
  { _id: true }
);

const businessSetupRequestSchema = new Schema(
  {
    referenceCode: { type: String, trim: true, unique: true, required: true, index: true },
    title: { type: String, trim: true, maxlength: 200 },
    businessType: { type: String, trim: true, maxlength: 120, required: true, index: true },
    workModel: { type: String, enum: WORK_MODE_IDS, required: true, index: true },
    location: { type: String, trim: true, maxlength: 200, required: true, index: true },
    budgetRange: { type: String, enum: BUDGET_RANGE_IDS, required: true },
    startTimeline: { type: String, enum: START_TIMELINE_IDS, required: true },
    supportAreas: { type: [String], enum: SUPPORT_AREA_IDS, default: [] },
    founderExperience: { type: String, enum: FOUNDER_EXPERIENCE_OPTIONS },
    teamSize: { type: Number, min: 0 },
    preferredContactChannel: {
      type: String,
      enum: CONTACT_CHANNEL_OPTIONS,
      default: 'phone'
    },
    contactName: { type: String, trim: true, maxlength: 120 },
    contactEmail: { type: String, trim: true, maxlength: 200 },
    contactPhone: { type: String, trim: true, maxlength: 50 },
    notes: { type: String, trim: true, maxlength: 3000 },
    source: { type: String, enum: REQUEST_SOURCE_OPTIONS, required: true, index: true },
    status: { type: String, enum: BUSINESS_SETUP_STATUSES, default: 'new', index: true },
    priority: { type: String, enum: BUSINESS_SETUP_PRIORITIES, default: 'normal', index: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    createdByRole: { type: String, enum: ['admin', 'user', 'guest'], default: 'guest' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    slaDueAt: Date,
    firstResponseAt: Date,
    resolvedAt: Date,
    lastActionAt: Date,
    statusHistory: { type: [StatusHistorySchema], default: [] },
    assignmentHistory: { type: [AssignmentHistorySchema], default: [] },
    internalNotes: { type: [InternalNoteSchema], default: [] },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => ({})
    },
    deletedAt: Date
  },
  { timestamps: true }
);

businessSetupRequestSchema.index({ status: 1, updatedAt: -1 });
businessSetupRequestSchema.index({ createdBy: 1, createdAt: -1 });
businessSetupRequestSchema.index({ company: 1, status: 1, updatedAt: -1 });
businessSetupRequestSchema.index({ assignedTo: 1, status: 1, updatedAt: -1 });

module.exports = mongoose.model('BusinessSetupRequest', businessSetupRequestSchema);
