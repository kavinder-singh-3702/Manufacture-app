const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');
const {
  createCampaign,
  updateCampaign,
  activateCampaign,
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

const createMarketplaceProduct = async ({
  company,
  user,
  suffix,
  category,
  createdByRole = 'user',
  visibility = 'public',
  status = 'active'
}) =>
  Product.create({
    name: `Ad Product ${suffix}`,
    category,
    subCategory: 'precision',
    price: { amount: 220, currency: 'INR', unit: 'pcs' },
    minStockQuantity: 2,
    availableQuantity: 60,
    company: company._id,
    createdBy: user._id,
    createdByRole,
    visibility,
    status,
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

  test('admin-listed public products are eligible for campaigns and feed delivery', async () => {
    const admin = await createUser('8151', 'admin');
    const buyer = await createUser('8152', 'user');
    const adminCompany = await createCompany(admin, '8151');
    const category = PRODUCT_CATEGORIES[3].id;

    const adminProduct = await createMarketplaceProduct({
      company: adminCompany,
      user: admin,
      suffix: '8151',
      category,
      createdByRole: 'admin'
    });

    const campaign = await createCampaign({
      actorId: admin._id,
      payload: {
        name: 'Admin catalog spotlight',
        productId: adminProduct._id,
        status: 'active',
        creative: {
          priceOverride: {
            amount: 180,
            currency: 'INR'
          }
        },
        targeting: {
          mode: 'any',
          shopperCategories: [category]
        }
      }
    });

    await recordPreferenceEvent({
      userId: buyer._id,
      type: 'view_category',
      category
    });

    const feed = await getFeed({ userId: buyer._id, placement: 'dashboard_home', limit: 5 });
    expect(feed.cards.length).toBe(1);
    expect(feed.cards[0].campaignId).toBe(campaign.id);
    expect(feed.cards[0].pricing.isDiscounted).toBe(true);
    expect(feed.cards[0].pricing.listed.amount).toBe(220);
    expect(feed.cards[0].pricing.advertised.amount).toBe(180);
  });

  test('admin-listed public products remain eligible on update and activate transitions', async () => {
    const admin = await createUser('8156', 'admin');
    const buyer = await createUser('8157', 'user');
    const adminCompany = await createCompany(admin, '8156');
    const category = PRODUCT_CATEGORIES[2].id;

    const adminProduct = await createMarketplaceProduct({
      company: adminCompany,
      user: admin,
      suffix: '8156',
      category,
      createdByRole: 'admin'
    });

    const draftCampaign = await createCampaign({
      actorId: admin._id,
      payload: {
        name: 'Draft admin product campaign',
        productId: adminProduct._id,
        status: 'draft',
        targeting: {
          mode: 'any',
          shopperCategories: [category]
        }
      }
    });

    const updated = await updateCampaign({
      campaignId: draftCampaign.id,
      actorId: admin._id,
      payload: {
        productId: adminProduct._id,
        name: 'Updated admin product campaign'
      }
    });

    expect(updated.status).toBe('draft');
    expect(updated.product.id).toBe(adminProduct._id.toString());
    expect(updated.name).toBe('Updated admin product campaign');

    const activated = await activateCampaign({
      campaignId: draftCampaign.id,
      actorId: admin._id
    });

    expect(activated.status).toBe('active');

    await recordPreferenceEvent({
      userId: buyer._id,
      type: 'view_category',
      category
    });

    const feed = await getFeed({ userId: buyer._id, placement: 'dashboard_home', limit: 5 });
    expect(feed.cards.some((card) => card.campaignId === draftCampaign.id)).toBe(true);
  });

  test('campaign creation rejects non-public or inactive promoted products', async () => {
    const admin = await createUser('8161', 'admin');
    const seller = await createUser('8162', 'user');
    const company = await createCompany(seller, '8161');
    const category = PRODUCT_CATEGORIES[4].id;

    const privateProduct = await createMarketplaceProduct({
      company,
      user: seller,
      suffix: '8161',
      category,
      visibility: 'private'
    });

    const inactiveProduct = await createMarketplaceProduct({
      company,
      user: seller,
      suffix: '8162',
      category,
      status: 'inactive'
    });

    await expect(
      createCampaign({
        actorId: admin._id,
        payload: {
          name: 'Private product campaign',
          productId: privateProduct._id,
          status: 'active'
        }
      })
    ).rejects.toThrow('Promoted product must be an active public user/admin listing');

    await expect(
      createCampaign({
        actorId: admin._id,
        payload: {
          name: 'Inactive product campaign',
          productId: inactiveProduct._id,
          status: 'active'
        }
      })
    ).rejects.toThrow('Promoted product must be an active public user/admin listing');
  });

  test('campaign pricing override must not exceed listed product price', async () => {
    const admin = await createUser('8165', 'admin');
    const seller = await createUser('8166', 'user');
    const company = await createCompany(seller, '8165');
    const category = PRODUCT_CATEGORIES[4].id;

    const product = await createMarketplaceProduct({
      company,
      user: seller,
      suffix: '8165',
      category
    });

    await expect(
      createCampaign({
        actorId: admin._id,
        payload: {
          name: 'Invalid override campaign',
          productId: product._id,
          status: 'active',
          creative: {
            priceOverride: {
              amount: 450,
              currency: 'INR'
            }
          }
        }
      })
    ).rejects.toThrow('Ad price override must be less than or equal to listed product price');
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
          priceOverride: {
            amount: 199,
            currency: 'INR'
          },
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
    expect(prefillResult.prefill.creative.priceOverride.amount).toBe(199);

    const createdResult = await createCampaignFromServiceRequest({
      serviceRequestId: request._id,
      actorId: admin._id,
      activate: true,
      prefillOnly: false
    });

    expect(createdResult.campaign).toBeTruthy();
    expect(createdResult.campaign.status).toBe('active');
    expect(createdResult.campaign.sourceServiceRequest).toBe(String(request._id));
    expect(createdResult.campaign.creative.priceOverride.amount).toBe(199);
  });
});
