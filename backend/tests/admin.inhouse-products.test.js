const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

jest.mock('../src/modules/accounting/services/stockAdjustment.service', () => ({
  createStockAdjustmentForItem: jest.fn(async () => ({
    id: 'mock-stock-adjustment-voucher'
  }))
}));

const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const {
  createCompany,
  listCompanies
} = require('../src/modules/company/services/company.service');
const {
  createInhouseProduct,
  listInhouseProducts,
  getInhouseProductById,
  updateInhouseProduct,
  adjustInhouseProductQuantity,
  deleteInhouseProduct,
  createInhouseVariant,
  listInhouseVariants,
  updateInhouseVariant,
  adjustInhouseVariantQuantity,
  deleteInhouseVariant
} = require('../src/modules/product/services/adminInhouseProduct.service');
const { getAllProducts } = require('../src/modules/product/services/product.service');
const {
  ADMIN_PERMISSIONS,
  assertAdminPermission
} = require('../src/modules/admin/permissions');
const {
  INHOUSE_COMPANY_QUERY
} = require('../src/modules/company/utils/inhouseCatalog.util');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Inhouse',
    lastName: 'Tester',
    displayName: `Inhouse ${suffix}`,
    email: `inhouse-${suffix}@example.com`,
    phone: `+1555700${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer',
    status: 'active'
  });

describe('Admin in-house products', () => {
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

  test('admin create works without activeCompany and product is marketplace visible', async () => {
    const admin = await createUser('9101', 'admin');

    const product = await createInhouseProduct({
      actorUserId: admin._id.toString(),
      actorRole: 'admin',
      payload: {
        name: 'ARVANN Premium Belt',
        category: 'consumer-goods-fmcg',
        subCategory: 'Bags, belts & wallets',
        price: { amount: 1499, currency: 'INR', unit: 'piece' },
        availableQuantity: 25,
        minStockQuantity: 3
      }
    });

    expect(product).toBeTruthy();
    expect(product.createdByRole).toBe('admin');
    expect(product.visibility).toBe('public');
    expect(product.status).toBe('active');

    const listedMarketplace = await getAllProducts(undefined, {
      search: 'premium belt',
      includeVariantSummary: true
    });
    expect(listedMarketplace.products.length).toBe(1);
    expect(String(listedMarketplace.products[0]._id)).toBe(String(product._id));

    const company = await Company.findOne(INHOUSE_COMPANY_QUERY).lean();
    expect(company).toBeTruthy();
  });

  test('in-house product create/update ignore stock fields in payload', async () => {
    const admin = await createUser('9106', 'admin');

    const product = await createInhouseProduct({
      actorUserId: admin._id.toString(),
      actorRole: 'admin',
      payload: {
        name: 'ARVANN Non Inventory Product',
        category: 'consumer-goods-fmcg',
        subCategory: 'Kitchenware & utensils',
        price: { amount: 499, currency: 'INR', unit: 'piece' },
        availableQuantity: 999,
        minStockQuantity: 111
      }
    });

    expect(Number(product.availableQuantity || 0)).toBe(0);
    expect(Number(product.minStockQuantity || 0)).toBe(0);

    const updated = await updateInhouseProduct({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      updates: {
        availableQuantity: 888,
        minStockQuantity: 222,
        unit: 'piece'
      }
    });

    expect(Number(updated.availableQuantity || 0)).toBe(0);
    expect(Number(updated.minStockQuantity || 0)).toBe(0);
  });

  test('super-admin products are normalized to createdByRole=admin', async () => {
    const superAdmin = await createUser('9102', 'super-admin');

    const product = await createInhouseProduct({
      actorUserId: superAdmin._id.toString(),
      actorRole: 'super-admin',
      payload: {
        name: 'ARVANN Inhouse Fastener Kit',
        category: 'metal-steel-industry',
        subCategory: 'Metal fabrication',
        price: { amount: 299, currency: 'INR', unit: 'box' },
        availableQuantity: 80,
        minStockQuantity: 10
      }
    });

    expect(product.createdByRole).toBe('admin');
  });

  test('permission checks deny non-admins for in-house mutations', async () => {
    expect(() =>
      assertAdminPermission({ role: 'user' }, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS)
    ).toThrow('You are not allowed to perform this admin action');

    expect(() =>
      assertAdminPermission({ role: 'admin' }, ADMIN_PERMISSIONS.MUTATE_INHOUSE_PRODUCTS)
    ).not.toThrow();
  });

  test('in-house variants support CRUD and quantity adjustments', async () => {
    const admin = await createUser('9103', 'admin');

    const product = await createInhouseProduct({
      actorUserId: admin._id.toString(),
      actorRole: 'admin',
      payload: {
        name: 'ARVANN Industrial Cleaner',
        category: 'chemical-manufacturing',
        subCategory: 'Home cleaning products',
        price: { amount: 200, currency: 'INR', unit: 'bottle' },
        availableQuantity: 100,
        minStockQuantity: 15
      }
    });

    const createdVariant = await createInhouseVariant({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      payload: {
        title: '1L Pack',
        options: { size: '1L' },
        price: { amount: 320, currency: 'INR', unit: 'pack' },
        availableQuantity: 40,
        minStockQuantity: 5
      }
    });

    expect(createdVariant).toBeTruthy();
    expect(createdVariant.title).toBe('1L Pack');

    const listed = await listInhouseVariants({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      query: { limit: 20, offset: 0 }
    });
    expect(listed.variants.length).toBe(1);

    const updated = await updateInhouseVariant({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      variantId: createdVariant._id.toString(),
      updates: { title: '1L Value Pack' }
    });
    expect(updated.title).toBe('1L Value Pack');

    const adjusted = await adjustInhouseVariantQuantity({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      variantId: createdVariant._id.toString(),
      adjustment: 5
    });
    expect(adjusted._id.toString()).toBe(createdVariant._id.toString());

    const removed = await deleteInhouseVariant({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      variantId: createdVariant._id.toString()
    });
    expect(removed).toBe(true);
  });

  test('in-house variant create/update ignore stock fields in payload', async () => {
    const admin = await createUser('9107', 'admin');

    const product = await createInhouseProduct({
      actorUserId: admin._id.toString(),
      actorRole: 'admin',
      payload: {
        name: 'ARVANN Variant Non Inventory Product',
        category: 'chemical-manufacturing',
        subCategory: 'Industrial chemicals',
        price: { amount: 260, currency: 'INR', unit: 'pack' }
      }
    });

    const createdVariant = await createInhouseVariant({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      payload: {
        title: '2L Pack',
        options: { size: '2L' },
        price: { amount: 480, currency: 'INR', unit: 'pack' },
        availableQuantity: 77,
        minStockQuantity: 9
      }
    });

    expect(Number(createdVariant.availableQuantity || 0)).toBe(0);
    expect(Number(createdVariant.minStockQuantity || 0)).toBe(0);

    const updatedVariant = await updateInhouseVariant({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      variantId: createdVariant._id.toString(),
      updates: {
        availableQuantity: 66,
        minStockQuantity: 8,
        title: '2L Pro Pack'
      }
    });

    expect(updatedVariant.title).toBe('2L Pro Pack');
    expect(Number(updatedVariant.availableQuantity || 0)).toBe(0);
    expect(Number(updatedVariant.minStockQuantity || 0)).toBe(0);
  });

  test('hidden in-house company does not appear in normal company switcher listing', async () => {
    const admin = await createUser('9104', 'admin');

    await createInhouseProduct({
      actorUserId: admin._id.toString(),
      actorRole: 'admin',
      payload: {
        name: 'ARVANN Test Item',
        category: 'packaging',
        subCategory: 'Cartons & duplex boxes',
        price: { amount: 99, currency: 'INR', unit: 'piece' },
        availableQuantity: 20,
        minStockQuantity: 2
      }
    });

    await createCompany(admin._id.toString(), {
      displayName: 'Admin Visible Company',
      legalName: 'Admin Visible Company Pvt Ltd',
      categories: ['consumer-goods-fmcg']
    });

    const companies = await listCompanies(admin._id.toString());
    expect(companies.length).toBe(1);
    expect(companies[0].displayName).toBe('Admin Visible Company');
  });

  test('admin in-house list/detail/update/delete product workflow works', async () => {
    const admin = await createUser('9105', 'admin');
    const product = await createInhouseProduct({
      actorUserId: admin._id.toString(),
      actorRole: 'admin',
      payload: {
        name: 'ARVANN Packaging Tape',
        category: 'paper-packaging-industry',
        subCategory: 'Flexible packaging (pouches, films)',
        price: { amount: 55, currency: 'INR', unit: 'roll' },
        availableQuantity: 200,
        minStockQuantity: 30
      }
    });

    const listed = await listInhouseProducts({
      actorUserId: admin._id.toString(),
      query: { search: 'packaging tape', limit: 10, offset: 0 }
    });
    expect(listed.requests).toBeUndefined();
    expect(listed.products.length).toBe(1);

    const detailed = await getInhouseProductById({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      includeVariantSummary: true
    });
    expect(detailed.name).toContain('Packaging Tape');

    const updated = await updateInhouseProduct({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      updates: { name: 'ARVANN Packaging Tape Pro' }
    });
    expect(updated.name).toBe('ARVANN Packaging Tape Pro');

    const quantityAdjusted = await adjustInhouseProductQuantity({
      actorUserId: admin._id.toString(),
      productId: product._id.toString(),
      adjustment: 10
    });
    expect(quantityAdjusted._id.toString()).toBe(product._id.toString());

    const deleted = await deleteInhouseProduct({
      actorUserId: admin._id.toString(),
      productId: product._id.toString()
    });
    expect(deleted).toBe(true);

    const deletedDoc = await Product.findById(product._id).lean();
    expect(deletedDoc.deletedAt).toBeTruthy();
  });
});
