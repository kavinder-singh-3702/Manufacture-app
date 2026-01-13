const { Server } = require('socket.io');
const { verifyToken } = require('../utils/token');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });

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
    socket.on('disconnect', () => {});
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
