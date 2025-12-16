const mongoose = require('mongoose');
const ChatConversation = require('../../../models/chatConversation.model');
const ChatMessage = require('../../../models/chatMessage.model');
const CallLog = require('../../../models/callLog.model');
const User = require('../../../models/user.model');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);

const ensureObjectId = (value) => {
  if (!isValidObjectId(value)) {
    throw new Error(`Invalid ObjectId: ${value}`);
  }
  return new mongoose.Types.ObjectId(value);
};

const getOrCreateConversation = async (userId, participantId) => {
  const userObjId = ensureObjectId(userId);
  const participantObjId = ensureObjectId(participantId);

  const existing = await ChatConversation.findOne({
    'participants.user': { $all: [userObjId, participantObjId] }
  });

  if (existing) return existing;

  // Fetch users from database (may not exist for test admin)
  const [user, participant] = await Promise.all([
    User.findById(userId).lean(),
    User.findById(participantId).lean()
  ]);

  // Use ObjectId directly if user not found in DB (e.g., test admin)
  const conversation = new ChatConversation({
    participants: [
      { user: user?._id || userObjId, role: user?.role || 'user', lastReadAt: new Date() },
      { user: participant?._id || participantObjId, role: participant?.role || 'admin', lastReadAt: null }
    ]
  });
  await conversation.save();
  return conversation;
};

const listConversations = async (userId) => {
  const conversations = await ChatConversation.find({
    'participants.user': ensureObjectId(userId)
  })
    .sort({ updatedAt: -1 })
    .lean();

  const userIds = new Set();
  conversations.forEach((conv) => conv.participants.forEach((p) => userIds.add(String(p.user))));
  const users = await User.find({ _id: { $in: Array.from(userIds) } })
    .select('_id firstName lastName email phone role displayName')
    .lean();
  const userMap = users.reduce((acc, u) => {
    acc[String(u._id)] = u;
    return acc;
  }, {});

  const enriched = await Promise.all(
    conversations.map(async (conv) => {
      const other = conv.participants.find((p) => String(p.user) !== String(userId));
      const self = conv.participants.find((p) => String(p.user) === String(userId));
      const otherUser = other ? userMap[String(other.user)] : null;

      const unreadQuery = { conversation: conv._id };
      if (self?.lastReadAt) {
        unreadQuery.createdAt = { $gt: self.lastReadAt };
      }
      if (other) {
        unreadQuery.sender = other.user;
      }
      const unreadCount = await ChatMessage.countDocuments(unreadQuery);

      return {
        id: String(conv._id),
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount,
        otherParticipant: otherUser
          ? {
              id: String(otherUser._id),
              name:
                otherUser.displayName ||
                `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() ||
                otherUser.email,
              email: otherUser.email,
              phone: otherUser.phone,
              role: otherUser.role
            }
          : null,
        participantIds: conv.participants.map((p) => String(p.user)),
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      };
    })
  );

  return enriched;
};

const getMessages = async (conversationId, { limit = 50, offset = 0 } = {}) => {
  const messages = await ChatMessage.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean();

  const total = await ChatMessage.countDocuments({ conversation: conversationId });

  return {
    messages: messages
      .map((m) => ({
        id: String(m._id),
        conversationId: String(m.conversation),
        senderId: String(m.sender),
        senderRole: m.senderRole,
        content: m.content,
        timestamp: m.createdAt,
        read: Array.isArray(m.readBy) && m.readBy.length > 0
      }))
      .reverse(),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + messages.length < total
    }
  };
};

const sendMessage = async (conversationId, senderId, { content, senderRole = 'user' }) => {
  const message = new ChatMessage({
    conversation: conversationId,
    sender: senderId,
    senderRole,
    content,
    readBy: [ensureObjectId(senderId)]
  });
  await message.save();

  await ChatConversation.findByIdAndUpdate(conversationId, {
    lastMessage: content,
    lastMessageAt: message.createdAt,
    updatedAt: new Date()
  });

  return {
    id: String(message._id),
    conversationId: String(message.conversation),
    senderId: String(message.sender),
    senderRole: message.senderRole,
    content: message.content,
    timestamp: message.createdAt,
    read: false
  };
};

const markConversationRead = async (conversationId, userId) => {
  await ChatConversation.updateOne(
    { _id: conversationId, 'participants.user': ensureObjectId(userId) },
    { $set: { 'participants.$.lastReadAt': new Date() } }
  );
  await ChatMessage.updateMany(
    { conversation: conversationId, readBy: { $ne: ensureObjectId(userId) } },
    { $addToSet: { readBy: ensureObjectId(userId) } }
  );
};

const createCallLog = async ({ callerId, calleeId, conversationId, startedAt, endedAt, durationSeconds, notes }) => {
  const effectiveDuration = durationSeconds || (endedAt && startedAt ? Math.max(0, Math.round((endedAt - startedAt) / 1000)) : 0);

  const log = new CallLog({
    caller: ensureObjectId(callerId),
    callee: ensureObjectId(calleeId),
    conversation: conversationId ? ensureObjectId(conversationId) : undefined,
    startedAt,
    endedAt,
    durationSeconds: effectiveDuration,
    notes,
    createdBy: ensureObjectId(callerId)
  });

  await log.save();
  return log.toObject();
};

module.exports = {
  getOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  createCallLog
};
