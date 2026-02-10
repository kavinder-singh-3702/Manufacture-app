const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const { getCompany } = require('../src/modules/company/services/company.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Access',
    lastName: 'Tester',
    displayName: `Access ${suffix}`,
    email: `access-${suffix}@example.com`,
    phone: `+1555300${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer'
  });

const createCompany = async (owner, suffix) =>
  Company.create({
    displayName: `Access Co ${suffix}`,
    owner: owner._id,
    createdBy: owner._id,
    contact: { phone: `+9112300${suffix}` }
  });

describe('Company access control service', () => {
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

  test('admin can read any company profile', async () => {
    const owner = await createUser('4101', 'user');
    const admin = await createUser('4102', 'admin');
    const company = await createCompany(owner, '4101');

    const result = await getCompany(admin._id.toString(), company._id.toString(), 'admin');

    expect(result).toBeTruthy();
    expect(result.id).toBe(company._id.toString());
    expect(result.displayName).toBe(company.displayName);
  });

  test('non-owner non-admin cannot read another company profile', async () => {
    const owner = await createUser('4103', 'user');
    const outsider = await createUser('4104', 'user');
    const company = await createCompany(owner, '4103');

    await expect(
      getCompany(outsider._id.toString(), company._id.toString(), 'user')
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
