const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const { connectRedis, disconnectRedis } = require('./config/redis');
const createLogger = require('./utils/logger');
const { initSocket } = require('./socket');
const { startNotificationDispatcher, stopNotificationDispatcher } = require('./modules/notifications/services/notificationDispatcher.service');
const { assertStorageConfig } = require('./config/startupValidation');

const logger = createLogger('server');
let server;
let isDispatcherLeader = false;

const shouldRunNotificationDispatcher = () => {
  if (!config.notificationsDispatcherEnabled) {
    return false;
  }

  const instanceId = process.env.NODE_APP_INSTANCE;
  if (instanceId === undefined) {
    return true;
  }

  return instanceId === '0';
};

const start = async () => {
  try {
    assertStorageConfig(config);
    await connectRedis();
    await connectDatabase(config.mongoUri);
    server = http.createServer(app);
    await initSocket(server);
    isDispatcherLeader = shouldRunNotificationDispatcher();
    if (isDispatcherLeader) {
      startNotificationDispatcher();
      logger.info('Notification dispatcher started on this process');
    } else {
      logger.info(`Notification dispatcher disabled on worker instance ${process.env.NODE_APP_INSTANCE}`);
    }
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    const codePrefix = typeof error?.code === 'string' && error.code ? `[${error.code}] ` : '';
    logger.error('Failed to start server', `${codePrefix}${error.message}`);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.warn(`Received ${signal}. Closing server...`);
  if (server) {
    server.close();
  }
  if (isDispatcherLeader) {
    stopNotificationDispatcher();
  }
  await disconnectRedis();
  await disconnectDatabase();
  process.exit(0);
};

if (require.main === module) {
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => shutdown(signal));
  });
  start();
}

module.exports = {
  start,
  shutdown
};
