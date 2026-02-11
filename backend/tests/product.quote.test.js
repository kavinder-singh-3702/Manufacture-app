const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');
const {
  createQuote,
  listQuotes,
  getQuoteById,
  respondToQuote,
  updateQuoteStatus
} = require('../src/modules/quotes/services/quote.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Quote',
    lastName: 'Tester',
    displayName: `Quote ${suffix}`,
    email: `quote-${suffix}@example.com`,
    phone: `+1555600${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer'
  });

const createCompany = async (owner, suffix) =>
  Company.create({
    displayName: `Quote Co ${suffix}`,
    owner: owner._id,
    createdBy: owner._id,
    contact: { phone: `+9192000${suffix}` }
  });

const createProduct = async ({ company, user, suffix }) =>
  Product.create({
    name: `Quote Product ${suffix}`,
    category: PRODUCT_CATEGORIES[0].id,
    price: { amount: 180, currency: 'INR', unit: 'pcs' },
    minStockQuantity: 2,
    availableQuantity: 25,
    company: company._id,
    createdBy: user._id,
    createdByRole: 'user',
    sku: `QTE-${suffix}`,
    status: 'active',
    visibility: 'public'
  });

const ctx = (user, company) => ({
  id: String(user._id),
  role: user.role,
  activeCompany: company ? String(company._id) : undefined
});

const expectHttpError = async (promise, statusCode) => {
  try {
    await promise;
    throw new Error(`Expected HTTP ${statusCode} error`);
  } catch (error) {
    expect(error.statusCode || error.status).toBe(statusCode);
  }
};

describe('Product quote service', () => {
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

  test('buyer creates quote for marketplace product', async () => {
    const seller = await createUser('7101');
    const buyer = await createUser('7102');
    const sellerCompany = await createCompany(seller, '7101');
    const buyerCompany = await createCompany(buyer, '7102');
    const product = await createProduct({ company: sellerCompany, user: seller, suffix: '7101' });

    const quote = await createQuote(
      {
        productId: String(product._id),
        quantity: 50,
        requirements: 'Need repeat monthly supply with consistent sizing',
        targetPrice: 165,
        currency: 'inr'
      },
      ctx(buyer, buyerCompany)
    );

    expect(quote).toBeTruthy();
    expect(quote.status).toBe('pending');
    expect(String(quote.product._id)).toBe(String(product._id));
    expect(String(quote.buyer._id)).toBe(String(buyer._id));
    expect(String(quote.seller._id)).toBe(String(seller._id));
    expect(quote.request.quantity).toBe(50);
    expect(quote.request.currency).toBe('INR');
  });

  test('own-product quote attempt is rejected', async () => {
    const seller = await createUser('7201');
    const sellerCompany = await createCompany(seller, '7201');
    const product = await createProduct({ company: sellerCompany, user: seller, suffix: '7201' });

    await expectHttpError(
      createQuote(
        {
          productId: String(product._id),
          quantity: 10,
          requirements: 'Self request should fail'
        },
        ctx(seller, sellerCompany)
      ),
      403
    );
  });

  test('mode=asked returns requester records', async () => {
    const seller = await createUser('7301');
    const buyer = await createUser('7302');
    const sellerCompany = await createCompany(seller, '7301');
    const buyerCompany = await createCompany(buyer, '7302');
    const productA = await createProduct({ company: sellerCompany, user: seller, suffix: '7301A' });
    const productB = await createProduct({ company: sellerCompany, user: seller, suffix: '7301B' });

    await createQuote({ productId: String(productA._id), quantity: 5, requirements: 'Quote A' }, ctx(buyer, buyerCompany));
    await createQuote({ productId: String(productB._id), quantity: 15, requirements: 'Quote B' }, ctx(buyer, buyerCompany));

    const result = await listQuotes(ctx(buyer, buyerCompany), { mode: 'asked', limit: 10, offset: 0 });
    expect(result.quotes).toHaveLength(2);
    expect(result.pagination.total).toBe(2);
  });

  test('seller responds and status becomes quoted', async () => {
    const seller = await createUser('7401');
    const buyer = await createUser('7402');
    const sellerCompany = await createCompany(seller, '7401');
    const buyerCompany = await createCompany(buyer, '7402');
    const product = await createProduct({ company: sellerCompany, user: seller, suffix: '7401' });

    const quote = await createQuote(
      { productId: String(product._id), quantity: 12, requirements: 'Respond scenario' },
      ctx(buyer, buyerCompany)
    );

    const responded = await respondToQuote(
      String(quote._id),
      {
        unitPrice: 172,
        currency: 'INR',
        minOrderQty: 10,
        leadTimeDays: 7,
        notes: 'Can dispatch next week'
      },
      ctx(seller, sellerCompany)
    );

    expect(responded.status).toBe('quoted');
    expect(responded.response.unitPrice).toBe(172);
    expect(String(responded.response.respondedBy._id)).toBe(String(seller._id));
  });

  test('mode=received returns responded quotes for buyer', async () => {
    const seller = await createUser('7501');
    const buyer = await createUser('7502');
    const sellerCompany = await createCompany(seller, '7501');
    const buyerCompany = await createCompany(buyer, '7502');
    const product = await createProduct({ company: sellerCompany, user: seller, suffix: '7501' });

    const quote = await createQuote(
      { productId: String(product._id), quantity: 20, requirements: 'Need pricing' },
      ctx(buyer, buyerCompany)
    );

    await respondToQuote(String(quote._id), { unitPrice: 155, currency: 'INR' }, ctx(seller, sellerCompany));

    const received = await listQuotes(ctx(buyer, buyerCompany), { mode: 'received', limit: 10, offset: 0 });
    expect(received.quotes).toHaveLength(1);
    expect(received.quotes[0].status).toBe('quoted');
  });

  test('buyer accept/reject transitions work', async () => {
    const seller = await createUser('7601');
    const buyer = await createUser('7602');
    const sellerCompany = await createCompany(seller, '7601');
    const buyerCompany = await createCompany(buyer, '7602');
    const product = await createProduct({ company: sellerCompany, user: seller, suffix: '7601' });

    const acceptQuote = await createQuote(
      { productId: String(product._id), quantity: 30, requirements: 'Accept flow' },
      ctx(buyer, buyerCompany)
    );
    await respondToQuote(String(acceptQuote._id), { unitPrice: 149 }, ctx(seller, sellerCompany));
    const accepted = await updateQuoteStatus(String(acceptQuote._id), { status: 'accepted' }, ctx(buyer, buyerCompany));
    expect(accepted.status).toBe('accepted');

    const rejectQuote = await createQuote(
      { productId: String(product._id), quantity: 8, requirements: 'Reject flow' },
      ctx(buyer, buyerCompany)
    );
    await respondToQuote(String(rejectQuote._id), { unitPrice: 190 }, ctx(seller, sellerCompany));
    const rejected = await updateQuoteStatus(String(rejectQuote._id), { status: 'rejected', note: 'Price too high' }, ctx(buyer, buyerCompany));
    expect(rejected.status).toBe('rejected');

    await expectHttpError(
      updateQuoteStatus(String(rejectQuote._id), { status: 'accepted' }, ctx(buyer, buyerCompany)),
      400
    );
  });

  test('unauthorized user cannot read or mutate unrelated quote', async () => {
    const seller = await createUser('7701');
    const buyer = await createUser('7702');
    const intruder = await createUser('7703');
    const sellerCompany = await createCompany(seller, '7701');
    const buyerCompany = await createCompany(buyer, '7702');
    const intruderCompany = await createCompany(intruder, '7703');
    const product = await createProduct({ company: sellerCompany, user: seller, suffix: '7701' });

    const quote = await createQuote(
      { productId: String(product._id), quantity: 9, requirements: 'Private quote' },
      ctx(buyer, buyerCompany)
    );

    await expectHttpError(getQuoteById(String(quote._id), ctx(intruder, intruderCompany)), 403);
    await expectHttpError(
      updateQuoteStatus(String(quote._id), { status: 'cancelled' }, ctx(intruder, intruderCompany)),
      403
    );
  });

  test('incoming list paginates and filters by status', async () => {
    const seller = await createUser('7801');
    const buyer = await createUser('7802');
    const sellerCompany = await createCompany(seller, '7801');
    const buyerCompany = await createCompany(buyer, '7802');
    const product = await createProduct({ company: sellerCompany, user: seller, suffix: '7801' });

    const q1 = await createQuote({ productId: String(product._id), quantity: 11, requirements: 'Pending one' }, ctx(buyer, buyerCompany));
    const q2 = await createQuote({ productId: String(product._id), quantity: 12, requirements: 'Pending two' }, ctx(buyer, buyerCompany));
    const q3 = await createQuote({ productId: String(product._id), quantity: 13, requirements: 'Will be quoted' }, ctx(buyer, buyerCompany));

    await respondToQuote(String(q3._id), { unitPrice: 162 }, ctx(seller, sellerCompany));

    const pageOne = await listQuotes(ctx(seller, sellerCompany), { mode: 'incoming', limit: 1, offset: 0 });
    expect(pageOne.quotes).toHaveLength(1);
    expect(pageOne.pagination.total).toBe(3);
    expect(pageOne.pagination.hasMore).toBe(true);

    const pendingOnly = await listQuotes(ctx(seller, sellerCompany), {
      mode: 'incoming',
      status: 'pending',
      limit: 10,
      offset: 0
    });

    const pendingIds = pendingOnly.quotes.map((q) => String(q._id));
    expect(pendingIds).toContain(String(q1._id));
    expect(pendingIds).toContain(String(q2._id));
    expect(pendingIds).not.toContain(String(q3._id));
  });
});
