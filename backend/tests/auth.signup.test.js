process.env.NODE_ENV = 'test';
delete process.env.SIGNUP_TEST_OTP;
process.env.SIGNUP_OTP_TTL_MS = '500';
process.env.SIGNUP_OTP_RESEND_COOLDOWN_MS = '100';
process.env.SIGNUP_OTP_MAX_VERIFY_ATTEMPTS = '2';
process.env.SIGNUP_OTP_MAX_RESENDS = '2';

const request = require('supertest');
const crypto = require('crypto');
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
  sendDocumentRequestEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-doc-email',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  sendSignupOtpEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-signup-otp',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  sendBusinessSetupSubmissionEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-startup-submit',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  sendBusinessSetupStatusEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-startup-status',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  verifyConnection: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-verify',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  }))
}));

const app = require('../src/app');
const User = require('../src/models/user.model');
const { sendSignupOtpEmail } = require('../src/services/email.service');

jest.setTimeout(120000);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const createUser = async (suffix, overrides = {}) =>
  User.create({
    firstName: 'Signup',
    lastName: 'Tester',
    displayName: `Signup ${suffix}`,
    email: `signup-${suffix}@example.com`,
    phone: `+1555700${suffix}`,
    password: 'password123',
    role: 'user',
    accountType: 'normal',
    status: 'active',
    ...overrides
  });

