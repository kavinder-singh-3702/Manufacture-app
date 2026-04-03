process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

jest.mock('../src/services/email.service', () => ({
  sendEmail: jest.fn(async () => ({ success: true })),
  sendDocumentRequestEmail: jest.fn(async () => ({ success: true })),
  sendSignupOtpEmail: jest.fn(async () => ({ success: true })),
  sendBusinessSetupSubmissionEmail: jest.fn(async () => ({ success: true })),
  sendBusinessSetupStatusEmail: jest.fn(async () => ({ success: true })),
  verifyConnection: jest.fn(async () => ({ success: true }))
}));

jest.mock('../src/modules/productOrders/services/razorpayGateway.service', () => ({
  createOrder: jest.fn(async ({ amount, currency, receipt, notes }) => ({
    id: `order_${receipt}`,
    amount,
    currency,
    receipt,
    status: 'created',
    notes
  })),
  fetchPayment: jest.fn(),
  verifyPaymentSignature: jest.fn(() => true),
  verifyWebhookSignature: jest.fn(() => true),
  getPublicConfig: jest.fn(() => ({ keyId: 'rzp_test_checkout_key' }))
}));

const app = require('../src/app');
const User = require('../src/models/user.model');
const ProductOrder = require('../src/models/productOrder.model');
const { signToken } = require('../src/utils/token');

jest.setTimeout(120000);

const createUser = async (suffix, role = 'user') =>
  User.create({
    firstName: 'Route',
    lastName: 'Tester',
    displayName: `Route ${suffix}`,
    email: `route-${suffix}@example.com`,
    phone: `+1555900${suffix}`,
    password: 'password123',
    role,
    status: 'active',
    accountType: 'manufacturer',
    address: {
      line1: `${suffix} Shipping Road`,
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India'
    }
  });

const createOrder = async ({ buyer, status = 'paid', paymentStatus = 'paid' }) =>
  ProductOrder.create({
    clientRequestId: `route_${buyer._id}_${status}`,
    buyer: {
      user: buyer._id,
      displayName: buyer.displayName,
      email: buyer.email,
      phone: buyer.phone
    },
    shippingAddress: buyer.address,
    source: 'buy_now',
    status,
    paymentStatus,
    paymentProvider: 'razorpay',
    lineItems: [
      {
        product: new mongoose.Types.ObjectId(),
        productName: 'Route Test Product',
        quantity: 1,
        unitPrice: 299,
        lineTotal: 299,
        currency: 'INR',
        purchaseConfig: {
          prepaidEnabled: true,
          paymentMode: 'full_prepay',
          provider: 'razorpay'
        }
      }
    ],
    totals: {
      subtotal: 299,
      total: 299,
      amountPaid: paymentStatus === 'paid' ? 299 : 0,
      currency: 'INR',
      itemCount: 1
    }
  });

describe('Product order routes', () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    await mongoose.connect(mongoServer.getUri());
  });

  afterEach(async () => {
    jest.clearAllMocks();
    const collections = mongoose.connection.collections;
    await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  test('buyer product order routes require authentication', async () => {
    const listResponse = await request(app).get('/api/product-orders');
    expect(listResponse.status).toBe(401);

    const checkoutResponse = await request(app).post('/api/product-orders/checkout-intent').send({
      source: 'buy_now',
      clientRequestId: 'route_checkout_auth',
      lines: []
    });
    expect(checkoutResponse.status).toBe(401);
  });

  test('authenticated buyer can read own orders', async () => {
    const buyer = await createUser('8201');
    await createOrder({ buyer });
    const token = signToken(buyer);

    const response = await request(app)
      .get('/api/product-orders')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.orders).toHaveLength(1);
    expect(response.body.orders[0].buyer.id).toBe(String(buyer._id));
  });

  test('admin product order routes reject non-admin users', async () => {
    const buyer = await createUser('8202', 'user');
    const token = signToken(buyer);

    const listResponse = await request(app)
      .get('/api/admin/product-orders')
      .set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(403);

    const order = await createOrder({ buyer });
    const patchResponse = await request(app)
      .patch(`/api/admin/product-orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing' });
    expect(patchResponse.status).toBe(403);
  });

  test('admin can list product orders and advance fulfillment status', async () => {
    const buyer = await createUser('8203', 'user');
    const admin = await createUser('8204', 'admin');
    const order = await createOrder({ buyer });
    const token = signToken(admin);

    const listResponse = await request(app)
      .get('/api/admin/product-orders')
      .set('Authorization', `Bearer ${token}`);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.orders).toHaveLength(1);

    const patchResponse = await request(app)
      .patch(`/api/admin/product-orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'processing' });

    expect(patchResponse.status).toBe(200);
    expect(patchResponse.body.order.status).toBe('processing');
  });
});
