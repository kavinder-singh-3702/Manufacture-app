const loadEmailService = ({ configOverrides = {}, sendMailImpl, verifyImpl } = {}) => {
  jest.resetModules();

  const sendMail = jest.fn(sendMailImpl || (async () => ({ messageId: 'provider-message-id' })));
  const verify = jest.fn(verifyImpl || (async () => true));
  const createTransport = jest.fn(() => ({ sendMail, verify }));

  jest.doMock('nodemailer', () => ({ createTransport }));
  jest.doMock('../src/config/env', () => ({
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: 'sender@example.com',
    smtpPass: 'app-password',
    smtpPoolEnabled: true,
    smtpPoolMaxConnections: 3,
    smtpPoolMaxMessages: 100,
    smtpConnectionTimeoutMs: 10000,
    smtpSocketTimeoutMs: 20000,
    smtpGreetingTimeoutMs: 10000,
    emailFrom: 'Manufacture App <sender@example.com>',
    appName: 'Manufacture App',
    appUrl: 'http://localhost:3000',
    ...configOverrides
  }));

  // eslint-disable-next-line global-require
  const emailService = require('../src/services/email.service');

  return {
    emailService,
    createTransport,
    sendMail,
    verify
  };
};

describe('email service', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.dontMock('nodemailer');
    jest.dontMock('../src/config/env');
  });

  test('returns deterministic mock success when SMTP config is missing', async () => {
    const { emailService, createTransport } = loadEmailService({
      configOverrides: { smtpUser: '', smtpPass: '' }
    });

    const result = await emailService.sendEmail({
      to: 'owner@example.com',
      subject: 'Hello',
      text: 'Test email'
    });

    expect(result.success).toBe(true);
    expect(result.mock).toBe(true);
    expect(result.providerMessageId).toContain('mock-');
    expect(createTransport).not.toHaveBeenCalled();
  });

  test('sends email via SMTP transporter and returns provider message id', async () => {
    const { emailService, sendMail, createTransport } = loadEmailService();

    const result = await emailService.sendEmail({
      to: 'owner@example.com',
      subject: 'Startup request',
      text: 'Startup request received'
    });

    expect(result.success).toBe(true);
    expect(result.mock).toBe(false);
    expect(result.providerMessageId).toBe('provider-message-id');
    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'owner@example.com',
        subject: 'Startup request'
      })
    );
  });

  test('returns structured failure when SMTP send fails', async () => {
    const { emailService } = loadEmailService({
      sendMailImpl: async () => {
        throw new Error('Authentication failed');
      }
    });

    const result = await emailService.sendEmail({
      to: 'owner@example.com',
      subject: 'Startup request',
      text: 'Startup request received'
    });

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe('smtp_send_failed');
    expect(result.errorMessage).toContain('Authentication failed');
  });

  test('verifyConnection returns success/failure payloads', async () => {
    const { emailService: okService } = loadEmailService();
    const ok = await okService.verifyConnection();
    expect(ok.success).toBe(true);

    const { emailService: failService } = loadEmailService({
      verifyImpl: async () => {
        throw new Error('Dial timeout');
      }
    });
    const failed = await failService.verifyConnection();
    expect(failed.success).toBe(false);
    expect(failed.errorCode).toBe('smtp_verify_failed');
  });
});
