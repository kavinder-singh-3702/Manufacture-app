const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * User-submitted reports against inappropriate content or bad actors.
 * Required for Apple App Store Guideline 1.2 (user-generated content
 * safety). Every report is reviewed by admin from the Command Center.
 *
 * targetType tells us which model targetId refers to:
 *  - "product"  → Product _id
 *  - "message"  → ChatMessage _id
 *  - "user"     → User _id
 */
const REPORT_TARGET_TYPES = ['product', 'message', 'user'];
const REPORT_STATUSES = ['pending', 'resolved', 'dismissed'];
const REPORT_REASONS = [
  'spam',
  'scam_or_fraud',
  'inappropriate',
  'harassment',
  'counterfeit_or_misleading',
  'other',
];

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: REPORT_TARGET_TYPES, required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    // Denormalized owner reference so the admin queue can jump straight
    // to the accountable user without a second lookup per row.
    targetOwner: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    details: { type: String, trim: true, maxlength: 2000 },
    status: { type: String, enum: REPORT_STATUSES, default: 'pending', index: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: Date,
    resolutionNotes: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true }
);

// Prevent a single reporter from spam-flagging the same target multiple
// times while a prior report is still pending. One resolved report can
// coexist with a new pending one for the same pair — that's intentional
// (a user can re-report if a resolved issue recurs).
reportSchema.index(
  { reporter: 1, targetType: 1, targetId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'pending' } }
);

const Report = mongoose.model('Report', reportSchema);
Report.REPORT_TARGET_TYPES = REPORT_TARGET_TYPES;
Report.REPORT_STATUSES = REPORT_STATUSES;
Report.REPORT_REASONS = REPORT_REASONS;

module.exports = Report;
