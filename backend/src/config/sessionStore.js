const { RedisStore } = require('connect-redis');
const config = require('./env');
const { getRedisClient } = require('./redis');

let sessionStore;

const getSessionStore = () => {
  if (sessionStore) {
    return sessionStore;
  }

  const redisClient = getRedisClient();
  if (!redisClient) {
    return null;
  }

  sessionStore = new RedisStore({
    client: redisClient,
    prefix: 'mf:sess:',
    ttl: Math.max(Math.floor(config.sessionCookieMaxAge / 1000), 60),
  });

  return sessionStore;
};

module.exports = {
  getSessionStore,
};
