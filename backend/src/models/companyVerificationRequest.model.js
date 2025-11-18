const mongoose = require('mongoose');
const { COMPANY_VERIFICATION_STATUSES } = require('../constants/companyVerification');

const { Schema } = mongoose;

const DOCUMENT_FILE_SCHEMA = new Schema(
  {
    fileName: { type: String, trim: true },
    contentType: { type: String, trim: true },
    url: { type: String, trim: true },
    key: { type: String, trim: true },
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const AUDIT_ENTRY_SCHEMA = new Schema(
  {
    action: { type: String, enum: ['submitted', 'approved', 'rejected'], required: true },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, trim: true }
  },
  { _id: false }
);

const companyVerificationRequestSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: COMPANY_VERIFICATION_STATUSES, default: 'pending', index: true },
    notes: { type: String, trim: true },
    documents: {
      gstCertificate: DOCUMENT_FILE_SCHEMA,
      aadhaarCard: DOCUMENT_FILE_SCHEMA
    },
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decidedAt: Date,
    decisionNotes: { type: String, trim: true },
    rejectionReason: { type: String, trim: true },
    auditTrail: { type: [AUDIT_ENTRY_SCHEMA], default: [] }
  },
  { timestamps: true }
);

companyVerificationRequestSchema.index({ company: 1, status: 1 });

module.exports = mongoose.model('CompanyVerificationRequest', companyVerificationRequestSchema);
