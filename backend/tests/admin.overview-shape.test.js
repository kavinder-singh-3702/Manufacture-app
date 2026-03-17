const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const {
  getAdminOverview,
  getAdminUserOverview
} = require('../src/modules/admin/services/admin.service');

jest.setTimeout(120000);

describe('Admin overview payload shape without campaigns', () => {
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

  test('overview does not expose campaign metrics', async () => {
    const overview = await getAdminOverview();

    expect(overview).toHaveProperty('stats');
    expect(overview).toHaveProperty('servicesQueue');
    expect(overview).toHaveProperty('communications');
    expect(overview).not.toHaveProperty('campaigns');
  });

  test('user overview does not expose campaign summary', async () => {
    const user = await User.create({
      firstName: 'Admin',
      lastName: 'Viewer',
      displayName: 'Admin Viewer',
      email: 'admin-overview-user@example.com',
      phone: '+15559990001',
      password: 'password123',
      role: 'user',
      accountType: 'manufacturer'
    });

    const overview = await getAdminUserOverview({ userId: String(user._id) });

    expect(overview).toHaveProperty('user');
    expect(overview).toHaveProperty('activity');
    expect(overview).toHaveProperty('services');
    expect(overview).toHaveProperty('communications');
    expect(overview).not.toHaveProperty('campaigns');
  });
});
