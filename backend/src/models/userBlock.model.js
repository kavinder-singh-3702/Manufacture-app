const mongoose = require('mongoose');

const { Schema } = mongoose;

/**
 * Personal blocklist entry: `blocker` has blocked `blocked`. The blocked
 * user's messages, chat, and content are hidden from the blocker's view;
 * new chats between the pair are prevented in either direction.
 *
 * Required for Apple App Store Guideline 1.2 — users of marketplace apps
 * with UGC must be able to protect themselves from bad actors.
 */
const userBlockSchema = new Schema(
  {
    blocker: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    blocked: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Optional short reason the blocker recorded — useful support context
    // if the blocker later contacts admin about harassment.
    reason: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

// A user can only block another user once. Compound unique index prevents
// duplicates and speeds up the symmetric "is either party blocking the
// other?" lookup used at chat-message delivery time.
userBlockSchema.index({ blocker: 1, blocked: 1 }, { unique: true });

module.exports = mongoose.model('UserBlock', userBlockSchema);
