const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const ProductVariant = require('../src/models/productVariant.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');
const { getAllProducts, getProductById, getProductsByCategory } = require('../src/modules/product/services/product.service');
const { listVariants } = require('../src/modules/product/services/productVariant.service');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Catalog',
    lastName: 'User',
    displayName: `Catalog ${suffix}`,
    email: `catalog-${suffix}@example.com`,
    phone: `+1555200${suffix}`,
    password: 'password123',
    role,
    accountType: 'manufacturer'
  });

const createCompany = async (user, suffix) =>
  Company.create({
    displayName: `Catalog Co ${suffix}`,
    owner: user._id,
    createdBy: user._id,
    contact: {
      phone: `+91123456${suffix}`
    }
  });

const createProduct = async ({ company, user, suffix, createdByRole = 'user', namePrefix = 'Catalog Item' }) =>
  Product.create({
    name: `${namePrefix} ${suffix}`,
    category: PRODUCT_CATEGORIES[0].id,
    subCategory: 'Test Sub',
    price: { amount: 120, currency: 'INR', unit: 'pcs' },
    minStockQuantity: 2,
    availableQuantity: 10,
    company: company._id,
    createdBy: user._id,
    createdByRole,
    sku: `SKU-${suffix}`
  });

const createVariant = async ({ product, company, user, suffix, price, qty, status = 'active' }) =>
  ProductVariant.create({
    product: product._id,
    company: company._id,
    title: `Variant ${suffix}`,
    options: { size: suffix },
    price: { amount: price, currency: 'INR', unit: 'pcs' },
    availableQuantity: qty,
    minStockQuantity: 1,
    status,
    createdBy: user._id,
    lastUpdatedBy: user._id
  });

describe('Product catalog services', () => {
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

  test('getAllProducts supports search + createdByRole and returns variant summary', async () => {
    const admin = await createUser('3001', 'admin');
    const operator = await createUser('3002', 'user');
    const adminCompany = await createCompany(admin, '3001');
    const userCompany = await createCompany(operator, '3002');

    const adminProduct = await createProduct({
      company: adminCompany,
      user: admin,
      suffix: 'A1',
      createdByRole: 'admin',
      namePrefix: 'Alpha'
    });
    await createProduct({
      company: userCompany,
      user: operator,
      suffix: 'B1',
      createdByRole: 'user',
      namePrefix: 'Alpha'
    });

    await createVariant({ product: adminProduct, company: adminCompany, user: admin, suffix: '500ml', price: 110, qty: 5 });
    await createVariant({ product: adminProduct, company: adminCompany, user: admin, suffix: '1L', price: 180, qty: 0 });

    const response = await getAllProducts(undefined, {
      search: 'alpha',
      createdByRole: 'admin',
      includeVariantSummary: true
    });

    expect(response.products).toHaveLength(1);
    const item = response.products[0];
    expect(item._id.toString()).toBe(adminProduct._id.toString());
    expect(item.company).toBeTruthy();
    expect(item.company.displayName).toBe(adminCompany.displayName);
    expect(item.company.contact.phone).toBe(adminCompany.contact.phone);
    expect(item.variantSummary).toEqual(
      expect.objectContaining({
        totalVariants: 2,
        inStockVariants: 1,
        minPrice: 110,
        maxPrice: 180,
        currency: 'INR'
      })
    );
  });

  test('getProductById respects marketplace/company scope and includes variant summary', async () => {
    const owner = await createUser('3003');
    const outsider = await createUser('3004');
    const ownerCompany = await createCompany(owner, '3003');
    const outsiderCompany = await createCompany(outsider, '3004');

    const product = await createProduct({
      company: ownerCompany,
      user: owner,
      suffix: 'C1',
      createdByRole: 'user'
    });
    await createVariant({ product, company: ownerCompany, user: owner, suffix: '250ml', price: 90, qty: 2 });

    const deniedByCompanyScope = await getProductById(product._id, outsiderCompany._id, { includeVariantSummary: true });
    expect(deniedByCompanyScope).toBeNull();

    const marketplaceResult = await getProductById(product._id, undefined, { includeVariantSummary: true });
    expect(marketplaceResult).toBeTruthy();
    expect(marketplaceResult.company.displayName).toBe(ownerCompany.displayName);
    expect(marketplaceResult.variantSummary.totalVariants).toBe(1);
    expect(marketplaceResult.variantSummary.inStockVariants).toBe(1);
  });

  test('category listing and variant listing work for marketplace scope', async () => {
    const owner = await createUser('3005');
    const company = await createCompany(owner, '3005');
    const product = await createProduct({
      company,
      user: owner,
      suffix: 'D1',
      createdByRole: 'admin'
    });
    await createVariant({ product, company, user: owner, suffix: 'Mini', price: 70, qty: 3 });

    const byCategory = await getProductsByCategory(undefined, product.category, {
      includeVariantSummary: true,
      createdByRole: 'admin'
    });
    expect(byCategory.products.length).toBeGreaterThanOrEqual(1);
    const matched = byCategory.products.find((item) => String(item._id) === String(product._id));
    expect(matched).toBeTruthy();
    expect(matched.variantSummary.totalVariants).toBe(1);

    const variantsMarketplace = await listVariants(product._id, undefined, { limit: 20, offset: 0 });
    expect(variantsMarketplace).toBeTruthy();
    expect(variantsMarketplace.variants).toHaveLength(1);
  });
});

