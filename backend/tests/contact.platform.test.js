const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

// Keep the test hermetic: stub the email side-effect so no SMTP is attempted.
jest.mock('../src/services/email.service', () => ({
  sendContactMessageEmail: jest.fn().mockResolvedValue({ success: true, mock: true }),
}));

const { sendContactMessageEmail } = require('../src/services/email.service');
const ContactMessage = require('../src/models/contactMessage.model');
const {
  createContactMessage,
  listContactMessages,
  updateContactMessageStatus,
} = require('../src/modules/contact/services/contact.service');

jest.setTimeout(120000);

describe('Contact message services', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('persists a submission, normalizes the email, and notifies support', async () => {
    const created = await createContactMessage(
      {
        name: '  Asha Rao ',
        email: 'Asha@Example.COM',
        company: 'Rao Steels',
        topic: 'Sales & onboarding',
        message: '  We want to list 20 products.  ',
      },
      { meta: { ip: '1.2.3.4', userAgent: 'jest' } }
    );

    expect(created._id).toBeTruthy();
    expect(created.name).toBe('Asha Rao');
    expect(created.email).toBe('asha@example.com');
    expect(created.message).toBe('We want to list 20 products.');
    expect(created.status).toBe('new');
    expect(sendContactMessageEmail).toHaveBeenCalledTimes(1);

    const stored = await ContactMessage.findById(created._id).lean();
    expect(stored).toBeTruthy();
    expect(stored.meta.ip).toBe('1.2.3.4');
  });

  it('rejects submissions missing required fields', async () => {
    await expect(
      createContactMessage({ name: 'No Email', email: '', message: 'hi' }, {})
    ).rejects.toThrow(/required/i);
  });

  it('still saves the message when the notification email fails', async () => {
    sendContactMessageEmail.mockRejectedValueOnce(new Error('smtp down'));
    const created = await createContactMessage(
      { name: 'Test', email: 't@example.com', message: 'hello there' },
      {}
    );
    expect(created._id).toBeTruthy();
    const count = await ContactMessage.countDocuments();
    expect(count).toBe(1);
  });

  it('lists messages newest-first and filters by status', async () => {
    await createContactMessage({ name: 'A', email: 'a@x.com', message: 'one' }, {});
    const second = await createContactMessage({ name: 'B', email: 'b@x.com', message: 'two' }, {});
    await updateContactMessageStatus(second._id, { status: 'closed' });

    const all = await listContactMessages({});
    expect(all.pagination.total).toBe(2);
    expect(all.messages[0].name).toBe('B');

    const closed = await listContactMessages({ status: 'closed' });
    expect(closed.pagination.total).toBe(1);
    expect(closed.messages[0]._id.toString()).toBe(second._id.toString());
  });

  it('rejects an invalid status update', async () => {
    const created = await createContactMessage({ name: 'A', email: 'a@x.com', message: 'one' }, {});
    await expect(
      updateContactMessageStatus(created._id, { status: 'bogus' })
    ).rejects.toThrow(/Invalid contact message status/);
  });
});
