const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const AccountingVoucher = require('../src/models/accountingVoucher.model');
const LedgerPosting = require('../src/models/ledgerPosting.model');
const StockMove = require('../src/models/stockMove.model');

const {
  listInternalInventoryItems,
  getInternalInventoryItemById,
  createInternalInventoryItem,
  updateInternalInventoryItem,
  deleteInternalInventoryItem,
  adjustInternalInventoryItem,
  listInternalInventoryMovements,
  getInternalInventoryDashboard
} = require('../src/modules/accounting/services/internalInventory.service');

jest.setTimeout(120000);

const makeUser = async (suffix) =>
  User.create({
    firstName: 'Internal',
    lastName: 'Inventory',
    displayName: 'Internal Inventory User',
    email: `internal-inventory-${suffix}@example.com`,
    phone: `+1555200${suffix}`,
    password: 'password123',
    accountType: 'manufacturer'
  });

const makeCompany = async (user) =>
  Company.create({
    displayName: 'Internal Inventory Co',
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

describe('Accounting internal inventory service', () => {
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

  test('supports create/update/adjust/delete lifecycle with movements and dashboard aggregation', async () => {
    const user = await makeUser('3001');
    const company = await makeCompany(user);

    const created = await createInternalInventoryItem(company._id, user._id, {
      name: 'Copper Wire Roll',
      sku: 'cw-100',
      category: 'Electrical',
      unit: 'roll',
      onHandQty: 12,
      reorderLevel: 5,
      avgCost: 25
    });

    expect(created.name).toBe('Copper Wire Roll');
    expect(created.sku).toBe('CW-100');
    expect(created.onHandQty).toBe(12);
    expect(created.totalValue).toBe(300);

    const listed = await listInternalInventoryItems(company._id, { limit: 20, offset: 0 });
    expect(listed.pagination.total).toBe(1);
    expect(listed.items[0].name).toBe('Copper Wire Roll');

    const fetched = await getInternalInventoryItemById(company._id, created._id);
    expect(fetched).toBeTruthy();
    expect(fetched.stockStatus).toBe('in_stock');

    const updated = await updateInternalInventoryItem(company._id, created._id, user._id, {
      reorderLevel: 15,
      avgCost: 30,
      category: 'Electrical Components'
    });

    expect(updated.reorderLevel).toBe(15);
    expect(updated.avgCost).toBe(30);
    expect(updated.totalValue).toBe(360);
    expect(updated.stockStatus).toBe('low_stock');

    const stockOut = await adjustInternalInventoryItem(company._id, created._id, user._id, {
      movementType: 'out',
      quantity: 4,
      note: 'Used in internal production'
    });

    expect(stockOut.item.onHandQty).toBe(8);
    expect(stockOut.item.totalValue).toBe(240);
    expect(stockOut.movement.qtyDelta).toBe(-4);

    const stockIn = await adjustInternalInventoryItem(company._id, created._id, user._id, {
      movementType: 'in',
      quantity: 2,
      unitCost: 45,
      note: 'Purchased for internal use'
    });

    expect(stockIn.item.onHandQty).toBe(10);
    expect(stockIn.item.totalValue).toBe(330);
    expect(stockIn.item.avgCost).toBe(33);

    const movements = await listInternalInventoryMovements(company._id, created._id, { limit: 10, offset: 0 });
    expect(movements.pagination.total).toBe(3);
    expect(movements.rows[0].movementType).toBeTruthy();

    const dashboard = await getInternalInventoryDashboard(company._id);
    expect(dashboard.totalItems).toBe(1);
    expect(dashboard.totalQuantity).toBe(10);
    expect(dashboard.totalValue).toBe(330);
    expect(dashboard.lowStockCount).toBe(1);
    expect(Array.isArray(dashboard.categoryDistribution)).toBe(true);
    expect(Array.isArray(dashboard.recentMovements)).toBe(true);

    const deleted = await deleteInternalInventoryItem(company._id, created._id, user._id);
    expect(deleted).toBe(true);

    const afterDeleteList = await listInternalInventoryItems(company._id, { limit: 20, offset: 0 });
    expect(afterDeleteList.pagination.total).toBe(0);
  });

  test('blocks negative stock and never posts accounting artifacts', async () => {
    const user = await makeUser('3002');
    const company = await makeCompany(user);

    const created = await createInternalInventoryItem(company._id, user._id, {
      name: 'Internal Valve',
      sku: 'iv-01',
      category: 'Mechanical',
      onHandQty: 3,
      reorderLevel: 1,
      avgCost: 100
    });

    await expect(
      adjustInternalInventoryItem(company._id, created._id, user._id, {
        movementType: 'out',
        quantity: 5,
        note: 'Attempt overdraw'
      })
    ).rejects.toThrow('Insufficient stock');

    await adjustInternalInventoryItem(company._id, created._id, user._id, {
      movementType: 'out',
      quantity: 2,
      note: 'Valid issue'
    });

    const [voucherCount, ledgerCount, stockMoveCount] = await Promise.all([
      AccountingVoucher.countDocuments({ company: company._id }),
      LedgerPosting.countDocuments({ company: company._id }),
      StockMove.countDocuments({ company: company._id })
    ]);

    expect(voucherCount).toBe(0);
    expect(ledgerCount).toBe(0);
    expect(stockMoveCount).toBe(0);
  });
});
