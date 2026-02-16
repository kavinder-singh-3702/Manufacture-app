const mongoose = require('mongoose');
const ChatConversation = require('../../../models/chatConversation.model');
const ChatMessage = require('../../../models/chatMessage.model');
const CallLog = require('../../../models/callLog.model');
const ServiceRequest = require('../../../models/serviceRequest.model');
const User = require('../../../models/user.model');
const { emitToUser } = require('../../../socket');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value) && String(new mongoose.Types.ObjectId(value)) === String(value);

const ensureObjectId = (value) => {
  if (!isValidObjectId(value)) {
    throw new Error(`Invalid ObjectId: ${value}`);
  }
  return new mongoose.Types.ObjectId(value);
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resolveConversationSort = (value) => {
  switch (value) {
    case 'updatedAt:asc':
      return { updatedAt: 1 };
    case 'lastMessageAt:asc':
      return { lastMessageAt: 1 };
    case 'lastMessageAt:desc':
      return { lastMessageAt: -1 };
    case 'updatedAt:desc':
    default:
      return { updatedAt: -1 };
  }
};

const resolveCallLogSort = (value) => {
  switch (value) {
    case 'startedAt:asc':
      return { startedAt: 1 };
    case 'duration:asc':
      return { durationSeconds: 1, startedAt: -1 };
    case 'duration:desc':
      return { durationSeconds: -1, startedAt: -1 };
    case 'startedAt:desc':
    default:
      return { startedAt: -1 };
  }
};

const getConversationSummaryForUser = async (conversationId, userId) => {
  const conversation = await ChatConversation.findById(conversationId).lean();
  if (!conversation) return null;

  const userIdString = String(userId);
  const other = conversation.participants.find((p) => String(p.user) !== userIdString);
  const self = conversation.participants.find((p) => String(p.user) === userIdString);

  const otherUser = other
    ? await User.findById(other.user)
        .select('_id firstName lastName email phone role displayName')
        .lean()
    : null;

  const unreadQuery = { conversation: conversation._id };
  if (self?.lastReadAt) {
    unreadQuery.createdAt = { $gt: self.lastReadAt };
  }
  if (other) {
    unreadQuery.sender = other.user;
  }

  const unreadCount = await ChatMessage.countDocuments(unreadQuery);

  return {
    id: String(conversation._id),
    lastMessage: conversation.lastMessage,
    lastMessageAt: conversation.lastMessageAt,
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
    participantIds: conversation.participants.map((p) => String(p.user)),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt
  };
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

  const payload = {
    id: String(message._id),
    conversationId: String(message.conversation),
    senderId: String(message.sender),
    senderRole: message.senderRole,
    content: message.content,
    timestamp: message.createdAt,
    read: false
  };

  try {
    const conversation = await ChatConversation.findById(conversationId).lean();
    if (conversation) {
      await Promise.all(
        conversation.participants.map(async (participant) => {
          const summary = await getConversationSummaryForUser(conversationId, participant.user);
          emitToUser(String(participant.user), 'chat:message', {
            conversationId: String(conversationId),
            message: payload,
            conversation: summary
          });
        })
      );
    }
  } catch (error) {
    console.warn('[Chat] Failed to emit socket message', error.message);
  }

  return payload;
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

  try {
    const summary = await getConversationSummaryForUser(conversationId, userId);
    if (summary) {
      emitToUser(String(userId), 'chat:read', {
        conversationId: String(conversationId),
        conversation: summary,
        readerId: String(userId)
      });
    }
  } catch (error) {
    console.warn('[Chat] Failed to emit read event', error.message);
  }
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

const listConversationsAdmin = async ({
  search,
  userId,
  companyId,
  limit = 30,
  offset = 0,
  sort = 'updatedAt:desc'
} = {}) => {
  const safeLimit = clamp(parseNumber(limit, 30), 1, 100);
  const safeOffset = Math.max(parseNumber(offset, 0), 0);
  const filter = {};

  let scopedUserIds = null;

  if (search) {
    const regex = new RegExp(search, 'i');
    const matchedUsers = await User.find({
      $or: [
        { displayName: regex },
        { email: regex },
        { phone: regex }
      ]
    }).select('_id').lean();
    scopedUserIds = new Set(matchedUsers.map((entry) => String(entry._id)));
  }

  if (companyId && isValidObjectId(companyId)) {
    const companyScopedUsers = await User.find({
      $or: [{ activeCompany: ensureObjectId(companyId) }, { companies: ensureObjectId(companyId) }]
    })
      .select('_id')
      .lean();

    const companyUserSet = new Set(companyScopedUsers.map((entry) => String(entry._id)));
    if (scopedUserIds === null) {
      scopedUserIds = companyUserSet;
    } else {
      scopedUserIds = new Set(Array.from(scopedUserIds).filter((id) => companyUserSet.has(id)));
    }
  }

  if (userId && isValidObjectId(userId)) {
    const explicitUserId = String(userId);
    if (scopedUserIds === null) {
      scopedUserIds = new Set([explicitUserId]);
    } else {
      scopedUserIds = new Set(Array.from(scopedUserIds).filter((id) => id === explicitUserId));
    }
  }

  if (scopedUserIds && !scopedUserIds.size) {
    return {
      conversations: [],
      pagination: {
        total: 0,
        limit: safeLimit,
        offset: safeOffset,
        hasMore: false
      }
    };
  }

  if (scopedUserIds) {
    filter['participants.user'] = { $in: Array.from(scopedUserIds).map((value) => ensureObjectId(value)) };
  }

  const [conversations, total] = await Promise.all([
    ChatConversation.find(filter)
      .sort(resolveConversationSort(sort))
      .skip(safeOffset)
      .limit(safeLimit)
      .lean(),
    ChatConversation.countDocuments(filter)
  ]);

  const participantUserIds = new Set();
  conversations.forEach((conversation) => {
    (conversation.participants || []).forEach((participant) => {
      participantUserIds.add(String(participant.user));
    });
  });

  const users = await User.find({ _id: { $in: Array.from(participantUserIds).map((value) => ensureObjectId(value)) } })
    .select('_id displayName firstName lastName email phone role activeCompany')
    .lean();
  const userMap = users.reduce((acc, user) => {
    acc[String(user._id)] = user;
    return acc;
  }, {});

  const userParticipants = users
    .filter((entry) => entry.role === 'user')
    .map((entry) => ensureObjectId(entry._id));

  const recentServiceRequests = await ServiceRequest.find({
    createdBy: { $in: userParticipants },
    deletedAt: { $exists: false }
  })
    .sort({ updatedAt: -1 })
    .select('_id createdBy title status priority updatedAt')
    .lean();

  const latestServiceRequestByUser = new Map();
  recentServiceRequests.forEach((entry) => {
    const createdBy = String(entry.createdBy);
    if (!latestServiceRequestByUser.has(createdBy)) {
      latestServiceRequestByUser.set(createdBy, entry);
    }
  });

  const conversationsWithUnread = await Promise.all(
    conversations.map(async (conversation) => {
      const adminParticipant =
        conversation.participants.find((participant) => participant.role === 'admin' || participant.role === 'support') ||
        conversation.participants[0];
      const otherParticipant =
        conversation.participants.find((participant) => String(participant.user) !== String(adminParticipant.user)) ||
        conversation.participants[0];

      const unreadQuery = {
        conversation: conversation._id,
        sender: { $ne: adminParticipant.user }
      };
      if (adminParticipant.lastReadAt) {
        unreadQuery.createdAt = { $gt: adminParticipant.lastReadAt };
      }

      const unreadCount = await ChatMessage.countDocuments(unreadQuery);
      const otherUser = userMap[String(otherParticipant.user)];
      const linkedRequest = latestServiceRequestByUser.get(String(otherParticipant.user));

      return {
        id: String(conversation._id),
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt,
        unreadCount,
        participantIds: conversation.participants.map((participant) => String(participant.user)),
        otherParticipant: otherUser
          ? {
            id: String(otherUser._id),
            name:
              otherUser.displayName ||
              `${otherUser.firstName || ''} ${otherUser.lastName || ''}`.trim() ||
              otherUser.email,
            email: otherUser.email,
            phone: otherUser.phone,
            role: otherUser.role,
            activeCompany: otherUser.activeCompany?.toString?.() || otherUser.activeCompany
          }
          : null,
        linkedServiceRequest: linkedRequest
          ? {
            id: String(linkedRequest._id),
            title: linkedRequest.title,
            status: linkedRequest.status,
            priority: linkedRequest.priority,
            updatedAt: linkedRequest.updatedAt
          }
          : null,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt
      };
    })
  );

  return {
    conversations: conversationsWithUnread,
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + conversations.length < total
    }
  };
};

const listCallLogsAdmin = async ({
  userId,
  companyId,
  from,
  to,
  minDuration,
  maxDuration,
  limit = 30,
  offset = 0,
  sort = 'startedAt:desc'
} = {}) => {
  const safeLimit = clamp(parseNumber(limit, 30), 1, 100);
  const safeOffset = Math.max(parseNumber(offset, 0), 0);
  const query = {};

  if (userId && isValidObjectId(userId)) {
    query.$or = [{ caller: ensureObjectId(userId) }, { callee: ensureObjectId(userId) }];
  }

  if (companyId && isValidObjectId(companyId)) {
    const companyUserIds = await User.find({
      $or: [{ activeCompany: ensureObjectId(companyId) }, { companies: ensureObjectId(companyId) }]
    })
      .select('_id')
      .lean();

    const userIds = companyUserIds.map((entry) => entry._id);
    const companyClause = { $or: [{ caller: { $in: userIds } }, { callee: { $in: userIds } }] };
    if (query.$and) {
      query.$and.push(companyClause);
    } else if (query.$or) {
      query.$and = [{ $or: query.$or }, companyClause];
      delete query.$or;
    } else {
      query.$or = companyClause.$or;
    }
  }

  if (from || to) {
    query.startedAt = {};
    if (from) {
      query.startedAt.$gte = new Date(from);
    }
    if (to) {
      query.startedAt.$lte = new Date(to);
    }
  }

  if (minDuration !== undefined || maxDuration !== undefined) {
    query.durationSeconds = {};
    if (minDuration !== undefined) {
      query.durationSeconds.$gte = Number(minDuration);
    }
    if (maxDuration !== undefined) {
      query.durationSeconds.$lte = Number(maxDuration);
    }
  }

  const [callLogs, total] = await Promise.all([
    CallLog.find(query)
      .sort(resolveCallLogSort(sort))
      .skip(safeOffset)
      .limit(safeLimit)
      .populate('caller', 'displayName email role')
      .populate('callee', 'displayName email role')
      .populate('conversation', 'lastMessage lastMessageAt updatedAt')
      .lean(),
    CallLog.countDocuments(query)
  ]);

  return {
    callLogs: callLogs.map((entry) => ({
      id: String(entry._id),
      conversationId: entry.conversation?._id?.toString?.() || entry.conversation?.toString?.() || null,
      caller: entry.caller
        ? {
          id: entry.caller._id?.toString?.() || entry.caller,
          displayName: entry.caller.displayName,
          email: entry.caller.email,
          role: entry.caller.role
        }
        : null,
      callee: entry.callee
        ? {
          id: entry.callee._id?.toString?.() || entry.callee,
          displayName: entry.callee.displayName,
          email: entry.callee.email,
          role: entry.callee.role
        }
        : null,
      startedAt: entry.startedAt,
      endedAt: entry.endedAt,
      durationSeconds: entry.durationSeconds,
      notes: entry.notes,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt
    })),
    pagination: {
      total,
      limit: safeLimit,
      offset: safeOffset,
      hasMore: safeOffset + callLogs.length < total
    }
  };
};

module.exports = {
  getOrCreateConversation,
  listConversations,
  listConversationsAdmin,
  listCallLogsAdmin,
  getMessages,
  sendMessage,
  markConversationRead,
  createCallLog
};
