const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const Account = require('../src/models/account.model');
const InventoryBalance = require('../src/models/inventoryBalance.model');
const LedgerPosting = require('../src/models/ledgerPosting.model');
const StockMove = require('../src/models/stockMove.model');
const AccountingBill = require('../src/models/accountingBill.model');
const AccountingVoucherLog = require('../src/models/accountingVoucherLog.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');
const { SYSTEM_ACCOUNT_KEYS } = require('../src/constants/accounting');
const { createParty } = require('../src/modules/accounting/services/party.service');
const {
  createVoucher,
  voidVoucher,
  updateVoucher
} = require('../src/modules/accounting/services/voucher.service');
const { ensureAccountingSetup } = require('../src/modules/accounting/services/bootstrap.service');

jest.setTimeout(120000);

const makeUser = async (suffix) => {
  return User.create({
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
    email: `user-${suffix}@example.com`,
    phone: `+1555000${suffix}`,
    password: 'password123',
    accountType: 'manufacturer'
  });
};

const makeCompany = async (user) => {
  return Company.create({
    displayName: 'Test Manufacturing Co',
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

const makeProduct = async (companyId, userId, suffix = 'A') => {
  return Product.create({
    name: `Steel Rod ${suffix}`,
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

describe('Accounting voucher lifecycle', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
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

  test('sales invoice posting creates postings, stock move, and receivable bill', async () => {
    const user = await makeUser('1001');
    const company = await makeCompany(user);
    const product = await makeProduct(company._id, user._id, 'S1');
    await ensureAccountingSetup(company._id);

    const supplier = await createParty(company._id, { name: 'Supplier One', type: 'supplier' });
    const customer = await createParty(company._id, { name: 'Customer One', type: 'customer' });

    await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'purchase_bill',
        partyId: supplier._id,
        date: '2026-01-10',
        lines: {
          items: [{ product: product._id, quantity: 10, rate: 50, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    const voucher = await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'sales_invoice',
        partyId: customer._id,
        date: '2026-01-11',
        lines: {
          items: [{ product: product._id, quantity: 2, rate: 100, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    expect(voucher.status).toBe('posted');
    expect(voucher.totals.net).toBeGreaterThan(0);

    const postings = await LedgerPosting.find({ voucher: voucher._id, isVoided: { $ne: true } }).lean();
    const debit = postings.reduce((sum, item) => sum + Number(item.debit || 0), 0);
    const credit = postings.reduce((sum, item) => sum + Number(item.credit || 0), 0);
    expect(Number(debit.toFixed(2))).toBe(Number(credit.toFixed(2)));

    const moves = await StockMove.find({ voucher: voucher._id, direction: 'out', isVoided: { $ne: true } }).lean();
    expect(moves.length).toBeGreaterThan(0);

    const balance = await InventoryBalance.findOne({ company: company._id, product: product._id, variant: null }).lean();
    expect(Number(balance.onHandQtyBase)).toBe(8);

    const bill = await AccountingBill.findOne({ voucher: voucher._id, billType: 'receivable', status: 'open' }).lean();
    expect(bill).toBeTruthy();
    expect(Number(bill.balanceAmount)).toBe(Number(voucher.totals.net));
  });

  test('purchase bill posting increases inventory and records input GST posting', async () => {
    const user = await makeUser('1002');
    const company = await makeCompany(user);
    const product = await makeProduct(company._id, user._id, 'P1');
    await ensureAccountingSetup(company._id);
    const supplier = await createParty(company._id, { name: 'Supplier Two', type: 'supplier' });

    const voucher = await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'purchase_bill',
        partyId: supplier._id,
        date: '2026-01-12',
        lines: {
          items: [{ product: product._id, quantity: 5, rate: 80, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    const balance = await InventoryBalance.findOne({ company: company._id, product: product._id, variant: null }).lean();
    expect(Number(balance.onHandQtyBase)).toBe(5);
    expect(Number(balance.avgCost)).toBeGreaterThan(0);

    const inputGstAccount = await Account.findOne({ company: company._id, key: SYSTEM_ACCOUNT_KEYS.INPUT_CGST }).lean();
    const gstPosting = await LedgerPosting.findOne({
      voucher: voucher._id,
      account: inputGstAccount._id,
      isVoided: { $ne: true }
    }).lean();
    expect(gstPosting).toBeTruthy();
    expect(Number(gstPosting.debit)).toBeGreaterThan(0);
  });

  test('receipt voucher settles open receivable bill', async () => {
    const user = await makeUser('1003');
    const company = await makeCompany(user);
    const product = await makeProduct(company._id, user._id, 'R1');
    await ensureAccountingSetup(company._id);

    const supplier = await createParty(company._id, { name: 'Supplier Three', type: 'supplier' });
    const customer = await createParty(company._id, { name: 'Customer Three', type: 'customer' });

    await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'purchase_bill',
        partyId: supplier._id,
        date: '2026-01-13',
        lines: {
          items: [{ product: product._id, quantity: 10, rate: 70, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    const salesVoucher = await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'sales_invoice',
        partyId: customer._id,
        date: '2026-01-14',
        lines: {
          items: [{ product: product._id, quantity: 2, rate: 150, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    const cashAccount = await Account.findOne({ company: company._id, key: SYSTEM_ACCOUNT_KEYS.CASH }).lean();
    await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'receipt',
        partyId: customer._id,
        cashBankAccount: cashAccount._id,
        amount: 100
      },
      { status: 'posted' }
    );

    const bill = await AccountingBill.findOne({ voucher: salesVoucher._id }).lean();
    expect(Number(bill.settledAmount)).toBe(100);
    expect(Number(bill.balanceAmount)).toBe(Number((salesVoucher.totals.net - 100).toFixed(2)));
  });

  test('voiding posted sales voucher restores stock and voids artifacts', async () => {
    const user = await makeUser('1004');
    const company = await makeCompany(user);
    const product = await makeProduct(company._id, user._id, 'V1');
    await ensureAccountingSetup(company._id);

    const supplier = await createParty(company._id, { name: 'Supplier Four', type: 'supplier' });
    const customer = await createParty(company._id, { name: 'Customer Four', type: 'customer' });

    await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'purchase_bill',
        partyId: supplier._id,
        lines: {
          items: [{ product: product._id, quantity: 8, rate: 60, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    const salesVoucher = await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'sales_invoice',
        partyId: customer._id,
        lines: {
          items: [{ product: product._id, quantity: 3, rate: 120, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    await voidVoucher(company._id, salesVoucher._id, user._id, 'Test void');

    const refreshed = await Product.findById(product._id).lean();
    expect(Number(refreshed.availableQuantity)).toBe(8);

    const posting = await LedgerPosting.findOne({ voucher: salesVoucher._id }).lean();
    expect(posting.isVoided).toBe(true);
    const move = await StockMove.findOne({ voucher: salesVoucher._id }).lean();
    expect(move.isVoided).toBe(true);
  });

  test('same-day edit on posted voucher creates new revision and audit log', async () => {
    const user = await makeUser('1005');
    const company = await makeCompany(user);
    const product = await makeProduct(company._id, user._id, 'E1');
    await ensureAccountingSetup(company._id);

    const supplier = await createParty(company._id, { name: 'Supplier Five', type: 'supplier' });
    const customer = await createParty(company._id, { name: 'Customer Five', type: 'customer' });

    await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'purchase_bill',
        partyId: supplier._id,
        lines: {
          items: [{ product: product._id, quantity: 12, rate: 55, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    const salesVoucher = await createVoucher(
      company._id,
      user._id,
      {
        voucherType: 'sales_invoice',
        partyId: customer._id,
        lines: {
          items: [{ product: product._id, quantity: 2, rate: 100, tax: { gstRate: 18 } }]
        }
      },
      { status: 'posted' }
    );

    const updated = await updateVoucher(company._id, salesVoucher._id, user._id, {
      lines: {
        items: [{ product: product._id, quantity: 3, rate: 100, tax: { gstRate: 18 } }]
      },
      narration: 'Edited quantity'
    });

    expect(Number(updated.revision)).toBe(2);
    const logs = await AccountingVoucherLog.find({ voucher: salesVoucher._id }).lean();
    const hasUpdatedLog = logs.some((entry) => entry.action === 'updated');
    expect(hasUpdatedLog).toBe(true);
  });

  test('sales invoice fails when stock is insufficient', async () => {
    const user = await makeUser('1006');
    const company = await makeCompany(user);
    const product = await makeProduct(company._id, user._id, 'N1');
    await ensureAccountingSetup(company._id);

    const customer = await createParty(company._id, { name: 'Customer Six', type: 'customer' });

    await expect(
      createVoucher(
        company._id,
        user._id,
        {
          voucherType: 'sales_invoice',
          partyId: customer._id,
          lines: {
            items: [{ product: product._id, quantity: 1, rate: 100, tax: { gstRate: 18 } }]
          }
        },
        { status: 'posted' }
      )
    ).rejects.toThrow(/Insufficient stock/i);
  });
});

