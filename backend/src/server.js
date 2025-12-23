const http = require('http');
const app = require('./app');
const config = require('./config/env');
const { connectDatabase, disconnectDatabase } = require('./config/database');
const createLogger = require('./utils/logger');
const { initSocket } = require('./socket');

const logger = createLogger('server');
let server;

const start = async () => {
  try {
    await connectDatabase(config.mongoUri);
    server = http.createServer(app);
    initSocket(server);
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server', error.message);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.warn(`Received ${signal}. Closing server...`);
  if (server) {
    server.close();
  }
  await disconnectDatabase();
  process.exit(0);
};

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

start();
