const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Notification = require('../src/models/notification.model');
const UserDevice = require('../src/models/userDevice.model');
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
  cancelAdminNotification,
  resendAdminNotification,
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

  test('admin listing, cancel and resend are available', async () => {
    const admin = await createUser('8105', 'admin');
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

    const list = await listAdminNotifications(String(admin._id), { limit: 10, offset: 0 });
    expect(list.notifications.length).toBeGreaterThan(0);

    const first = list.notifications[0];

    const cancelled = await cancelAdminNotification(first.id, String(admin._id));
    expect(cancelled.lifecycleStatus).toBe('cancelled');

    const raw = await Notification.findById(first.id).lean();
    expect(raw.status).toBe('cancelled');

    const resent = await resendAdminNotification(first.id, String(admin._id));
    expect(resent.success).toBe(true);
    expect(resent.notification.id).toBeTruthy();
    expect(resent.notification.id).not.toBe(first.id);
  });
});
