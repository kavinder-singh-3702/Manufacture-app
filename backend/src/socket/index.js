const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const config = require('../config/env');
const { connectSocketRedis } = require('../config/redis');
const { verifyToken } = require('../utils/token');
const { isAdminRole } = require('../utils/roles');
const ChatConversation = require('../models/chatConversation.model');
const createLogger = require('../utils/logger');

const logger = createLogger('socket');

let io;

// Typing indicator is ephemeral (no DB write, nothing persisted) — this is
// only a per-socket rate limit so a client emitting on every keystroke can't
// force a participants lookup on every single one. Only the "start typing"
// signal is throttled; "stopped typing" is naturally infrequent (fires once
// per pause/blur/send, not per keystroke) and always passes through so the
// indicator doesn't linger.
//
// A direct, minimal model query (rather than reusing chat.service.js's
// assertConversationAccess) both avoids a circular require — chat.service.js
// itself requires this module for emitToUser — and skips re-running an
// authorization stack built for HTTP's 404-vs-403 semantics on every
// keystroke.
const TYPING_MIN_INTERVAL_MS = 1500;

const initSocket = async (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  if (config.redisUrl) {
    const { pubClient, subClient } = await connectSocketRedis();
    if (pubClient && subClient) {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter enabled');
    }
  }

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    try {
      const payload = verifyToken(token);
      socket.user = { id: payload.sub, role: payload.role };
      socket.join(`user:${payload.sub}`);
      return next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const lastTypingEmitAt = new Map(); // conversationId -> timestamp, per-socket

    socket.on('chat:typing', async (payload) => {
      const conversationId = typeof payload?.conversationId === 'string' ? payload.conversationId : null;
      if (!conversationId) return;

      const isTyping = Boolean(payload?.isTyping);
      if (isTyping) {
        const now = Date.now();
        const last = lastTypingEmitAt.get(conversationId) || 0;
        if (now - last < TYPING_MIN_INTERVAL_MS) return;
        lastTypingEmitAt.set(conversationId, now);
      } else {
        lastTypingEmitAt.delete(conversationId);
      }

      try {
        const conversation = await ChatConversation.findById(conversationId).select('participants').lean();
        if (!conversation) return;

        const isParticipant = conversation.participants.some((p) => String(p.user) === String(socket.user.id));
        if (!isParticipant && !isAdminRole(socket.user.role)) return;

        conversation.participants
          .filter((p) => String(p.user) !== String(socket.user.id))
          .forEach((p) => {
            io.to(`user:${p.user}`).emit('chat:typing', {
              conversationId,
              userId: socket.user.id,
              isTyping
            });
          });
      } catch (error) {
        logger.warn(`chat:typing failed: ${error.message}`);
      }
    });

    socket.on('disconnect', () => {
      lastTypingEmitAt.clear();
    });
  });

  return io;
};

const emitToUser = (userId, event, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
};

const emitToUsers = (userIds, event, payloadByUser = {}) => {
  if (!io || !Array.isArray(userIds)) return;
  userIds.forEach((userId) => {
    if (!userId) return;
    const payload = payloadByUser[userId] ?? payloadByUser.default ?? payloadByUser;
    io.to(`user:${userId}`).emit(event, payload);
  });
};

module.exports = {
  initSocket,
  emitToUser,
  emitToUsers
};
