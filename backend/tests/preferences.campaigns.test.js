const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');
const {
  createOfferForUser,
  updateCampaignForUser,
  duplicateCampaign
} = require('../src/modules/preferences/services/personalizedOffer.service');
const {
  getHomeFeedForUser,
  recordPreferenceEvent
} = require('../src/modules/preferences/services/preferences.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Campaign',
    lastName: 'Tester',
    displayName: `Campaign ${suffix}`,
    email: `campaign-${suffix}@example.com`,
    phone: `+1555400${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer'
  });

const createCompany = async (owner, suffix) =>
  Company.create({
    displayName: `Campaign Co ${suffix}`,
    owner: owner._id,
    createdBy: owner._id,
    contact: { phone: `+9191000${suffix}` }
  });

const createProduct = async ({ company, user, suffix, category = PRODUCT_CATEGORIES[0].id }) =>
  Product.create({
    name: `Campaign Product ${suffix}`,
    category,
    price: { amount: 120 + Number(suffix), currency: 'INR', unit: 'pcs' },
    minStockQuantity: 2,
    availableQuantity: 40,
    company: company._id,
    createdBy: user._id,
    createdByRole: 'admin',
    sku: `CMP-${suffix}`,
    status: 'active',
    visibility: 'public'
  });

describe('Preference campaigns and home feed', () => {
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

  test('supports both product and service campaigns', async () => {
    const admin = await createUser('6101', 'admin');
    const targetUser = await createUser('6102', 'user');
    const company = await createCompany(admin, '6101');
    const product = await createProduct({ company, user: admin, suffix: '6101' });

    const productCampaign = await createOfferForUser({
      userId: targetUser._id,
      companyId: company._id,
      productId: product._id,
      contentType: 'product',
      title: 'Targeted price drop',
      newPrice: 99,
      createdBy: admin._id
    });

    const serviceCampaign = await createOfferForUser({
      userId: targetUser._id,
      companyId: company._id,
      contentType: 'service',
      serviceType: 'worker',
      title: 'Seasonal worker support',
      message: 'Get workforce support for peak operations.',
      createdBy: admin._id
    });

    expect(productCampaign.contentType).toBe('product');
    expect(productCampaign.product?.id).toBe(String(product._id));
    expect(productCampaign.newPrice).toBe(99);
    expect(productCampaign.contact?.adminUserId).toBe(String(admin._id));

    expect(serviceCampaign.contentType).toBe('service');
    expect(serviceCampaign.serviceType).toBe('worker');
    expect(serviceCampaign.product).toBeUndefined();
    expect(serviceCampaign.contact?.adminUserId).toBe(String(admin._id));
  });

  test('home feed returns active campaigns and suppresses fallback recommendations', async () => {
    const admin = await createUser('6201', 'admin');
    const targetUser = await createUser('6202', 'user');
    const company = await createCompany(admin, '6201');
    const product = await createProduct({ company, user: admin, suffix: '6201' });

    await createOfferForUser({
      userId: targetUser._id,
      companyId: company._id,
      productId: product._id,
      contentType: 'product',
      title: 'Flash offer',
      newPrice: 101,
      createdBy: admin._id
    });

    const feed = await getHomeFeedForUser({
      userId: targetUser._id,
      companyId: company._id,
      campaignLimit: 5,
      recommendationLimit: 5
    });

    expect(feed.campaigns.length).toBeGreaterThan(0);
    expect(feed.recommendations).toHaveLength(0);
    expect(feed.meta.hasCampaigns).toBe(true);
    expect(feed.meta.fallbackUsed).toBe(false);
  });

  test('home feed falls back to behavior-based recommendations when campaigns are absent', async () => {
    const admin = await createUser('6301', 'admin');
    const targetUser = await createUser('6302', 'user');
    const company = await createCompany(admin, '6301');
    const preferredCategory = PRODUCT_CATEGORIES[1].id;

    const preferredProduct = await createProduct({
      company,
      user: admin,
      suffix: '6301',
      category: preferredCategory
    });
    await createProduct({
      company,
      user: admin,
      suffix: '6302',
      category: preferredCategory
    });

    await recordPreferenceEvent({
      userId: targetUser._id,
      companyId: company._id,
      type: 'view_product',
      productId: preferredProduct._id,
      category: preferredCategory
    });
    await recordPreferenceEvent({
      userId: targetUser._id,
      companyId: company._id,
      type: 'add_to_cart',
      productId: preferredProduct._id,
      category: preferredCategory
    });
    await recordPreferenceEvent({
      userId: targetUser._id,
      companyId: company._id,
      type: 'checkout_start',
      productId: preferredProduct._id,
      category: preferredCategory
    });

    const feed = await getHomeFeedForUser({
      userId: targetUser._id,
      companyId: company._id,
      campaignLimit: 5,
      recommendationLimit: 5
    });

    expect(feed.campaigns).toHaveLength(0);
    expect(feed.recommendations.length).toBeGreaterThan(0);
    expect(feed.meta.fallbackUsed).toBe(true);
    expect(feed.recommendations[0].reason).toEqual(expect.stringContaining('checkout'));
  });

  test('campaign status transitions are supported via update service', async () => {
    const admin = await createUser('6401', 'admin');
    const targetUser = await createUser('6402', 'user');
    const company = await createCompany(admin, '6401');
    const product = await createProduct({ company, user: admin, suffix: '6401' });

    const campaign = await createOfferForUser({
      userId: targetUser._id,
      companyId: company._id,
      productId: product._id,
      contentType: 'product',
      status: 'draft',
      title: 'Draft campaign',
      newPrice: 111,
      createdBy: admin._id
    });

    const updated = await updateCampaignForUser({
      userId: targetUser._id,
      campaignId: campaign.id,
      companyId: company._id,
      status: 'active',
      title: 'Published campaign'
    });

    expect(updated).toBeTruthy();
    expect(updated.status).toBe('active');
    expect(updated.title).toBe('Published campaign');
  });

  test('campaign duplicate creates a draft copy for the same user', async () => {
    const admin = await createUser('6501', 'admin');
    const targetUser = await createUser('6502', 'user');
    const company = await createCompany(admin, '6501');
    const product = await createProduct({ company, user: admin, suffix: '6501' });

    const campaign = await createOfferForUser({
      userId: targetUser._id,
      companyId: company._id,
      productId: product._id,
      contentType: 'product',
      status: 'active',
      title: 'High intent offer',
      newPrice: 90,
      createdBy: admin._id
    });

    const copy = await duplicateCampaign({
      campaignId: campaign.id,
      companyId: company._id,
      actorId: admin._id
    });

    expect(copy).toBeTruthy();
    expect(copy.id).not.toBe(campaign.id);
    expect(copy.status).toBe('draft');
    expect(copy.title).toContain('(copy)');
  });

  test('campaign optimistic update check rejects stale payloads', async () => {
    const admin = await createUser('6601', 'admin');
    const targetUser = await createUser('6602', 'user');
    const company = await createCompany(admin, '6601');
    const product = await createProduct({ company, user: admin, suffix: '6601' });

    const campaign = await createOfferForUser({
      userId: targetUser._id,
      companyId: company._id,
      productId: product._id,
      contentType: 'product',
      status: 'draft',
      title: 'Concurrency test offer',
      newPrice: 100,
      createdBy: admin._id
    });

    await expect(
      updateCampaignForUser({
        userId: targetUser._id,
        campaignId: campaign.id,
        companyId: company._id,
        title: 'Should fail on stale update',
        expectedUpdatedAt: new Date(Date.now() - 60_000).toISOString()
      })
    ).rejects.toThrow('Campaign has changed. Refresh and retry with latest data.');
  });
});
