const mongoose = require('mongoose');

const { Schema } = mongoose;

const participantSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['admin', 'user', 'support'], default: 'user' },
    lastReadAt: { type: Date }
  },
  { _id: false }
);

const chatConversationSchema = new Schema(
  {
    participants: {
      type: [participantSchema],
      validate: [(arr) => Array.isArray(arr) && arr.length >= 2, 'Conversation must have at least two participants']
    },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date },
    metadata: { type: Map, of: Schema.Types.Mixed, default: () => ({}) }
  },
  { timestamps: true }
);

chatConversationSchema.index({ 'participants.user': 1 });
chatConversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
