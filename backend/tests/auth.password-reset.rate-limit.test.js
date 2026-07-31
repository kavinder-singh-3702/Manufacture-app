// Dedicated suite for the Redis/in-memory rate limiters added in
// src/middleware/rateLimit.js. Kept separate from auth.password-reset.test.js
// so the tiny per-suite maxes here (needed to trip the limiter quickly)
// don't interfere with that file's functional assertions, which run with a
// deliberately generous max so the limiter never fires unexpectedly there.
process.env.NODE_ENV = 'test';
process.env.SMTP_USER = 'sender@example.com';
process.env.SMTP_PASS = 'app-password';
process.env.PASSWORD_RESET_FORGOT_RATE_LIMIT_WINDOW_MS = '60000';
process.env.PASSWORD_RESET_FORGOT_RATE_LIMIT_MAX = '2';
process.env.PASSWORD_RESET_VERIFY_RATE_LIMIT_WINDOW_MS = '60000';
process.env.PASSWORD_RESET_VERIFY_RATE_LIMIT_MAX = '2';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

jest.mock('../src/services/email.service', () => ({
  sendEmail: jest.fn(async () => ({ success: true })),
  sendDocumentRequestEmail: jest.fn(async () => ({ success: true })),
  sendSignupOtpEmail: jest.fn(async () => ({ success: true })),
  sendBusinessSetupSubmissionEmail: jest.fn(async () => ({ success: true })),
  sendBusinessSetupStatusEmail: jest.fn(async () => ({ success: true })),
  sendPasswordResetEmail: jest.fn(async () => ({ success: true })),
  verifyConnection: jest.fn(async () => ({ success: true }))
}));

const app = require('../src/app');

jest.setTimeout(60000);

describe('password reset rate limiting', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await mongoose.connect(mongoServer.getUri());
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('forgot-password requests from one IP are throttled past the configured max', async () => {
    await request(app).post('/api/auth/password/forgot').send({ email: 'first@example.com' }).expect(200);
    await request(app).post('/api/auth/password/forgot').send({ email: 'second@example.com' }).expect(200);

    const throttled = await request(app).post('/api/auth/password/forgot').send({ email: 'third@example.com' });
    expect(throttled.status).toBe(429);
  });

  test('reset requests from one IP are throttled past the configured max', async () => {
    // The rate limiter runs before body validation, so it trips even on
    // bodies that would otherwise fail validation — this test only cares
    // about the throttle, not a real reset.
    await request(app).post('/api/auth/password/reset').send({ token: 'x', password: 'irrelevantPass123' });
    await request(app).post('/api/auth/password/reset').send({ token: 'x', password: 'irrelevantPass123' });

    const throttled = await request(app)
      .post('/api/auth/password/reset')
      .send({ token: 'x', password: 'irrelevantPass123' });
    expect(throttled.status).toBe(429);
  });
});
