process.env.NODE_ENV = 'test';
// Guarantee SMTP looks "configured" regardless of whether a local .env is
// present — password-reset.service.js now hard-fails requestPasswordReset
// with 503 when SMTP creds are missing, and dotenv.config() never overrides
// values already set on process.env.
process.env.SMTP_USER = 'sender@example.com';
process.env.SMTP_PASS = 'app-password';
process.env.PASSWORD_RESET_TTL_MS = '500';
process.env.PASSWORD_RESET_RESEND_COOLDOWN_MS = '100';
process.env.PASSWORD_RESET_MAX_ATTEMPTS = '2';
process.env.PASSWORD_RESET_MAX_RESENDS = '2';
// Neutralize the IP/email rate limiters for these functional tests — they're
// covered by their own dedicated suite (auth.password-reset.rate-limit.test.js)
// with a deliberately tiny max.
process.env.PASSWORD_RESET_FORGOT_RATE_LIMIT_MAX = '1000';
process.env.PASSWORD_RESET_VERIFY_RATE_LIMIT_MAX = '1000';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

jest.mock('../src/services/email.service', () => ({
  sendEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-email',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  sendDocumentRequestEmail: jest.fn(async () => ({ success: true })),
  sendSignupOtpEmail: jest.fn(async () => ({ success: true })),
  sendBusinessSetupSubmissionEmail: jest.fn(async () => ({ success: true })),
  sendBusinessSetupStatusEmail: jest.fn(async () => ({ success: true })),
  sendPasswordResetEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-password-reset',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  verifyConnection: jest.fn(async () => ({ success: true }))
}));

const app = require('../src/app');
const User = require('../src/models/user.model');
const { sendPasswordResetEmail } = require('../src/services/email.service');

jest.setTimeout(120000);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

let userCounter = 0;
const createUser = async (overrides = {}) => {
  userCounter += 1;
  return User.create({
    firstName: 'Reset',
    lastName: 'Tester',
    displayName: `Reset Tester ${userCounter}`,
    email: `reset-${userCounter}@example.com`,
    phone: `+1555800${String(userCounter).padStart(4, '0')}`,
    password: 'originalPass123',
    role: 'user',
    accountType: 'normal',
    status: 'active',
    ...overrides
  });
};

const extractTokenFromLink = (link) => new URL(link).searchParams.get('token');

