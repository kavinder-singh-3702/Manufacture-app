const createError = require('http-errors');
const {
  getOrCreateConversation,
  listConversations,
  getMessages,
  sendMessage,
  markConversationRead,
  createCallLog
} = require('../services/chat.service');
const { uploadUserDocument } = require('../../../services/storage.service');
const { isAdminRole } = require('../../../utils/roles');

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
    const { participantId, productId } = req.body;
    if (participantId === req.user.id) {
      return next(createError(400, 'Cannot start a conversation with yourself'));
    }

    // Mirror of the frontend `isChatAllowed(product)` gate. Without this a
    // hand-crafted POST /chat/conversations can bypass a seller's
    // contactPreferences.allowChat = false. When productId is supplied we
    // check the product's contactPreferences; when absent we trust the
    // recipient's user-level preference (defaults to allowed).
    if (productId) {
      // Lazy require so the chat module doesn't have to declare a hard
      // dependency on the product module at import time.
      let Product;
      try {
        Product = require('../../../models/product.model');
      } catch (err) {
        // Product model missing — treat as no constraint rather than fail open.
        Product = null;
      }
      if (Product) {
        const product = await Product.findById(productId)
          .select('contactPreferences createdBy')
          .lean();
        if (product && product.contactPreferences && product.contactPreferences.allowChat === false) {
          return next(createError(403, 'Messaging is disabled for this product'));
        }
      }
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
    const { content, contextRef } = req.body;
    const senderRole = isAdminRole(req.user.role) ? 'admin' : 'user';

    const message = await sendMessage(conversationId, req.user.id, {
      content,
      senderRole,
      contextRef,
    });
    return res.status(201).json({ message });
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/chat/conversations/:conversationId/images
 * Uploads an image to S3 and creates a chat message with the URL attached.
 * Body: { base64, fileName, mimeType, caption? }
 */
const sendImageController = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { base64, fileName, mimeType, caption } = req.body || {};

    if (!base64) {
      return next(createError(400, 'Image data is required'));
    }
    if (typeof mimeType !== 'string' || !mimeType.startsWith('image/')) {
      return next(createError(400, 'Only image files are supported here'));
    }

    const uploaded = await uploadUserDocument({
      userId: req.user.id,
      purpose: 'chat',
      fileName: fileName || `image-${Date.now()}.jpg`,
      mimeType,
      base64,
    });

    const senderRole = isAdminRole(req.user.role) ? 'admin' : 'user';
    const message = await sendMessage(conversationId, req.user.id, {
      // ChatMessage requires non-empty content. Use the caption when supplied,
      // otherwise the conventional "Sent a photo" string — picked because it
      // reads cleanly in inbox previews (the previous "📷 Photo" leaked into
      // ChatConversation.lastMessage and looked like a placeholder).
      content: (typeof caption === 'string' && caption.trim()) || 'Sent a photo',
      senderRole,
      attachments: [
        {
          url: uploaded.url,
          type: uploaded.contentType || mimeType,
          name: uploaded.fileName,
          size: uploaded.size,
        },
      ],
    });

    return res.status(201).json({ message });
  } catch (error) {
    return next(error);
  }
};

const markReadController = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    // Forward callerRole so the service can take the admin-fallback path
    // when an admin marks read on a legacy conversation that was created
    // with the stub admin id (see markConversationRead docs).
    await markConversationRead(conversationId, req.user.id, { callerRole: req.user.role });
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
  sendImageController,
  markReadController,
  createCallLogController
};
