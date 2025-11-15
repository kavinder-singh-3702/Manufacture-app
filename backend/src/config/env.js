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
  signupOtpTtlMs: Number(process.env.SIGNUP_OTP_TTL_MS || 5 * 60 * 1000)
};

module.exports = Object.freeze(config);
