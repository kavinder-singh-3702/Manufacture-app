const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');
const {
  createCampaign,
  getFeed,
  recordAdEvent,
  getCampaignInsights,
  createCampaignFromServiceRequest
} = require('../src/modules/ads/services/ad.service');
const {
  createServiceRequest
} = require('../src/modules/services/services/serviceRequest.service');
const {
  recordPreferenceEvent
} = require('../src/modules/preferences/services/preferences.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Ad',
    lastName: 'Tester',
    displayName: `Ad ${suffix}`,
    email: `ad-${suffix}@example.com`,
    phone: `+1555900${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer'
  });

const createCompany = async (owner, suffix) =>
  Company.create({
    displayName: `Ad Co ${suffix}`,
    owner: owner._id,
    createdBy: owner._id,
    contact: { phone: `+9191000${suffix}` }
  });

const createMarketplaceProduct = async ({ company, user, suffix, category }) =>
  Product.create({
    name: `Ad Product ${suffix}`,
    category,
    subCategory: 'precision',
    price: { amount: 220, currency: 'INR', unit: 'pcs' },
    minStockQuantity: 2,
    availableQuantity: 60,
    company: company._id,
    createdBy: user._id,
    createdByRole: 'user',
    visibility: 'public',
    status: 'active',
    sku: `AD-${suffix}`,
    contactPreferences: { allowChat: true, allowCall: true }
  });

describe('Ad platform service', () => {
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

  test('targeted feed returns eligible campaign and respects dismiss + frequency cap', async () => {
    const admin = await createUser('8101', 'admin');
    const seller = await createUser('8102', 'user');
    const buyer = await createUser('8103', 'user');
    const otherBuyer = await createUser('8104', 'user');
    const sellerCompany = await createCompany(seller, '8101');
    const category = PRODUCT_CATEGORIES[0].id;
    const product = await createMarketplaceProduct({ company: sellerCompany, user: seller, suffix: '8101', category });

    const campaign = await createCampaign({
      actorId: admin._id,
      payload: {
        name: 'Category push',
        productId: product._id,
        status: 'active',
        frequencyCapPerDay: 2,
        targeting: {
          mode: 'any',
          shopperCategories: [category]
        },
        creative: {
          title: 'Top seller item',
          ctaLabel: 'View Product'
        }
      }
    });

    await recordPreferenceEvent({
      userId: buyer._id,
      type: 'view_category',
      category
    });

    const eligibleFeed = await getFeed({ userId: buyer._id, placement: 'dashboard_home', limit: 5 });
    expect(eligibleFeed.cards.length).toBe(1);
    expect(eligibleFeed.cards[0].campaignId).toBe(campaign.id);

    const nonEligibleFeed = await getFeed({ userId: otherBuyer._id, placement: 'dashboard_home', limit: 5 });
    expect(nonEligibleFeed.cards.length).toBe(0);

    await recordAdEvent({
      campaignId: campaign.id,
      userId: buyer._id,
      type: 'dismiss',
      placement: 'dashboard_home',
      sessionId: 'sess-dismiss'
    });

    const dismissedFeed = await getFeed({ userId: buyer._id, placement: 'dashboard_home', limit: 5 });
    expect(dismissedFeed.cards.length).toBe(0);

    await recordAdEvent({
      campaignId: campaign.id,
      userId: otherBuyer._id,
      type: 'impression',
      placement: 'dashboard_home',
      sessionId: 'sess-1'
    });
    await recordAdEvent({
      campaignId: campaign.id,
      userId: otherBuyer._id,
      type: 'impression',
      placement: 'dashboard_home',
      sessionId: 'sess-2'
    });

    await recordPreferenceEvent({
      userId: otherBuyer._id,
      type: 'view_category',
      category
    });

    const cappedFeed = await getFeed({ userId: otherBuyer._id, placement: 'dashboard_home', limit: 5 });
    expect(cappedFeed.cards.length).toBe(0);
  });

  test('insights aggregate ad events by type', async () => {
    const admin = await createUser('8201', 'admin');
    const seller = await createUser('8202', 'user');
    const buyer = await createUser('8203', 'user');
    const sellerCompany = await createCompany(seller, '8201');
    const product = await createMarketplaceProduct({
      company: sellerCompany,
      user: seller,
      suffix: '8201',
      category: PRODUCT_CATEGORIES[1].id
    });

    const campaign = await createCampaign({
      actorId: admin._id,
      payload: {
        name: 'Insights campaign',
        productId: product._id,
        status: 'active'
      }
    });

    await recordAdEvent({ campaignId: campaign.id, userId: buyer._id, type: 'impression', sessionId: 'a1' });
    await recordAdEvent({ campaignId: campaign.id, userId: buyer._id, type: 'click', sessionId: 'a1' });
    await recordAdEvent({ campaignId: campaign.id, userId: buyer._id, type: 'dismiss', sessionId: 'a1' });

    const insights = await getCampaignInsights({ campaignId: campaign.id });
    expect(insights.summary.impression.count).toBe(1);
    expect(insights.summary.click.count).toBe(1);
    expect(insights.summary.dismiss.count).toBe(1);
    expect(insights.ctr).toBe(100);
  });

  test('service request conversion produces campaign prefill and created campaign', async () => {
    const admin = await createUser('8301', 'admin');
    const seller = await createUser('8302', 'user');
    const sellerCompany = await createCompany(seller, '8301');
    seller.activeCompany = sellerCompany._id;
    await seller.save();

    const product = await createMarketplaceProduct({
      company: sellerCompany,
      user: seller,
      suffix: '8301',
      category: PRODUCT_CATEGORIES[2].id
    });

    const request = await createServiceRequest(
      {
        serviceType: 'advertisement',
        title: 'Promote my listing',
        description: 'Need targeted visibility',
        advertisementDetails: {
          product: product._id,
          objective: 'Drive qualified leads',
          targetingMode: 'all',
          shopperCategories: [PRODUCT_CATEGORIES[2].id],
          requireListedProductInSameCategory: true,
          lookbackDays: 45,
          headline: 'Premium quality',
          ctaLabel: 'View Product',
          frequencyCapPerDay: 4,
          priority: 70
        }
      },
      { id: seller._id.toString(), role: 'user', activeCompany: sellerCompany._id.toString() }
    );

    const prefillResult = await createCampaignFromServiceRequest({
      serviceRequestId: request._id,
      actorId: admin._id,
      prefillOnly: true
    });

    expect(prefillResult.prefill.productId).toBe(String(product._id));
    expect(prefillResult.prefill.targeting.mode).toBe('all');
    expect(prefillResult.prefill.frequencyCapPerDay).toBe(4);

    const createdResult = await createCampaignFromServiceRequest({
      serviceRequestId: request._id,
      actorId: admin._id,
      activate: true,
      prefillOnly: false
    });

    expect(createdResult.campaign).toBeTruthy();
    expect(createdResult.campaign.status).toBe('active');
    expect(createdResult.campaign.sourceServiceRequest).toBe(String(request._id));
  });
});
