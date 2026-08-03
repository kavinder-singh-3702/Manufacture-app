const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
jest.mock('../src/services/email.service', () => ({
  sendEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-email-message-id',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  sendDocumentRequestEmail: jest.fn(async () => ({
    success: true,
    providerMessageId: 'mock-doc-message-id',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  })),
  verifyConnection: jest.fn(async () => ({
    success: true,
    providerMessageId: 'smtp-verified',
    errorCode: null,
    errorMessage: null,
    error: null,
    mock: false
  }))
}));

const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Notification = require('../src/models/notification.model');
const UserDevice = require('../src/models/userDevice.model');
const { sendEmail } = require('../src/services/email.service');
const {
  dispatchNotification,
  getUserNotifications,
  markAsRead,
  getUnreadCount,
  archiveNotification,
  unarchiveNotification,
  registerUserDevice,
  unregisterUserDevice,
  getUserNotificationPreferences,
  updateUserNotificationPreferences,
  listAdminNotifications,
  getAdminBatch,
  cancelAdminBatch,
  resendAdminBatch,
} = require('../src/services/notification.service');
const { runDispatchCycle } = require('../src/modules/notifications/services/notificationDispatcher.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Notify',
    lastName: 'Tester',
    displayName: `Notify ${suffix}`,
    email: `notify-${suffix}@example.com`,
    phone: `+1555900${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer'
  });

describe('Notification platform service', () => {
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

  test('registers and unregisters user device tokens', async () => {
    const user = await createUser('8101');

    const reg = await registerUserDevice(String(user._id), {
      pushToken: 'ExponentPushToken[token-8101]',
      platform: 'android',
      pushProvider: 'expo',
      appVersion: '1.0.0'
    });

    expect(reg.success).toBe(true);
    expect(reg.device.pushToken).toBe('ExponentPushToken[token-8101]');

    const unreg = await unregisterUserDevice(String(user._id), 'ExponentPushToken[token-8101]');
    expect(unreg.success).toBe(true);

    const found = await UserDevice.findOne({ pushToken: 'ExponentPushToken[token-8101]' }).lean();
    expect(found.isActive).toBe(false);
  });

  test('updates and retrieves notification preferences', async () => {
    const user = await createUser('8102');

    const initial = await getUserNotificationPreferences(String(user._id));
    expect(initial.masterEnabled).toBe(true);

    const updated = await updateUserNotificationPreferences(String(user._id), {
      pushEnabled: false,
      quietHours: {
        enabled: true,
        start: '21:30',
        end: '07:00',
        timezone: 'Asia/Kolkata'
      }
    });

    expect(updated.pushEnabled).toBe(false);
    expect(updated.quietHours.enabled).toBe(true);
    expect(updated.quietHours.timezone).toBe('Asia/Kolkata');
  });

  test('supports dispatch, read, archive, and unarchive flow', async () => {
    const admin = await createUser('8103', 'admin');
    const user = await createUser('8104', 'user');

    const result = await dispatchNotification({
      userId: String(user._id),
      title: 'Price alert',
      body: 'A watched product has changed price',
      eventKey: 'product.price.changed',
      topic: 'catalog',
      priority: 'high',
      channels: ['in_app', 'push'],
      actorId: String(admin._id),
      createdBy: String(admin._id),
      action: {
        type: 'route',
        routeName: 'ProductSearch',
      }
    });

    expect(result.success).toBe(true);

    const unread = await getUnreadCount(String(user._id));
    expect(unread).toBe(1);

    const list = await getUserNotifications(String(user._id), { status: 'unread' });
    expect(list.notifications).toHaveLength(1);

    const notificationId = list.notifications[0].id;

    const marked = await markAsRead(notificationId, String(user._id));
    expect(marked.success).toBe(true);
    expect(marked.notification.status).toBe('read');

    const archived = await archiveNotification(notificationId, String(user._id));
    expect(archived.success).toBe(true);
    expect(archived.notification.archivedAt).toBeTruthy();

    const unarchived = await unarchiveNotification(notificationId, String(user._id));
    expect(unarchived.success).toBe(true);
    expect(unarchived.notification.archivedAt).toBeNull();
  });

  test('dispatch cycle delivers scheduled in-app notifications when due', async () => {
    const admin = await createUser('8107', 'admin');
    const user = await createUser('8108', 'user');
    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const result = await dispatchNotification({
      userId: String(user._id),
      title: 'Scheduled reminder',
      body: 'Check your inventory health',
      eventKey: 'inventory.reminder',
      topic: 'inventory',
      priority: 'normal',
      channels: ['in_app'],
      actorId: String(admin._id),
      createdBy: String(admin._id),
      scheduledAt,
    });

    expect(result.success).toBe(true);

    await runDispatchCycle();

    let raw = await Notification.findById(result.notificationId).lean();
    expect(raw.deliveries[0].status).toBe('queued');

    raw = await Notification.findByIdAndUpdate(
      result.notificationId,
      { $set: { scheduledAt: new Date(Date.now() - 60 * 1000) } },
      { new: true }
    ).lean();
    expect(raw.scheduledAt).toBeTruthy();

    await runDispatchCycle();

    const delivered = await Notification.findById(result.notificationId).lean();
    const inApp = delivered.deliveries.find((item) => item.channel === 'in_app');
    expect(inApp.status).toBe('delivered');
  });

  test('dispatch cycle delivers queued email notifications when user email channel is enabled', async () => {
    const admin = await createUser('8110', 'admin');
    const user = await createUser('8111', 'user');
    await updateUserNotificationPreferences(String(user._id), { emailEnabled: true });

    const result = await dispatchNotification({
      userId: String(user._id),
      title: 'Startup submitted',
      body: 'Your startup request is in queue',
      eventKey: 'business_setup.request.submitted',
      topic: 'services',
      priority: 'normal',
      channels: ['email'],
      actorId: String(admin._id),
      createdBy: String(admin._id),
    });

    expect(result.success).toBe(true);

    await runDispatchCycle();

    const delivered = await Notification.findById(result.notificationId).lean();
    const emailDelivery = delivered.deliveries.find((item) => item.channel === 'email');
    expect(emailDelivery.status).toBe('delivered');
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: user.email,
        subject: 'Startup submitted'
      })
    );
  });

  test('dispatch cycle retries and then fails email delivery after max attempts', async () => {
    const admin = await createUser('8112', 'admin');
    const user = await createUser('8113', 'user');
    await updateUserNotificationPreferences(String(user._id), { emailEnabled: true });

    sendEmail
      .mockResolvedValueOnce({
        success: false,
        providerMessageId: null,
        errorCode: 'smtp_temp',
        errorMessage: 'Temporary SMTP error',
        error: 'Temporary SMTP error',
        mock: false
      })
      .mockResolvedValueOnce({
        success: false,
        providerMessageId: null,
        errorCode: 'smtp_temp',
        errorMessage: 'Temporary SMTP error',
        error: 'Temporary SMTP error',
        mock: false
      });

    const result = await dispatchNotification({
      userId: String(user._id),
      title: 'Startup update',
      body: 'Status changed',
      eventKey: 'business_setup.request.status_changed',
      topic: 'services',
      priority: 'normal',
      channels: ['email'],
      actorId: String(admin._id),
      createdBy: String(admin._id),
      deliveryPolicy: { maxRetries: 2 }
    });

    await runDispatchCycle();

    let queued = await Notification.findById(result.notificationId);
    let emailDelivery = queued.deliveries.find((item) => item.channel === 'email');
    expect(emailDelivery.status).toBe('queued');
    expect(emailDelivery.nextRetryAt).toBeTruthy();

    emailDelivery.nextRetryAt = new Date(Date.now() - 1000);
    await queued.save();

    await runDispatchCycle();

    queued = await Notification.findById(result.notificationId).lean();
    emailDelivery = queued.deliveries.find((item) => item.channel === 'email');
    expect(emailDelivery.status).toBe('failed');
    expect(sendEmail).toHaveBeenCalledTimes(2);
  });

  test('dispatch cycle cancels email delivery when recipient email is missing', async () => {
    const admin = await createUser('8114', 'admin');
    const user = await createUser('8115', 'user');
    await updateUserNotificationPreferences(String(user._id), { emailEnabled: true });
    await User.updateOne({ _id: user._id }, { $unset: { email: 1 } });

    const result = await dispatchNotification({
      userId: String(user._id),
      title: 'Startup update',
      body: 'Status changed',
      eventKey: 'business_setup.request.status_changed',
      topic: 'services',
      priority: 'normal',
      channels: ['email'],
      actorId: String(admin._id),
      createdBy: String(admin._id)
    });

    await runDispatchCycle();

    const cancelled = await Notification.findById(result.notificationId).lean();
    const emailDelivery = cancelled.deliveries.find((item) => item.channel === 'email');
    expect(emailDelivery.status).toBe('cancelled');
    expect(emailDelivery.errorCode).toBe('missing_email_recipient');
    expect(sendEmail).not.toHaveBeenCalled();
  });

  test('admin listing, cancel and resend are available, and a second admin can act on the first admin\'s dispatch', async () => {
    const admin = await createUser('8105', 'admin');
    const secondAdmin = await createUser('8105b', 'admin');
    const user = await createUser('8106', 'user');

    const sent = await dispatchNotification({
      userId: String(user._id),
      title: 'Verification pending',
      body: 'Please complete company documents',
      eventKey: 'company.verification.pending',
      topic: 'compliance',
      priority: 'normal',
      actorId: String(admin._id),
      createdBy: String(admin._id),
      channels: ['in_app']
    });

    expect(sent.success).toBe(true);
    expect(sent.batchId).toBeTruthy();

    // A second admin (not the creator) can list and act on the dispatch —
    // regression test for B5, where list/get were scoped to `createdBy`
    // while cancel/resend deliberately allowed any admin, so an admin could
    // cancel a batch it 404'd on trying to read.
    const list = await listAdminNotifications(String(secondAdmin._id), { limit: 10, offset: 0 });
    expect(list.notifications.length).toBeGreaterThan(0);

    const first = list.notifications.find((item) => item.batchId === sent.batchId);
    expect(first).toBeTruthy();
    expect(first.recipientCount).toBe(1);

    const batchDetail = await getAdminBatch(sent.batchId, { limit: 10, offset: 0 });
    expect(batchDetail.recipients).toHaveLength(1);

    const cancelled = await cancelAdminBatch(sent.batchId);
    expect(cancelled.batch.cancelledCount).toBe(1);

    const raw = await Notification.findById(sent.notificationId).lean();
    expect(raw.status).toBe('cancelled');

    const resent = await resendAdminBatch(sent.batchId, String(secondAdmin._id));
    expect(resent.success).toBe(true);
    expect(resent.batchId).not.toBe(sent.batchId);
    expect(resent.notificationIds[0]).not.toBe(sent.notificationId);
  });

  test('broadcast fans out to active non-admin users only, sharing one batchId', async () => {
    const admin = await createUser('8120', 'admin');
    const targetA = await createUser('8121', 'user');
    const targetB = await createUser('8122', 'user');
    await createUser('8123', 'admin'); // must NOT receive the broadcast
    const inactiveUser = await createUser('8124', 'user');
    await User.updateOne({ _id: inactiveUser._id }, { status: 'suspended' });

    const result = await dispatchNotification({
      audience: 'broadcast',
      title: 'Platform update',
      body: 'New features are live',
      eventKey: 'system.broadcast',
      topic: 'system',
      priority: 'normal',
      channels: ['in_app'],
      actorId: String(admin._id),
      createdBy: String(admin._id)
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    const recipients = await Notification.find({ batchId: result.batchId }).lean();
    expect(recipients).toHaveLength(2);
    const recipientIds = recipients.map((item) => String(item.user)).sort();
    expect(recipientIds).toEqual([String(targetA._id), String(targetB._id)].sort());
    recipients.forEach((item) => expect(item.batchId).toBe(result.batchId));
  });

  test('company audience resolves the owner plus members', async () => {
    const admin = await createUser('8130', 'admin');
    const owner = await createUser('8131', 'user');
    const member = await createUser('8132', 'user');
    const outsider = await createUser('8133', 'user');

    const company = await Company.create({
      displayName: 'Acme Manufacturing',
      owner: owner._id,
      createdBy: owner._id
    });
    await User.updateOne({ _id: member._id }, { $push: { companies: company._id } });
    void outsider;

    const result = await dispatchNotification({
      audience: 'company',
      companyId: String(company._id),
      title: 'Company update',
      body: 'Your company profile was verified',
      eventKey: 'company.verification.approved',
      topic: 'compliance',
      priority: 'normal',
      channels: ['in_app'],
      actorId: String(admin._id),
      createdBy: String(admin._id)
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    const recipients = await Notification.find({ batchId: result.batchId }).lean();
    const recipientIds = recipients.map((item) => String(item.user)).sort();
    expect(recipientIds).toEqual([String(owner._id), String(member._id)].sort());
  });

  test('in-app delivery on the immediate path is cancelled when the recipient disabled in-app notifications', async () => {
    const admin = await createUser('8140', 'admin');
    const user = await createUser('8141', 'user');
    await updateUserNotificationPreferences(String(user._id), { inAppEnabled: false });

    const result = await dispatchNotification({
      userId: String(user._id),
      title: 'Quote update',
      body: 'Your quote was accepted',
      eventKey: 'quote.accepted',
      topic: 'quotes',
      priority: 'normal',
      channels: ['in_app'],
      actorId: String(admin._id),
      createdBy: String(admin._id)
    });

    expect(result.success).toBe(true);

    // No dispatch cycle needed — this is the immediate (non-scheduled) path,
    // which previously ignored preferences entirely and always marked in-app
    // as delivered regardless of the user's settings (B3).
    const raw = await Notification.findById(result.notificationId).lean();
    const inApp = raw.deliveries.find((item) => item.channel === 'in_app');
    expect(inApp.status).toBe('cancelled');
    expect(inApp.errorCode).toBe('in_app_disabled');

    const unread = await getUnreadCount(String(user._id));
    expect(unread).toBe(0);

    // A hidden (in-app-cancelled) notification also must not surface in the
    // inbox listing itself, not just the unread badge.
    const list = await getUserNotifications(String(user._id), {});
    expect(list.notifications.find((item) => item.id === result.notificationId)).toBeUndefined();
  });

  test('admin batch listing aggregates a fan-out into one row with delivery rollups', async () => {
    const admin = await createUser('8150', 'admin');
    const recipientA = await createUser('8151', 'user');
    const recipientB = await createUser('8152', 'user');

    const result = await dispatchNotification({
      audience: 'user',
      userIds: [String(recipientA._id), String(recipientB._id)],
      title: 'Maintenance window',
      body: 'Scheduled maintenance tonight',
      eventKey: 'system.maintenance',
      topic: 'system',
      priority: 'normal',
      channels: ['in_app'],
      actorId: String(admin._id),
      createdBy: String(admin._id)
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(2);

    const list = await listAdminNotifications(String(admin._id), { limit: 10, offset: 0 });
    const row = list.notifications.find((item) => item.batchId === result.batchId);

    expect(row).toBeTruthy();
    expect(row.recipientCount).toBe(2);
    expect(row.deliveryRollup.in_app.delivered).toBe(2);
  });

  test('insertMany partial failures (deduplicationKey collisions) still report the successful rows', async () => {
    const admin = await createUser('8160', 'admin');
    const recipientA = await createUser('8161', 'user');
    const recipientB = await createUser('8162', 'user');

    // Pre-seed a notification whose deduplicationKey will collide with one of
    // the two recipients created by the dispatch below (fan-out suffixes the
    // key with `:${userId}`), forcing insertMany to fail on exactly one doc.
    await Notification.create({
      user: recipientA._id,
      eventKey: 'seed.collision',
      title: 'Seed',
      body: 'Seed',
      deduplicationKey: `dup-key:${recipientA._id}`
    });

    const result = await dispatchNotification({
      audience: 'user',
      userIds: [String(recipientA._id), String(recipientB._id)],
      title: 'Dedup test',
      body: 'One of these should collide',
      eventKey: 'system.dedup_test',
      priority: 'normal',
      channels: ['in_app'],
      deduplicationKey: 'dup-key',
      actorId: String(admin._id),
      createdBy: String(admin._id)
    });

    expect(result.success).toBe(true);
    expect(result.count).toBe(1);
    expect(result.skipped).toBe(1);

    const recipients = await Notification.find({ batchId: result.batchId }).lean();
    expect(recipients).toHaveLength(1);
    expect(String(recipients[0].user)).toBe(String(recipientB._id));
  });
});
