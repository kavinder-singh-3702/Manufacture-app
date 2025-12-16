const mongoose = require('mongoose');

const { Schema } = mongoose;

const chatMessageSchema = new Schema(
  {
    conversation: { type: Schema.Types.ObjectId, ref: 'ChatConversation', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['admin', 'user', 'support'], default: 'user' },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    attachments: [
      {
        url: String,
        type: { type: String },
        name: String,
        size: Number
      }
    ],
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
