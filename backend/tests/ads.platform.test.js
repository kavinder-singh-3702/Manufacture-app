jest.mock('../src/services/storage.service', () => ({
  uploadAdBanner: jest.fn(async ({ kind = 'image' }) => ({
    url: `https://cdn.test/ad-banners/${kind}-${Date.now()}.${kind === 'video' ? 'mp4' : 'jpg'}`,
    mediaType: kind === 'video' ? 'video' : 'image'
  }))
}));

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
  sweepExpiredCampaigns,
  createCampaignFromServiceRequest
} = require('../src/modules/ads/services/ad.service');
const AdCampaign = require('../src/models/adCampaign.model');
const ProductQuote = require('../src/models/productQuote.model');
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
    ).rejects.toThrow('Promoted product must be public (found visibility="private"). Set it to public from Inventory first.');

    await expect(
      createCampaign({
        actorId: admin._id,
        payload: {
          name: 'Inactive product campaign',
          productId: inactiveProduct._id,
          status: 'active'
        }
      })
    ).rejects.toThrow('Promoted product must be active (found status="inactive"). Publish it from Inventory first.');
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

  test('hero_banner campaign uploads banner media and serves it on the hero feed', async () => {
    const admin = await createUser('8401', 'admin');
    const seller = await createUser('8402', 'user');
    const buyer = await createUser('8403', 'user');
    const sellerCompany = await createCompany(seller, '8401');
    const category = PRODUCT_CATEGORIES[0].id;
    const product = await createMarketplaceProduct({ company: sellerCompany, user: seller, suffix: '8401', category });

    const campaign = await createCampaign({
      actorId: admin._id,
      payload: {
        name: 'Hero banner push',
        productId: product._id,
        status: 'active',
        placements: ['hero_banner'],
        creative: {
          title: 'Mega sale',
          bannerImageBase64: Buffer.from('fake-image-bytes').toString('base64'),
          bannerMimeType: 'image/jpeg'
        }
      }
    });

    expect(campaign.placements).toEqual(['hero_banner']);
    expect(campaign.creative.bannerMediaType).toBe('image');
    expect(campaign.creative.bannerImageUrl).toMatch(/^https:\/\/cdn\.test\/ad-banners\/image-/);

    const heroFeed = await getFeed({ userId: buyer._id, placement: 'hero_banner', limit: 5 });
    expect(heroFeed.placement).toBe('hero_banner');
    expect(heroFeed.cards.length).toBe(1);
    expect(heroFeed.cards[0].bannerImageUrl).toBe(campaign.creative.bannerImageUrl);
    expect(heroFeed.cards[0].bannerMediaType).toBe('image');

    // dashboard_home feed must not include hero_banner-only campaigns.
    const homeFeed = await getFeed({ userId: buyer._id, placement: 'dashboard_home', limit: 5 });
    expect(homeFeed.cards.length).toBe(0);

    // Switching to a video banner replaces the image.
    const updated = await updateCampaign({
      campaignId: campaign.id,
      actorId: admin._id,
      payload: {
        creative: {
          bannerVideoBase64: Buffer.from('fake-video-bytes').toString('base64'),
          bannerMimeType: 'video/mp4'
        }
      }
    });
    expect(updated.creative.bannerMediaType).toBe('video');
    expect(updated.creative.bannerVideoUrl).toMatch(/^https:\/\/cdn\.test\/ad-banners\/video-/);
    expect(updated.creative.bannerImageUrl).toBeFalsy();
  });

  test('sweepExpiredCampaigns flips ended active campaigns to completed', async () => {
    const admin = await createUser('8501', 'admin');
    const seller = await createUser('8502', 'user');
    const sellerCompany = await createCompany(seller, '8501');
    const product = await createMarketplaceProduct({ company: sellerCompany, user: seller, suffix: '8501', category: PRODUCT_CATEGORIES[0].id });

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const ended = await createCampaign({
      actorId: admin._id,
      payload: { name: 'Ended', productId: product._id, status: 'active', schedule: { endAt: yesterday } }
    });
    const ongoing = await createCampaign({
      actorId: admin._id,
      payload: { name: 'Ongoing', productId: product._id, status: 'active', schedule: { endAt: tomorrow } }
    });
    const evergreen = await createCampaign({
      actorId: admin._id,
      payload: { name: 'Evergreen', productId: product._id, status: 'active' }
    });

    const count = await sweepExpiredCampaigns({ now: new Date() });
    expect(count).toBe(1);

    expect((await AdCampaign.findById(ended.id).lean()).status).toBe('completed');
    expect((await AdCampaign.findById(ended.id).lean()).completedAt).toBeTruthy();
    expect((await AdCampaign.findById(ongoing.id).lean()).status).toBe('active');
    expect((await AdCampaign.findById(evergreen.id).lean()).status).toBe('active');
  });

  test('insights expose per-placement breakdown, dismiss rate and click attribution', async () => {
    const admin = await createUser('8601', 'admin');
    const seller = await createUser('8602', 'user');
    const buyer = await createUser('8603', 'user');
    const sellerCompany = await createCompany(seller, '8601');
    const product = await createMarketplaceProduct({ company: sellerCompany, user: seller, suffix: '8601', category: PRODUCT_CATEGORIES[1].id });

    const campaign = await createCampaign({
      actorId: admin._id,
      payload: { name: 'Attribution campaign', productId: product._id, status: 'active', placements: ['dashboard_home', 'hero_banner'] }
    });

    await recordAdEvent({ campaignId: campaign.id, userId: buyer._id, type: 'impression', placement: 'hero_banner', sessionId: 'h1' });
    await recordAdEvent({ campaignId: campaign.id, userId: buyer._id, type: 'click', placement: 'hero_banner', sessionId: 'h1' });
    await recordAdEvent({ campaignId: campaign.id, userId: buyer._id, type: 'impression', placement: 'dashboard_home', sessionId: 'd1' });
    await recordAdEvent({ campaignId: campaign.id, userId: buyer._id, type: 'dismiss', placement: 'dashboard_home', sessionId: 'd1' });

    // Buyer converts on the promoted product after clicking → attributed lead.
    await ProductQuote.create({
      product: product._id,
      buyer: buyer._id,
      seller: seller._id,
      sellerCompany: sellerCompany._id,
      status: 'pending',
      request: { quantity: 5, requirements: 'Need a bulk quote' }
    });

    const insights = await getCampaignInsights({ campaignId: campaign.id });

    expect(insights.dismissRate).toBe(50); // 1 dismiss / 2 impressions
    const hero = insights.byPlacement.find((p) => p.placement === 'hero_banner');
    const home = insights.byPlacement.find((p) => p.placement === 'dashboard_home');
    expect(hero.click).toBe(1);
    expect(hero.ctr).toBe(100);
    expect(home.dismiss).toBe(1);
    expect(insights.attribution.clickers).toBe(1);
    expect(insights.attribution.quotes).toBe(1);
    expect(insights.attribution.leads).toBe(1);
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
          popupCooldownMinutes: 15,
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
    expect(prefillResult.prefill.popupCooldownMinutes).toBe(15);
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
    expect(createdResult.campaign.popupCooldownMinutes).toBe(15);
  });

  test('anonymous (logged-out) visitors see untargeted campaigns and can record events', async () => {
    const admin = await createUser('8601', 'admin');
    const seller = await createUser('8602', 'user');
    const sellerCompany = await createCompany(seller, '8601');
    const category = PRODUCT_CATEGORIES[0].id;

    const everyoneProduct = await createMarketplaceProduct({ company: sellerCompany, user: seller, suffix: '8601', category });
    const targetedProduct = await createMarketplaceProduct({ company: sellerCompany, user: seller, suffix: '8602', category });

    // Untargeted ("Everyone") campaign — should be visible to anonymous visitors.
    const everyoneCampaign = await createCampaign({
      actorId: admin._id,
      payload: {
        name: 'Everyone push',
        productId: everyoneProduct._id,
        status: 'active',
        popupCooldownMinutes: 30,
        creative: { title: 'Anyone can see this', ctaLabel: 'View Product' }
      }
    });

    // Behaviorally-targeted campaign — requires signals an anonymous visitor can't have.
    await createCampaign({
      actorId: admin._id,
      payload: {
        name: 'Shopper-targeted push',
        productId: targetedProduct._id,
        status: 'active',
        targeting: { mode: 'any', shopperCategories: [category] },
        creative: { title: 'Only for known shoppers', ctaLabel: 'View Product' }
      }
    });

    // No userId — the anonymous path. Must not throw and must not leak the
    // targeted campaign (which requires behavioral signals we can't have).
    const anonymousFeed = await getFeed({ userId: undefined, placement: 'dashboard_home', limit: 5 });
    expect(anonymousFeed.cards.length).toBe(1);
    expect(anonymousFeed.cards[0].campaignId).toBe(everyoneCampaign.id);
    expect(anonymousFeed.cards[0].sessionId).toMatch(/^adf_anon_/);
    expect(anonymousFeed.cards[0].popupCooldownMinutes).toBe(30);
    expect(anonymousFeed.cards[0].frequencyCapPerDay).toBe(3);

    // Anonymous impression/click events must record without a user id.
    const impressionEvent = await recordAdEvent({
      campaignId: everyoneCampaign.id,
      userId: undefined,
      type: 'impression',
      placement: 'dashboard_home',
      sessionId: anonymousFeed.cards[0].sessionId
    });
    expect(impressionEvent.type).toBe('impression');

    // Anonymous visitors are not frequency-capped server-side (no stable
    // identity) — repeated impressions must not remove the campaign from feed.
    const stillEligibleFeed = await getFeed({ userId: undefined, placement: 'dashboard_home', limit: 5 });
    expect(stillEligibleFeed.cards.length).toBe(1);
  });
});
