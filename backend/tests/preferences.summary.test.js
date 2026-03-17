const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');
const {
  recordPreferenceEvent,
  aggregateSummary
} = require('../src/modules/preferences/services/preferences.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Preference',
    lastName: 'Tester',
    displayName: `Preference ${suffix}`,
    email: `preference-${suffix}@example.com`,
    phone: `+1555700${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer'
  });

const createCompany = async (owner, suffix) =>
  Company.create({
    displayName: `Preference Co ${suffix}`,
    owner: owner._id,
    createdBy: owner._id,
    contact: { phone: `+9192000${suffix}` }
  });

const createProduct = async ({ company, user, suffix, category = PRODUCT_CATEGORIES[0].id }) =>
  Product.create({
    name: `Preference Product ${suffix}`,
    category,
    price: { amount: 150 + Number(suffix), currency: 'INR', unit: 'pcs' },
    minStockQuantity: 2,
    availableQuantity: 50,
    company: company._id,
    createdBy: user._id,
    createdByRole: 'admin',
    sku: `PRF-${suffix}`,
    status: 'active',
    visibility: 'public'
  });

describe('Preference events and summary', () => {
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

  test('records events and aggregates summary signals', async () => {
    const admin = await createUser('7101', 'admin');
    const targetUser = await createUser('7102', 'user');
    const company = await createCompany(admin, '7101');
    const category = PRODUCT_CATEGORIES[1].id;
    const product = await createProduct({ company, user: admin, suffix: '7101', category });

    await recordPreferenceEvent({
      userId: targetUser._id,
      companyId: company._id,
      type: 'view_product',
      productId: product._id,
      category
    });
    await recordPreferenceEvent({
      userId: targetUser._id,
      companyId: company._id,
      type: 'add_to_cart',
      productId: product._id,
      category,
      quantity: 3
    });
    await recordPreferenceEvent({
      userId: targetUser._id,
      companyId: company._id,
      type: 'search',
      searchTerm: 'steel rods'
    });

    const summary = await aggregateSummary({
      userId: targetUser._id,
      companyId: company._id,
      days: 30,
      limit: 5
    });

    expect(summary.userId).toBe(String(targetUser._id));
    expect(summary.topCategories[0]?.category).toBe(category);
    expect(summary.topProducts[0]?.id).toBe(String(product._id));
    expect(summary.topSearchTerms[0]?.term).toBe('steel rods');
    expect(summary.actionCounts.totalEvents).toBe(3);
    expect(summary.actionCounts.view_product).toBe(1);
    expect(summary.actionCounts.add_to_cart).toBe(1);
    expect(summary.actionCounts.search).toBe(1);
    expect(summary.recentEvents.length).toBeGreaterThan(0);
  });

  test('rejects legacy campaign event types', async () => {
    const user = await createUser('7201', 'user');

    await expect(
      recordPreferenceEvent({
        userId: user._id,
        type: 'campaign_click'
      })
    ).rejects.toThrow('Invalid event type: campaign_click');
  });
});
