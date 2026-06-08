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
    /**
     * Sorted, colon-joined participant user IDs. Used as the canonical
     * dedup key so two users can never have more than one conversation
     * between them. Format: `${minId}:${maxId}` (lexicographically sorted
     * so {A,B} and {B,A} hash to the same value).
     *
     * The unique sparse index below enforces this at the database level;
     * `getOrCreateConversation` then uses an atomic `findOneAndUpdate`
     * with upsert keyed on this field to make creation race-safe.
     *
     * Sparse so legacy conversations without a pair key (pre-migration)
     * don't all collide on `null`. The one-time cleanup script
     * `scripts/mergeDuplicateConversations.js` backfills this field.
     */
    participantPairKey: { type: String, trim: true },
    lastMessage: { type: String, default: '' },
    lastMessageAt: { type: Date },
    metadata: { type: Map, of: Schema.Types.Mixed, default: () => ({}) }
  },
  { timestamps: true }
);

chatConversationSchema.index({ 'participants.user': 1 });
chatConversationSchema.index({ updatedAt: -1 });
chatConversationSchema.index({ participantPairKey: 1 }, { unique: true, sparse: true });

/**
 * Build the sorted colon-joined participant key from two user IDs.
 * Exported so the service layer can compute the key without duplicating
 * the formatting logic.
 */
chatConversationSchema.statics.buildParticipantPairKey = (userIdA, userIdB) => {
  const a = String(userIdA);
  const b = String(userIdB);
  return a < b ? `${a}:${b}` : `${b}:${a}`;
};

module.exports = mongoose.model('ChatConversation', chatConversationSchema);
