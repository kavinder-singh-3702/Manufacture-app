process.env.NODE_ENV = 'test';
process.env.AWS_S3_BUCKET = '';
process.env.AWS_S3_REGION = '';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

const mockAuthUser = {
  id: new mongoose.Types.ObjectId().toString(),
  role: 'user',
  activeCompany: new mongoose.Types.ObjectId().toString()
};

jest.mock('../src/middleware/authMiddleware', () => ({
  authenticate: (req, res, next) => {
    req.user = { ...mockAuthUser };
    return next();
  },
  authenticateOptional: (req, res, next) => {
    req.user = { ...mockAuthUser };
    return next();
  },
  authorizeRoles: () => (req, res, next) => next()
}));

const app = require('../src/app');
const Product = require('../src/models/product.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');

jest.setTimeout(120000);

describe('POST /api/products/:productId/images storage failure response', () => {
  let mongoServer;
  let productId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(async () => {
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));

    const product = await Product.create({
      name: 'Upload Test Product',
      category: PRODUCT_CATEGORIES[0].id,
      subCategory: 'Upload Test',
      price: { amount: 150, currency: 'INR', unit: 'pcs' },
      minStockQuantity: 0,
      availableQuantity: 0,
      company: mockAuthUser.activeCompany,
      createdBy: mockAuthUser.id,
      lastUpdatedBy: mockAuthUser.id,
      visibility: 'public',
      status: 'active'
    });

    productId = product._id.toString();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('returns 503 + STORAGE_NOT_CONFIGURED when S3 env is missing', async () => {
    const response = await request(app).post(`/api/products/${productId}/images`).send({
      fileName: 'sample.png',
      mimeType: 'image/png',
      content: 'aGVsbG8='
    });

    expect(response.status).toBe(503);
    expect(response.body.code).toBe('STORAGE_NOT_CONFIGURED');
    expect(response.body.message).toContain('AWS_S3_BUCKET');
    expect(response.body.message).toContain('AWS_S3_REGION');
  });
});
