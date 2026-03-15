const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config();

const parseBoolean = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  return fallback;
};

const normalizeSameSite = (value, fallback = 'lax') => {
  if (!value) return fallback;
  const normalized = String(value).trim().toLowerCase();
  if (['lax', 'strict', 'none'].includes(normalized)) {
    return normalized;
  }
  return fallback;
};

const parseTrustProxy = (value) => {
  if (value === undefined || value === null || value === '') {
    return false;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off'].includes(normalized)) return false;

  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  return value;
};

const defaultSessionCookieSecure = process.env.NODE_ENV === 'production';

const config = {
  node: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/manufacture',
  redisUrl: process.env.REDIS_URL,
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  sessionSecret: process.env.SESSION_SECRET || 'manufacture-session-secret',
  sessionName: process.env.SESSION_NAME || 'mf.sid',
  sessionCookieMaxAge: Number(process.env.SESSION_COOKIE_MAX_AGE || 1000 * 60 * 60 * 24 * 7),
  sessionCookieSecure: parseBoolean(process.env.SESSION_COOKIE_SECURE, defaultSessionCookieSecure),
  sessionCookieSameSite: normalizeSameSite(process.env.SESSION_COOKIE_SAMESITE, 'lax'),
  sessionCookieDomain: process.env.SESSION_COOKIE_DOMAIN || undefined,
  signupOtp: process.env.SIGNUP_TEST_OTP || undefined,
  signupTestOtp: process.env.SIGNUP_TEST_OTP || undefined,
  signupOtpTtlMs: Number(process.env.SIGNUP_OTP_TTL_MS || 5 * 60 * 1000),
  signupOtpResendCooldownMs: Number(process.env.SIGNUP_OTP_RESEND_COOLDOWN_MS || 30 * 1000),
  signupOtpMaxVerifyAttempts: Number(process.env.SIGNUP_OTP_MAX_VERIFY_ATTEMPTS || 5),
  signupOtpMaxResends: Number(process.env.SIGNUP_OTP_MAX_RESENDS || 5),
  adminInviteToken: process.env.ADMIN_INVITE_TOKEN,
  passwordResetTokenTtlMs: Number(process.env.PASSWORD_RESET_TTL_MS || 15 * 60 * 1000),
  awsS3Bucket: process.env.AWS_S3_BUCKET,
  awsS3Region: process.env.AWS_S3_REGION,
  awsS3AccessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  awsS3SecretAccessKey: process.env.AWS_S3_SECRET_ACCESS_KEY,
  awsS3UploadsFolder: process.env.AWS_S3_UPLOADS_FOLDER || 'uploads',
  // Email configuration
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT) || 587,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpPoolEnabled: process.env.SMTP_POOL_ENABLED !== 'false',
  smtpPoolMaxConnections: Number(process.env.SMTP_POOL_MAX_CONNECTIONS || 3),
  smtpPoolMaxMessages: Number(process.env.SMTP_POOL_MAX_MESSAGES || 100),
  smtpConnectionTimeoutMs: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10000),
  smtpSocketTimeoutMs: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 20000),
  smtpGreetingTimeoutMs: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10000),
  emailFrom: process.env.EMAIL_FROM || 'ARVANN <noreply@arvann.com>',
  appName: process.env.APP_NAME || 'ARVANN',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  notificationsEmailEnabled: process.env.NOTIFICATIONS_EMAIL_ENABLED !== 'false',
  notificationsPushEnabled: process.env.NOTIFICATIONS_PUSH_ENABLED !== 'false',
  notificationsDispatcherEnabled: process.env.NOTIFICATIONS_DISPATCHER_ENABLED !== 'false',
  notificationsDispatchIntervalMs: Number(process.env.NOTIFICATIONS_DISPATCH_INTERVAL_MS || 10000),
  notificationsDispatchBatchSize: Number(process.env.NOTIFICATIONS_DISPATCH_BATCH_SIZE || 30),
  notificationRetryBaseMs: Number(process.env.NOTIFICATION_RETRY_BASE_MS || 30000),
  notificationRetryMaxMs: Number(process.env.NOTIFICATION_RETRY_MAX_MS || 30 * 60 * 1000),
  expoPushAccessToken: process.env.EXPO_PUSH_ACCESS_TOKEN
};

module.exports = Object.freeze(config);
