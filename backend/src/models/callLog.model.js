const mongoose = require('mongoose');

const { Schema } = mongoose;

const callLogSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'ChatConversation' },
    caller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    callee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, required: true },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    notes: { type: String, trim: true, maxlength: 500 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: Map, of: Schema.Types.Mixed, default: () => ({}) }
  },
  { timestamps: true }
);

callLogSchema.index({ caller: 1, callee: 1, startedAt: -1 });
callLogSchema.index({ conversation: 1, startedAt: -1 });
callLogSchema.index({ createdAt: -1, caller: 1 });
callLogSchema.index({ createdAt: -1, callee: 1 });

module.exports = mongoose.model('CallLog', callLogSchema);
