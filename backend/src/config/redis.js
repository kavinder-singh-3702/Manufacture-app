const { createClient } = require('redis');
const config = require('./env');
const createLogger = require('../utils/logger');

const logger = createLogger('redis');

let redisClient = null;
let pubClient = null;
let subClient = null;

const createNamedClient = (name) => {
  const client = createClient({ url: config.redisUrl });
  client.on('error', (error) => {
    logger.error(`${name} client error`, error?.message || error);
  });
  return client;
};

const getRedisClient = () => {
  if (!config.redisUrl) {
    return null;
  }

  if (!redisClient) {
    redisClient = createNamedClient('main');
  }

  return redisClient;
};

const connectRedis = async () => {
  if (!config.redisUrl) {
    if (config.node === 'production') {
      throw new Error('REDIS_URL is required in production');
    }
    logger.warn('REDIS_URL is not configured; Redis-dependent features use in-memory fallbacks.');
    return null;
  }

  const client = getRedisClient();
  if (!client.isOpen) {
    await client.connect();
    logger.info('Connected to Redis');
  }
  return client;
};

const connectSocketRedis = async () => {
  if (!config.redisUrl) {
    return { pubClient: null, subClient: null };
  }

  if (!pubClient) {
    pubClient = createNamedClient('socket-pub');
  }

  if (!subClient) {
    subClient = pubClient.duplicate();
    subClient.on('error', (error) => {
      logger.error('socket-sub client error', error?.message || error);
    });
  }

  if (!pubClient.isOpen) {
    await pubClient.connect();
    logger.info('Socket Redis pub client connected');
  }

  if (!subClient.isOpen) {
    await subClient.connect();
    logger.info('Socket Redis sub client connected');
  }

  return { pubClient, subClient };
};

const disconnectRedis = async () => {
  const clients = [subClient, pubClient, redisClient].filter(Boolean);
  for (const client of clients) {
    if (client.isOpen) {
      await client.quit();
    }
  }
  subClient = null;
  pubClient = null;
  redisClient = null;
};

module.exports = {
  getRedisClient,
  connectRedis,
  connectSocketRedis,
  disconnectRedis,
};
