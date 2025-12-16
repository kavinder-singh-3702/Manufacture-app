const createError = require('http-errors');
const {
  getOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  createCallLog
} = require('../services/chat.service');

const listConversationsController = async (req, res, next) => {
  try {
    console.log('[Chat] listConversations called with user:', req.user);
    const conversations = await listConversations(req.user.id);
    return res.json({ conversations });
  } catch (error) {
    console.error('[Chat] listConversations error:', error.message);
    return next(error);
  }
};

const createConversationController = async (req, res, next) => {
  try {
    const { participantId } = req.body;
    if (participantId === req.user.id) {
      return next(createError(400, 'Cannot start a conversation with yourself'));
    }

    const conversation = await getOrCreateConversation(req.user.id, participantId);
    return res.status(201).json({ conversationId: conversation._id });
  } catch (error) {
    return next(error);
  }
};

const getMessagesController = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { limit, offset } = req.query;
    const result = await getMessages(conversationId, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const sendMessageController = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content } = req.body;
    const senderRole = req.user.role === 'admin' ? 'admin' : 'user';

    const message = await sendMessage(conversationId, req.user.id, { content, senderRole });
    return res.status(201).json({ message });
  } catch (error) {
    return next(error);
  }
};

const markReadController = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    await markConversationRead(conversationId, req.user.id);
    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
};

const createCallLogController = async (req, res, next) => {
  try {
    const { calleeId, conversationId, startedAt, endedAt, durationSeconds, notes } = req.body;
    const log = await createCallLog({
      callerId: req.user.id,
      calleeId,
      conversationId,
      startedAt: startedAt || new Date(),
      endedAt,
      durationSeconds,
      notes
    });
    return res.status(201).json({ callLog: log });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  listConversationsController,
  createConversationController,
  getMessagesController,
  sendMessageController,
  markReadController,
  createCallLogController
};