describe('password reset flow', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    jest.clearAllMocks();
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('request issues both a reset code and a reset link in one email', async () => {
    const user = await createUser();

    const response = await request(app).post('/api/auth/password/forgot').send({ email: user.email });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/reset instructions have been sent/i);
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);

    const sentArgs = sendPasswordResetEmail.mock.calls[0][0];
    expect(sentArgs.to).toBe(user.email);
    expect(sentArgs.resetCode).toMatch(/^\d{6}$/);
    expect(sentArgs.resetLink).toContain('/reset-password?token=');
    expect(extractTokenFromLink(sentArgs.resetLink)).toHaveLength(64);
  });

  test('unknown email returns the same message/channel as a known email (enumeration-safe)', async () => {
    // Note: this suite runs with NODE_ENV=test, so the response for a KNOWN
    // email also carries the dev-only resetCode/resetToken echo (see
    // password-reset.service.js) — that echo is intentionally
    // production-only. What must be identical in every environment is the
    // externally-visible message/channel, which is what a real client
    // renders and what an attacker would probe.
    const known = await createUser();

    const knownResponse = await request(app).post('/api/auth/password/forgot').send({ email: known.email });
    const unknownResponse = await request(app)
      .post('/api/auth/password/forgot')
      .send({ email: 'nobody-here@example.com' });

    expect(knownResponse.status).toBe(200);
    expect(unknownResponse.status).toBe(200);
    expect(unknownResponse.body.message).toBe(knownResponse.body.message);
    expect(unknownResponse.body.channel).toBe(knownResponse.body.channel);
    // Only the known email actually triggers a send.
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  test('reset by link redeems the token, clears the code, and logs the user in', async () => {
    const user = await createUser();
    await request(app).post('/api/auth/password/forgot').send({ email: user.email });
    const { resetLink } = sendPasswordResetEmail.mock.calls[0][0];
    const token = extractTokenFromLink(resetLink);

    const response = await request(app)
      .post('/api/auth/password/reset')
      .send({ token, password: 'brandNewPass123' });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(user.email);

    const updated = await User.findById(user._id).select(
      '+password +passwordResetToken +passwordResetCode passwordResetExpires passwordResetAttempts'
    );
    expect(await updated.comparePassword('brandNewPass123')).toBe(true);
    expect(updated.passwordResetToken).toBeUndefined();
    expect(updated.passwordResetCode).toBeUndefined();
    expect(updated.passwordResetExpires).toBeUndefined();
  });

  test('reset by code redeems the code and clears the link token too', async () => {
    const user = await createUser();
    await request(app).post('/api/auth/password/forgot').send({ email: user.email });
    const { resetCode } = sendPasswordResetEmail.mock.calls[0][0];

    const response = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: user.email, code: resetCode, password: 'anotherNewPass123' });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(user.email);

    const updated = await User.findById(user._id).select('+password +passwordResetToken');
    expect(await updated.comparePassword('anotherNewPass123')).toBe(true);
    expect(updated.passwordResetToken).toBeUndefined();
  });

  test('a redeemed link cannot be reused, and its paired code stops working too', async () => {
    const user = await createUser();
    await request(app).post('/api/auth/password/forgot').send({ email: user.email });
    const { resetLink, resetCode } = sendPasswordResetEmail.mock.calls[0][0];
    const token = extractTokenFromLink(resetLink);

    await request(app).post('/api/auth/password/reset').send({ token, password: 'firstNewPass123' }).expect(200);

    const reuseToken = await request(app)
      .post('/api/auth/password/reset')
      .send({ token, password: 'secondNewPass123' });
    expect(reuseToken.status).toBe(400);

    const reuseCode = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: user.email, code: resetCode, password: 'thirdNewPass123' });
    expect(reuseCode.status).toBe(400);
  });

  test('wrong code increments attempts and locks out on the attempt that hits the cap', async () => {
    const user = await createUser();
    await request(app).post('/api/auth/password/forgot').send({ email: user.email });

    // PASSWORD_RESET_MAX_ATTEMPTS is 2 for this suite.
    const firstWrong = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: user.email, code: '000000', password: 'irrelevantPass123' });
    expect(firstWrong.status).toBe(400);

    const secondWrong = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: user.email, code: '111111', password: 'irrelevantPass123' });
    expect(secondWrong.status).toBe(429);

    const { resetCode } = sendPasswordResetEmail.mock.calls[0][0];
    const lockedOutEvenWithCorrectCode = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: user.email, code: resetCode, password: 'irrelevantPass123' });
    expect(lockedOutEvenWithCorrectCode.status).toBe(429);
  });

  test('a code lockout does not invalidate the still-unexpired link', async () => {
    const user = await createUser();
    await request(app).post('/api/auth/password/forgot').send({ email: user.email });
    const { resetLink } = sendPasswordResetEmail.mock.calls[0][0];
    const token = extractTokenFromLink(resetLink);

    await request(app)
      .post('/api/auth/password/reset')
      .send({ email: user.email, code: '000000', password: 'irrelevantPass123' })
      .expect(400);
    await request(app)
      .post('/api/auth/password/reset')
      .send({ email: user.email, code: '111111', password: 'irrelevantPass123' })
      .expect(429);

    const linkStillWorks = await request(app)
      .post('/api/auth/password/reset')
      .send({ token, password: 'finalNewPass123' });
    expect(linkStillWorks.status).toBe(200);
  });

  test('expired code/link is rejected with 410', async () => {
    const user = await createUser();
    await request(app).post('/api/auth/password/forgot').send({ email: user.email });
    const { resetLink, resetCode } = sendPasswordResetEmail.mock.calls[0][0];
    const token = extractTokenFromLink(resetLink);

    await wait(600); // PASSWORD_RESET_TTL_MS is 500 for this suite

    const codeResponse = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: user.email, code: resetCode, password: 'tooLatePass123' });
    expect(codeResponse.status).toBe(410);

    const tokenResponse = await request(app)
      .post('/api/auth/password/reset')
      .send({ token, password: 'tooLatePass123' });
    expect(tokenResponse.status).toBe(400); // token lookup is expiry-scoped in the query itself
  });

  test('resend respects the cooldown, then issues a fresh code that supersedes the old one', async () => {
    const user = await createUser();

    await request(app).post('/api/auth/password/forgot').send({ email: user.email }).expect(200);
    const firstCode = sendPasswordResetEmail.mock.calls[0][0].resetCode;

    const cooldownResponse = await request(app).post('/api/auth/password/forgot').send({ email: user.email });
    expect(cooldownResponse.status).toBe(429);

    await wait(130); // PASSWORD_RESET_RESEND_COOLDOWN_MS is 100 for this suite

    await request(app).post('/api/auth/password/forgot').send({ email: user.email }).expect(200);
    const secondCode = sendPasswordResetEmail.mock.calls[1][0].resetCode;

    expect(secondCode).not.toBe(firstCode);

    const oldCodeResponse = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: user.email, code: firstCode, password: 'shouldNotWorkPass123' });
    expect(oldCodeResponse.status).toBe(400);

    const newCodeResponse = await request(app)
      .post('/api/auth/password/reset')
      .send({ email: user.email, code: secondCode, password: 'shouldWorkPass123' });
    expect(newCodeResponse.status).toBe(200);
  });

  test('rejects a request with neither a token nor an email+code pair', async () => {
    const response = await request(app).post('/api/auth/password/reset').send({ password: 'somePassword123' });
    expect(response.status).toBe(422);
  });
});
