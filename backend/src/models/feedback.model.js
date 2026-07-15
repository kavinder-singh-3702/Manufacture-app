const mongoose = require('mongoose');

const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    appVersion: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    platform: {
      type: String,
      enum: ['ios', 'android', 'web', 'unknown'],
      default: 'unknown',
    },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

feedbackSchema.index({ createdAt: -1 });
// Serves the admin inbox: filter by resolved/not-resolved, sort by
// createdAt desc. Without this, once the collection grows Mongo has to
// scan the createdAt index and post-filter every page.
feedbackSchema.index({ resolvedAt: 1, createdAt: -1 });

module.exports = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);