describe('signup auth flow', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('start signup sends OTP email and verify succeeds within the same session', async () => {
    const agent = request.agent(app);

    const startResponse = await agent.post('/api/auth/signup/start').send({
      fullName: 'Ava Kumar',
      email: 'ava@example.com'
    });

    expect(startResponse.status).toBe(200);
    expect(startResponse.body.expiresInMs).toBe(500);
    expect(startResponse.body.resendAvailableInMs).toBe(100);
    expect(sendSignupOtpEmail).toHaveBeenCalledTimes(1);

    const sentOtp = sendSignupOtpEmail.mock.calls[0][0].otp;
    expect(sentOtp).toMatch(/^\d{6}$/);

    const verifyResponse = await agent.post('/api/auth/signup/verify').send({ otp: sentOtp });
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.message).toBe('OTP verification successful');
  });

  test('resend respects cooldown and issues a fresh OTP', async () => {
    const randomIntSpy = jest
      .spyOn(crypto, 'randomInt')
      .mockReturnValueOnce(123456)
      .mockReturnValueOnce(654321);
    const agent = request.agent(app);

    const firstStart = await agent.post('/api/auth/signup/start').send({
      fullName: 'Nina Das',
      email: 'nina@example.com'
    });

    expect(firstStart.status).toBe(200);

    const cooldownResponse = await agent.post('/api/auth/signup/start').send({
      fullName: 'Nina Das',
      email: 'nina@example.com'
    });

    expect(cooldownResponse.status).toBe(429);

    await wait(130);

    const resendResponse = await agent.post('/api/auth/signup/start').send({
      fullName: 'Nina Das',
      email: 'nina@example.com'
    });

    expect(resendResponse.status).toBe(200);
    expect(sendSignupOtpEmail).toHaveBeenCalledTimes(2);

    const firstOtp = sendSignupOtpEmail.mock.calls[0][0].otp;
    const secondOtp = sendSignupOtpEmail.mock.calls[1][0].otp;
    expect(firstOtp).toBe('123456');
    expect(secondOtp).toBe('654321');

    const invalidOldOtp = await agent.post('/api/auth/signup/verify').send({ otp: firstOtp });
    expect(invalidOldOtp.status).toBe(400);

    const validNewOtp = await agent.post('/api/auth/signup/verify').send({ otp: secondOtp });
    expect(validNewOtp.status).toBe(200);

    randomIntSpy.mockRestore();
  });

  test('verify rejects expired OTPs', async () => {
    const agent = request.agent(app);

    const startResponse = await agent.post('/api/auth/signup/start').send({
      fullName: 'Expiry Check',
      email: 'expiry@example.com'
    });

    expect(startResponse.status).toBe(200);

    const sentOtp = sendSignupOtpEmail.mock.calls[0][0].otp;
    await wait(550);

    const verifyResponse = await agent.post('/api/auth/signup/verify').send({ otp: sentOtp });
    expect(verifyResponse.status).toBe(410);
    expect(verifyResponse.body.message).toContain('OTP has expired');
  });

  test('verify rejects invalid codes and locks after max attempts', async () => {
    const agent = request.agent(app);

    const startResponse = await agent.post('/api/auth/signup/start').send({
      fullName: 'Lock Check',
      email: 'lock@example.com'
    });

    expect(startResponse.status).toBe(200);

    const firstInvalid = await agent.post('/api/auth/signup/verify').send({ otp: '111111' });
    expect(firstInvalid.status).toBe(400);

    const secondInvalid = await agent.post('/api/auth/signup/verify').send({ otp: '222222' });
    expect(secondInvalid.status).toBe(429);

    const actualOtp = sendSignupOtpEmail.mock.calls[0][0].otp;
    const lockedValidAttempt = await agent.post('/api/auth/signup/verify').send({ otp: actualOtp });
    expect(lockedValidAttempt.status).toBe(429);
  });

  test('contact step stores phone after email verification and rejects duplicates', async () => {
    await createUser('7001', { phone: '+919999999999' });
    const agent = request.agent(app);

    const startResponse = await agent.post('/api/auth/signup/start').send({
      fullName: 'Contact Flow',
      email: 'contact@example.com'
    });
    expect(startResponse.status).toBe(200);

    const sentOtp = sendSignupOtpEmail.mock.calls[0][0].otp;
    await agent.post('/api/auth/signup/verify').send({ otp: sentOtp }).expect(200);

    const duplicatePhone = await agent.post('/api/auth/signup/contact').send({
      phone: '+919999999999'
    });
    expect(duplicatePhone.status).toBe(409);

    const successPhone = await agent.post('/api/auth/signup/contact').send({
      phone: '+919888888888'
    });
    expect(successPhone.status).toBe(200);
    expect(successPhone.body.phone).toBe('+919888888888');
  });

  test('complete succeeds after verified email and stored phone', async () => {
    const agent = request.agent(app);

    const startResponse = await agent.post('/api/auth/signup/start').send({
      fullName: 'Priya Sharma',
      email: 'priya@example.com'
    });
    expect(startResponse.status).toBe(200);

    const sentOtp = sendSignupOtpEmail.mock.calls[0][0].otp;
    await agent.post('/api/auth/signup/verify').send({ otp: sentOtp }).expect(200);
    await agent.post('/api/auth/signup/contact').send({ phone: '+919123456789' }).expect(200);

    const completeResponse = await agent.post('/api/auth/signup/complete').send({
      password: 'securePass123',
      accountType: 'manufacturer',
      companyName: 'Arvann Foods',
      categories: ['manufacturing']
    });

    expect(completeResponse.status).toBe(201);
    expect(completeResponse.body.token).toBeTruthy();
    expect(completeResponse.body.user.email).toBe('priya@example.com');
    expect(completeResponse.body.user.phone).toBe('+919123456789');
    expect(completeResponse.body.user.emailVerifiedAt).toBeTruthy();
    expect(completeResponse.body.user.phoneVerifiedAt).toBeFalsy();
  });

  test('legacy complete still works when phone is supplied directly at signup start', async () => {
    const agent = request.agent(app);

    const startResponse = await agent.post('/api/auth/signup/start').send({
      fullName: 'Legacy Flow',
      email: 'legacy@example.com',
      phone: '+919444444444'
    });
    expect(startResponse.status).toBe(200);

    const sentOtp = sendSignupOtpEmail.mock.calls[0][0].otp;
    await agent.post('/api/auth/signup/verify').send({ otp: sentOtp }).expect(200);

    const completeResponse = await agent.post('/api/auth/signup/complete').send({
      password: 'legacyPass123',
      accountType: 'normal',
      fullName: 'Legacy Flow',
      email: 'legacy@example.com',
      phone: '+919444444444'
    });

    expect(completeResponse.status).toBe(201);
    expect(completeResponse.body.user.phone).toBe('+919444444444');
  });

  test('duplicate email is rejected before sending OTP', async () => {
    await createUser('7002', { email: 'existing@example.com' });
    const agent = request.agent(app);

    const response = await agent.post('/api/auth/signup/start').send({
      fullName: 'Existing User',
      email: 'existing@example.com'
    });

    expect(response.status).toBe(409);
    expect(sendSignupOtpEmail).not.toHaveBeenCalled();
  });

  test('OTP email send failure returns an error and does not advance the session', async () => {
    sendSignupOtpEmail.mockResolvedValueOnce({
      success: false,
      providerMessageId: null,
      errorCode: 'smtp_send_failed',
      errorMessage: 'SMTP unavailable',
      error: 'SMTP unavailable',
      mock: false
    });

    const agent = request.agent(app);

    const startResponse = await agent.post('/api/auth/signup/start').send({
      fullName: 'Mail Failure',
      email: 'mail-failure@example.com'
    });

    expect(startResponse.status).toBe(502);

    const verifyResponse = await agent.post('/api/auth/signup/verify').send({ otp: '123456' });
    expect(verifyResponse.status).toBe(400);
    expect(verifyResponse.body.message).toContain('Start signup before verifying');
  });
});
