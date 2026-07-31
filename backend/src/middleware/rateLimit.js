const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const config = require('../config/env');
const { getRedisClient } = require('../config/redis');

// Password reset is the only unauthenticated pair of endpoints in the app
// with no other throttle in front of it (no rate limiting exists anywhere
// else in the backend or in nginx). /password/reset in particular is the
// brute-force surface for the 6-digit reset code — the per-user attempt
// counter in password-reset.service.js stops guessing against ONE account,
// but does nothing against an attacker spraying codes across many accounts
// from one IP. These limiters cover that gap.
//
// Backed by the same Redis client the session store uses (src/config/redis
// .js), so limits are shared across the PM2 cluster's workers. When Redis
// isn't configured (local dev, tests) express-rate-limit falls back to its
// built-in in-memory store automatically — `store: undefined` is a valid,
// documented no-op here.

// getRedisClient() returns a client that's constructed but not yet
// connected — src/server.js requires this route chain (and therefore
// constructs these limiters) at the top of the file, before its startup
// sequence calls connectRedis(). Without this wait, RedisStore.init()'s
// SCRIPT LOAD races that connection and fails with ClientClosedError on
// every restart (harmless — rate-limit-redis retries and self-heals on
// the first real request — but it floods the logs). Racing 'error' keeps
// a genuinely dead Redis from hanging a request forever.
//
// Hand-rolled instead of Promise.race(once(client, 'ready'), once(client,
// 'error')) — events.once() leaves the losing side's listener attached
// forever, and this runs on every script-load at startup (and again if
// the client ever briefly drops), so that race would leak a listener
// onto the long-lived shared client each time.
const waitUntilReady = (client) => {
  if (client.isReady) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const onReady = () => {
      client.removeListener('error', onError);
      resolve();
    };
    const onError = (error) => {
      client.removeListener('ready', onReady);
      reject(error);
    };
    client.once('ready', onReady);
    client.once('error', onError);
  });
};

const buildRedisStore = (prefix) => {
  const client = getRedisClient();
  if (!client) {
    return undefined;
  }
  return new RedisStore({
    prefix,
    sendCommand: async (...args) => {
      await waitUntilReady(client);
      return client.sendCommand(args);
    },
  });
};

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');

// Limits requests per source IP, regardless of which email is targeted.
const passwordResetForgotIpLimiter = rateLimit({
  windowMs: config.passwordResetForgotRateLimitWindowMs,
  limit: config.passwordResetForgotRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRedisStore('rl:pwd-forgot-ip:'),
  message: { message: 'Too many password reset requests from this device. Please try again later.' }
});

// Limits requests per targeted email, regardless of source IP — stops an
// attacker from rotating IPs to keep re-triggering resets/emails at one
// victim account. Falls back to per-IP when no email is present so the
// bucket is never shared across unrelated requests.
const passwordResetForgotEmailLimiter = rateLimit({
  windowMs: config.passwordResetForgotRateLimitWindowMs,
  limit: config.passwordResetForgotRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRedisStore('rl:pwd-forgot-email:'),
  keyGenerator: (req) => {
    const email = normalizeEmail(req.body?.email);
    return email || ipKeyGenerator(req.ip);
  },
  message: { message: 'Too many password reset requests for this account. Please try again later.' }
});

const passwordResetVerifyLimiter = rateLimit({
  windowMs: config.passwordResetVerifyRateLimitWindowMs,
  limit: config.passwordResetVerifyRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  store: buildRedisStore('rl:pwd-reset-ip:'),
  message: { message: 'Too many password reset attempts from this device. Please try again later.' }
});

module.exports = {
  passwordResetForgotIpLimiter,
  passwordResetForgotEmailLimiter,
  passwordResetVerifyLimiter
};
