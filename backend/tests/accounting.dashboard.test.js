const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');
const { createParty } = require('../src/modules/accounting/services/party.service');
const { createVoucher } = require('../src/modules/accounting/services/voucher.service');
const { ensureAccountingSetup } = require('../src/modules/accounting/services/bootstrap.service');
const { dashboard } = require('../src/modules/accounting/services/reports.service');

jest.setTimeout(120000);

const makeUser = async (suffix) => {
  return User.create({
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    email: `dash-user-${suffix}@example.com`,
    phone: `+1555100${suffix}`,
    password: 'password123',
    accountType: 'manufacturer'
  });
};

const makeCompany = async (user) => {
  return Company.create({
    displayName: 'Dashboard Test Co',
    type: 'manufacturer',
    owner: user._id,
    createdBy: user._id,
    settings: {
      timezone: 'Asia/Kolkata',
      currency: 'INR',
      fiscalYearStartMonth: 3
    },
    headquarters: {
      state: 'maharashtra',
      country: 'india'
    }
  });
};

const makeProduct = async (companyId, userId, suffix = 'D') => {
  return Product.create({
    name: `Dashboard Item ${suffix}`,
    category: PRODUCT_CATEGORIES[0].id,
    price: {
      amount: 100,
      currency: 'INR',
      unit: 'pcs'
    },
    company: companyId,
    createdBy: userId,
    createdByRole: 'user',
    availableQuantity: 0,
    minStockQuantity: 0,
    unit: 'pcs'
  });
};

describe('Accounting dashboard report', () => {
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

  test('dashboard includes receipts/payments totals, recent vouchers, and product names for top items', async () => {
    const user = await makeUser('2001');
    const company = await makeCompany(user);
    const product = await makeProduct(company._id, user._id, 'A1');
    await ensureAccountingSetup(company._id);

    const supplier = await createParty(company._id, { name: 'Dash Supplier', type: 'supplier' });
    const customer = await createParty(company._id, { name: 'Dash Customer', type: 'customer' });

    await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'purchase_bill',
        partyId: supplier._id,
        date: '2026-01-02',
        lines: {
          items: [{ product: product._id, quantity: 20, rate: 50, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'sales_invoice',
        partyId: customer._id,
        date: '2026-01-03',
        lines: {
          items: [{ product: product._id, quantity: 5, rate: 100, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'receipt',
        partyId: customer._id,
        date: '2026-01-04',
        amount: 150,
        paymentMode: 'cash'
      },
      { status: 'posted' }
    );

    await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'payment',
        partyId: supplier._id,
        date: '2026-01-05',
        amount: 75,
        paymentMode: 'bank'
      },
      { status: 'posted' }
    );

    const data = await dashboard(company._id, { from: '2026-01-01', to: '2026-01-31' });

    expect(data.receipts).toBe(150);
    expect(data.payments).toBe(75);

    expect(Array.isArray(data.recentVouchers)).toBe(true);
    expect(data.recentVouchers.length).toBeLessThanOrEqual(5);

    const voucherWithParty = data.recentVouchers.find((item) => item.party);
    expect(voucherWithParty).toBeTruthy();
    expect(typeof voucherWithParty.party).toBe('object');
    expect(voucherWithParty.party.name).toBeTruthy();

    expect(Array.isArray(data.topItems)).toBe(true);
    const productTopItem = data.topItems.find((item) => String(item?._id?.product) === product._id.toString());
    expect(productTopItem).toBeTruthy();
    expect(productTopItem.productName).toBe(product.name);
  });
});
