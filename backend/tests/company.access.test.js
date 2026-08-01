const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const { getCompany, getPublicCompany } = require('../src/modules/company/services/company.service');
const { buildInhouseCompanyMetadata } = require('../src/modules/company/utils/inhouseCatalog.util');

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

describe('Public company profile (unauthenticated /sellers page)', () => {
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

  test('returns only whitelisted fields, never documents/contact/owner', async () => {
    const owner = await createUser('4201', 'user');
    const company = await Company.create({
      displayName: 'Public Co',
      legalName: 'Public Co Pvt Ltd',
      owner: owner._id,
      createdBy: owner._id,
      status: 'active',
      contact: { email: 'private@example.com', phone: '+919990001111' },
      documents: { gstNumber: '27ABCDE1234F1Z5', panNumber: 'ABCDE1234F' },
      headquarters: { line1: '123 Secret St', city: 'Pune', state: 'MH', country: 'India' },
      metadata: { internal: 'do-not-leak' }
    });

    const result = await getPublicCompany(company._id.toString());

    expect(result.displayName).toBe('Public Co');
    expect(result.headquarters).toEqual({ city: 'Pune', state: 'MH', country: 'India' });
    expect(result).not.toHaveProperty('contact');
    expect(result).not.toHaveProperty('documents');
    expect(result).not.toHaveProperty('owner');
    expect(result).not.toHaveProperty('metadata');
    expect(JSON.stringify(result)).not.toMatch(/ABCDE1234F|private@example\.com|Secret St/);
  });

  test('allows the default pending-verification status through', async () => {
    const owner = await createUser('4202', 'user');
    const company = await createCompany(owner, '4202');
    expect(company.status).toBe('pending-verification');

    const result = await getPublicCompany(company._id.toString());
    expect(result.id).toBe(company._id.toString());
  });

  test('404s for a suspended or archived company', async () => {
    const owner = await createUser('4203', 'user');
    const suspended = await Company.create({
      displayName: 'Suspended Co',
      owner: owner._id,
      createdBy: owner._id,
      status: 'suspended'
    });

    await expect(getPublicCompany(suspended._id.toString())).rejects.toMatchObject({ statusCode: 404 });
  });

  test('404s for the internal in-house catalog company', async () => {
    const owner = await createUser('4204', 'user');
    const inhouse = await Company.create({
      displayName: 'ARVANN Select',
      owner: owner._id,
      createdBy: owner._id,
      status: 'active',
      metadata: buildInhouseCompanyMetadata()
    });

    await expect(getPublicCompany(inhouse._id.toString())).rejects.toMatchObject({ statusCode: 404 });
  });

  test('404s for a malformed id instead of throwing a cast error', async () => {
    await expect(getPublicCompany('not-a-valid-id')).rejects.toMatchObject({ statusCode: 404 });
  });
});
