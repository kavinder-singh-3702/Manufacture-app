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
    /**
     * Optional pinned reference for this message. Currently only `type: 'product'`
     * is used (powers the pinned context card in seller chat). Stored on the
     * MESSAGE — not the conversation — so the same buyer/seller thread can re-pin
     * a different product if the buyer messages from another listing. ChatScreen
     * picks the latest message.contextRef when route params don't provide one.
     */
    contextRef: {
      type: { type: String },
      refId: String,
      label: String,
      imageUrl: String
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

chatMessageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
