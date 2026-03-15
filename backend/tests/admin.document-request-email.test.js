const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

jest.mock('../src/services/email.service', () => ({
  sendDocumentRequestEmail: jest.fn()
}));

jest.mock('../src/services/notification.service', () => ({
  createDocumentRequestNotification: jest.fn()
}));

const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const { sendDocumentRequestEmail } = require('../src/services/email.service');
const { createDocumentRequestNotification } = require('../src/services/notification.service');
const { requestDocuments } = require('../src/modules/admin/services/admin.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Doc',
    lastName: 'Tester',
    displayName: `Doc ${suffix}`,
    email: `doc-${suffix}@example.com`,
    phone: `+1555800${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer',
    status: 'active'
  });

const createPendingCompany = async (owner, suffix) =>
  Company.create({
    displayName: `Doc Co ${suffix}`,
    owner: owner._id,
    createdBy: owner._id,
    status: 'pending-verification',
    contact: { phone: `+9199000${suffix}` }
  });

describe('admin document request email flow', () => {
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

  test('requestDocuments sends SMTP email when owner email exists', async () => {
    const admin = await createUser('9101', 'admin');
    const owner = await createUser('9102', 'user');
    const company = await createPendingCompany(owner, '9101');

    sendDocumentRequestEmail.mockResolvedValue({
      success: true,
      providerMessageId: 'smtp-1',
      errorCode: null,
      errorMessage: null,
      error: null,
      mock: false
    });

    const result = await requestDocuments(String(company._id), String(admin._id), {
      sendEmail: true,
      sendNotification: false,
      message: 'Please upload GST and Aadhaar copy.'
    });

    expect(result.success).toBe(true);
    expect(result.emailSent).toBe(true);
    expect(result.notificationSent).toBe(false);
    expect(sendDocumentRequestEmail).toHaveBeenCalledTimes(1);
    expect(createDocumentRequestNotification).not.toHaveBeenCalled();
  });

  test('requestDocuments preserves fallback semantics when email fails but notification succeeds', async () => {
    const admin = await createUser('9103', 'admin');
    const owner = await createUser('9104', 'user');
    const company = await createPendingCompany(owner, '9102');

    sendDocumentRequestEmail.mockResolvedValue({
      success: false,
      providerMessageId: null,
      errorCode: 'smtp_send_failed',
      errorMessage: 'SMTP authentication failed',
      error: 'SMTP authentication failed',
      mock: false
    });

    createDocumentRequestNotification.mockResolvedValue({
      success: true,
      notificationId: 'notif-1'
    });

    const result = await requestDocuments(String(company._id), String(admin._id), {
      sendEmail: true,
      sendNotification: true,
      message: 'Upload fresh documents.'
    });

    expect(result.success).toBe(true);
    expect(result.emailSent).toBe(false);
    expect(result.notificationSent).toBe(true);
    expect(sendDocumentRequestEmail).toHaveBeenCalledTimes(1);
    expect(createDocumentRequestNotification).toHaveBeenCalledTimes(1);
  });

  test('requestDocuments throws when both email and notification fail', async () => {
    const admin = await createUser('9105', 'admin');
    const owner = await createUser('9106', 'user');
    const company = await createPendingCompany(owner, '9103');

    sendDocumentRequestEmail.mockResolvedValue({
      success: false,
      providerMessageId: null,
      errorCode: 'smtp_send_failed',
      errorMessage: 'SMTP unavailable',
      error: 'SMTP unavailable',
      mock: false
    });

    createDocumentRequestNotification.mockResolvedValue({
      success: false,
      error: 'notification write failed'
    });

    await expect(
      requestDocuments(String(company._id), String(admin._id), {
        sendEmail: true,
        sendNotification: true,
        message: 'Both channels fail test.'
      })
    ).rejects.toThrow('Failed to send both email and notification');
  });
});
