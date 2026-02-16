const dotenv = require('dotenv');

// Load environment variables from .env if present
dotenv.config();

const config = {
  node: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/manufacture',
  jwtSecret: process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  sessionSecret: process.env.SESSION_SECRET || 'manufacture-session-secret',
  sessionName: process.env.SESSION_NAME || 'mf.sid',
  sessionCookieMaxAge: Number(process.env.SESSION_COOKIE_MAX_AGE || 1000 * 60 * 60 * 24 * 7),
  signupOtp: process.env.SIGNUP_TEST_OTP || '1234',
  signupOtpTtlMs: Number(process.env.SIGNUP_OTP_TTL_MS || 5 * 60 * 1000),
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
  emailFrom: process.env.EMAIL_FROM || 'Manufacture App <noreply@manufacture-app.com>',
  appName: process.env.APP_NAME || 'Manufacture App',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  notificationsPushEnabled: process.env.NOTIFICATIONS_PUSH_ENABLED !== 'false',
  notificationsDispatcherEnabled: process.env.NOTIFICATIONS_DISPATCHER_ENABLED !== 'false',
  notificationsDispatchIntervalMs: Number(process.env.NOTIFICATIONS_DISPATCH_INTERVAL_MS || 10000),
  notificationsDispatchBatchSize: Number(process.env.NOTIFICATIONS_DISPATCH_BATCH_SIZE || 30),
  notificationRetryBaseMs: Number(process.env.NOTIFICATION_RETRY_BASE_MS || 30000),
  notificationRetryMaxMs: Number(process.env.NOTIFICATION_RETRY_MAX_MS || 30 * 60 * 1000),
  expoPushAccessToken: process.env.EXPO_PUSH_ACCESS_TOKEN
};

module.exports = Object.freeze(config);
