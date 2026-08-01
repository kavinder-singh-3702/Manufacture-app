const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const ProductVariant = require('../src/models/productVariant.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');
const {
  getAllProducts,
  getProductById,
  getProductsByCategory,
  createProduct: createProductRecord,
  updateProduct: updateProductRecord
} = require('../src/modules/product/services/product.service');
const {
  listVariants,
  createVariant: createVariantRecord,
  updateVariant: updateVariantRecord
} = require('../src/modules/product/services/productVariant.service');

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

const createProduct = async ({
  company,
  user,
  suffix,
  createdByRole = 'user',
  namePrefix = 'Catalog Item',
  visibility,
  status
}) =>
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
    ...(visibility ? { visibility } : {}),
    ...(status ? { status } : {}),
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
      createdBy: admin._id.toString(),
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

    const mismatchOwner = await getAllProducts(undefined, {
      search: 'alpha',
      createdByRole: 'admin',
      createdBy: operator._id.toString(),
      includeVariantSummary: true
    });
    expect(mismatchOwner.products).toHaveLength(0);
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

    const deniedByCompanyScope = await getProductById(product._id, {
      viewerCompanyId: outsiderCompany._id,
      ownerOnly: true,
      includeVariantSummary: true
    });
    expect(deniedByCompanyScope).toBeNull();

    const marketplaceResult = await getProductById(product._id, { includeVariantSummary: true });
    expect(marketplaceResult).toBeTruthy();
    expect(marketplaceResult.company.displayName).toBe(ownerCompany.displayName);
    expect(marketplaceResult.variantSummary.totalVariants).toBe(1);
    expect(marketplaceResult.variantSummary.inStockVariants).toBe(1);
  });

  // Regression coverage for the "Product not found" bug: opening a product
  // detail page as a signed-in user whose active company doesn't own the
  // product used to 404 because the default (no-scope) lookup silently
  // scoped to the viewer's own company. It should instead behave like
  // marketplace browsing — see anyone's published product — while still
  // hiding drafts/private listings from non-owners.
  test('getProductById: a signed-in viewer from a different company sees published products but not drafts/private ones', async () => {
    const owner = await createUser('3010');
    const viewer = await createUser('3011');
    const ownerCompany = await createCompany(owner, '3010');
    const viewerCompany = await createCompany(viewer, '3011');

    const published = await createProduct({ company: ownerCompany, user: owner, suffix: 'PUB1' });
    const draft = await createProduct({ company: ownerCompany, user: owner, suffix: 'DRAFT1', status: 'draft' });
    const privateProduct = await createProduct({ company: ownerCompany, user: owner, suffix: 'PRIV1', visibility: 'private' });

    // No scope param — the bug scenario: viewer has an active company, but
    // it isn't the product's owner.
    const viewerSeesPublished = await getProductById(published._id, { viewerCompanyId: viewerCompany._id });
    expect(viewerSeesPublished).toBeTruthy();
    expect(String(viewerSeesPublished._id)).toBe(String(published._id));

    const viewerBlockedFromDraft = await getProductById(draft._id, { viewerCompanyId: viewerCompany._id });
    expect(viewerBlockedFromDraft).toBeNull();

    const viewerBlockedFromPrivate = await getProductById(privateProduct._id, { viewerCompanyId: viewerCompany._id });
    expect(viewerBlockedFromPrivate).toBeNull();

    // The owner's own company still sees its drafts and private products in full.
    const ownerSeesDraft = await getProductById(draft._id, { viewerCompanyId: ownerCompany._id });
    expect(ownerSeesDraft).toBeTruthy();

    const ownerSeesPrivate = await getProductById(privateProduct._id, { viewerCompanyId: ownerCompany._id });
    expect(ownerSeesPrivate).toBeTruthy();

    // A guest (no viewer company at all) behaves like the marketplace case above.
    const guestSeesPublished = await getProductById(published._id, {});
    expect(guestSeesPublished).toBeTruthy();
    const guestBlockedFromDraft = await getProductById(draft._id, {});
    expect(guestBlockedFromDraft).toBeNull();
  });

  test('listVariants: a viewer from a different company sees variants of a published product but not a private one', async () => {
    const owner = await createUser('3012');
    const viewer = await createUser('3013');
    const ownerCompany = await createCompany(owner, '3012');
    const viewerCompany = await createCompany(viewer, '3013');

    const published = await createProduct({ company: ownerCompany, user: owner, suffix: 'PUB2' });
    await createVariant({ product: published, company: ownerCompany, user: owner, suffix: 'V1', price: 50, qty: 5 });
    const privateProduct = await createProduct({ company: ownerCompany, user: owner, suffix: 'PRIV2', visibility: 'private' });

    const viewerVariants = await listVariants(published._id, { viewerCompanyId: viewerCompany._id, limit: 20, offset: 0 });
    expect(viewerVariants).toBeTruthy();
    expect(viewerVariants.variants).toHaveLength(1);

    const viewerVariantsDenied = await listVariants(privateProduct._id, { viewerCompanyId: viewerCompany._id, limit: 20, offset: 0 });
    expect(viewerVariantsDenied).toBeNull();
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

    const variantsMarketplace = await listVariants(product._id, { limit: 20, offset: 0 });
    expect(variantsMarketplace).toBeTruthy();
    expect(variantsMarketplace.variants).toHaveLength(1);
  });

  test('product and variant create/update ignore stock fields in payload', async () => {
    const owner = await createUser('3006');
    const company = await createCompany(owner, '3006');

    const created = await createProductRecord(
      {
        name: 'Non Inventory Catalog Item',
        category: PRODUCT_CATEGORIES[0].id,
        subCategory: 'Non Inventory',
        price: { amount: 220, currency: 'INR', unit: 'pcs' },
        availableQuantity: 500,
        minStockQuantity: 50
      },
      owner._id,
      company._id,
      'user'
    );

    expect(Number(created.availableQuantity || 0)).toBe(0);
    expect(Number(created.minStockQuantity || 0)).toBe(0);

    const updated = await updateProductRecord(
      created._id,
      { availableQuantity: 400, minStockQuantity: 40, unit: 'pcs' },
      owner._id,
      company._id
    );

    expect(Number(updated.availableQuantity || 0)).toBe(0);
    expect(Number(updated.minStockQuantity || 0)).toBe(0);

    const createdVariant = await createVariantRecord(
      created._id,
      company._id,
      {
        title: 'Variant A',
        options: { pack: 'A' },
        price: { amount: 199, currency: 'INR', unit: 'pcs' },
        availableQuantity: 25,
        minStockQuantity: 3
      },
      owner._id
    );

    expect(Number(createdVariant.availableQuantity || 0)).toBe(0);
    expect(Number(createdVariant.minStockQuantity || 0)).toBe(0);

    const updatedVariant = await updateVariantRecord(
      created._id,
      createdVariant._id,
      { availableQuantity: 20, minStockQuantity: 2, title: 'Variant A+' },
      owner._id,
      company._id
    );

    expect(updatedVariant.title).toBe('Variant A+');
    expect(Number(updatedVariant.availableQuantity || 0)).toBe(0);
    expect(Number(updatedVariant.minStockQuantity || 0)).toBe(0);
  });
});
