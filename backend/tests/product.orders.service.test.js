const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');

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

const gateway = require('../src/modules/productOrders/services/razorpayGateway.service');
const User = require('../src/models/user.model');
const Company = require('../src/models/company.model');
const Product = require('../src/models/product.model');
const ProductOrder = require('../src/models/productOrder.model');
const PaymentAttempt = require('../src/models/paymentAttempt.model');
const PaymentWebhookEvent = require('../src/models/paymentWebhookEvent.model');
const { PRODUCT_CATEGORIES } = require('../src/constants/product');
const { INHOUSE_COMPANY_INTERNAL_TYPE } = require('../src/modules/company/utils/inhouseCatalog.util');
const {
  createCheckoutIntent,
  verifyOrderPayment,
  processRazorpayWebhook
} = require('../src/modules/productOrders/services/productOrder.service');

jest.setTimeout(120000);

const createUser = async (suffix, overrides = {}) =>
  User.create({
    firstName: 'Payment',
    lastName: 'Tester',
    displayName: `Payment ${suffix}`,
    email: `payment-${suffix}@example.com`,
    phone: `+1555800${suffix}`,
    password: 'password123',
    role: 'user',
    status: 'active',
    accountType: 'manufacturer',
    address: {
      line1: `${suffix} Market Road`,
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      country: 'India'
    },
    ...overrides
  });

const createCompany = async ({ owner, suffix, inhouse = false }) =>
  Company.create({
    displayName: `${inhouse ? 'Inhouse' : 'Seller'} Co ${suffix}`,
    owner: owner._id,
    createdBy: owner._id,
    contact: { phone: `+9193000${suffix}` },
    metadata: inhouse ? { internalType: INHOUSE_COMPANY_INTERNAL_TYPE } : {}
  });

const createProduct = async ({
  company,
  user,
  suffix,
  prepaidEnabled = false,
  amount = 199,
  status = 'active',
  visibility = 'public'
}) =>
  Product.create({
    name: `Checkout Product ${suffix}`,
    category: PRODUCT_CATEGORIES[0].id,
    subCategory: 'Shop Item',
    price: { amount, currency: 'INR', unit: 'pcs' },
    company: company._id,
    createdBy: user._id,
    createdByRole: 'admin',
    sku: `CHK-${suffix}`,
    status,
    visibility,
    purchaseOptions: prepaidEnabled
      ? {
          prepaidEnabled: true,
          paymentMode: 'full_prepay',
          provider: 'razorpay'
        }
      : {
          prepaidEnabled: false,
          paymentMode: 'none',
          provider: 'none'
        }
  });

const expectHttpError = async (promise, statusCode) => {
  try {
    await promise;
    throw new Error(`Expected HTTP ${statusCode} error`);
  } catch (error) {
    expect(error.statusCode || error.status).toBe(statusCode);
    return error;
  }
};

describe('Product orders payment service', () => {
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

  test('checkout intent rejects products outside the in-house prepaid catalog', async () => {
    const buyer = await createUser('8101');
    const seller = await createUser('8102');
    const sellerCompany = await createCompany({ owner: seller, suffix: '8102', inhouse: false });
    const marketplaceProduct = await createProduct({
      company: sellerCompany,
      user: seller,
      suffix: '8102',
      prepaidEnabled: true
    });

    const error = await expectHttpError(
      createCheckoutIntent({
        buyerUserId: String(buyer._id),
        payload: {
          source: 'buy_now',
          clientRequestId: 'client_non_inhouse',
          lines: [{ productId: String(marketplaceProduct._id), quantity: 1 }]
        }
      }),
      422
    );

    expect(error.message).toContain('not eligible');
  });

  test('checkout intent rejects in-house products when prepaid is disabled', async () => {
    const buyer = await createUser('8103');
    const admin = await createUser('8104', { role: 'admin' });
    const inhouseCompany = await createCompany({ owner: admin, suffix: '8104', inhouse: true });
    const disabledProduct = await createProduct({
      company: inhouseCompany,
      user: admin,
      suffix: '8104',
      prepaidEnabled: false
    });

    const error = await expectHttpError(
      createCheckoutIntent({
        buyerUserId: String(buyer._id),
        payload: {
          source: 'buy_now',
          clientRequestId: 'client_prepaid_disabled',
          lines: [{ productId: String(disabledProduct._id), quantity: 1 }]
        }
      }),
      422
    );

    expect(error.message).toContain('not eligible');
  });

  test('checkout intent supports buy-now and cart totals with address snapshotting', async () => {
    const buyer = await createUser('8105');
    const admin = await createUser('8106', { role: 'admin' });
    const inhouseCompany = await createCompany({ owner: admin, suffix: '8106', inhouse: true });
    const productA = await createProduct({
      company: inhouseCompany,
      user: admin,
      suffix: '8106A',
      prepaidEnabled: true,
      amount: 249
    });
    const productB = await createProduct({
      company: inhouseCompany,
      user: admin,
      suffix: '8106B',
      prepaidEnabled: true,
      amount: 399
    });

    const buyNow = await createCheckoutIntent({
      buyerUserId: String(buyer._id),
      payload: {
        source: 'buy_now',
        clientRequestId: 'client_buy_now',
        lines: [{ productId: String(productA._id), quantity: 2 }],
        shippingAddress: {
          line1: '42 Custom Lane',
          city: 'Pune',
          state: 'Maharashtra',
          postalCode: '411001',
          country: 'India'
        }
      }
    });

    expect(buyNow.order.source).toBe('buy_now');
    expect(buyNow.order.lineItems).toHaveLength(1);
    expect(buyNow.order.totals.total).toBe(498);
    expect(buyNow.order.shippingAddress.line1).toBe('42 Custom Lane');
    expect(buyNow.payment.amount).toBe(49800);

    const cartOrder = await createCheckoutIntent({
      buyerUserId: String(buyer._id),
      payload: {
        source: 'cart',
        clientRequestId: 'client_cart',
        lines: [
          { productId: String(productA._id), quantity: 1 },
          { productId: String(productB._id), quantity: 2 }
        ]
      }
    });

    expect(cartOrder.order.source).toBe('cart');
    expect(cartOrder.order.lineItems).toHaveLength(2);
    expect(cartOrder.order.totals.itemCount).toBe(3);
    expect(cartOrder.order.totals.total).toBe(1047);
    expect(cartOrder.order.shippingAddress.line1).toBe(buyer.address.line1);
    expect(gateway.createOrder).toHaveBeenCalledTimes(2);
  });

  test('verify payment rejects invalid signatures before provider fetch', async () => {
    const buyer = await createUser('8107');
    const admin = await createUser('8108', { role: 'admin' });
    const inhouseCompany = await createCompany({ owner: admin, suffix: '8108', inhouse: true });
    const product = await createProduct({
      company: inhouseCompany,
      user: admin,
      suffix: '8108',
      prepaidEnabled: true
    });

    const checkout = await createCheckoutIntent({
      buyerUserId: String(buyer._id),
      payload: {
        source: 'buy_now',
        clientRequestId: 'client_verify_invalid_sig',
        lines: [{ productId: String(product._id), quantity: 1 }]
      }
    });

    gateway.verifyPaymentSignature.mockReturnValueOnce(false);

    await expectHttpError(
      verifyOrderPayment({
        buyerUserId: String(buyer._id),
        payload: {
          orderId: checkout.order.id,
          razorpay_order_id: checkout.payment.razorpayOrderId,
          razorpay_payment_id: 'pay_invalid_sig',
          razorpay_signature: 'bad_signature'
        }
      }),
      400
    );

    expect(gateway.fetchPayment).not.toHaveBeenCalled();
  });

  test('captured webhook promotes authorized orders once and dedupes duplicates', async () => {
    const buyer = await createUser('8109');
    const admin = await createUser('8110', { role: 'admin' });
    const inhouseCompany = await createCompany({ owner: admin, suffix: '8110', inhouse: true });
    const product = await createProduct({
      company: inhouseCompany,
      user: admin,
      suffix: '8110',
      prepaidEnabled: true,
      amount: 550
    });

    const checkout = await createCheckoutIntent({
      buyerUserId: String(buyer._id),
      payload: {
        source: 'buy_now',
        clientRequestId: 'client_webhook_capture',
        lines: [{ productId: String(product._id), quantity: 1 }]
      }
    });

    const order = await ProductOrder.findById(checkout.order.id);
    const paymentAttempt = await PaymentAttempt.findOne({ order: order._id });

    order.status = 'payment_authorized';
    order.paymentStatus = 'authorized';
    await order.save();

    paymentAttempt.status = 'authorized';
    paymentAttempt.providerPaymentId = 'pay_captured_8110';
    await paymentAttempt.save();

    const rawBody = JSON.stringify({
      event: 'payment.captured',
      created_at: Date.now(),
      payload: {
        payment: {
          entity: {
            id: 'pay_captured_8110',
            status: 'captured',
            order_id: paymentAttempt.providerOrderId,
            amount: paymentAttempt.amount,
            currency: paymentAttempt.currency
          }
        }
      }
    });

    const firstPass = await processRazorpayWebhook({
      rawBody,
      signature: 'valid_signature'
    });
    const duplicatePass = await processRazorpayWebhook({
      rawBody,
      signature: 'valid_signature'
    });

    const refreshedOrder = await ProductOrder.findById(order._id).lean();
    const refreshedAttempt = await PaymentAttempt.findById(paymentAttempt._id).lean();

    expect(firstPass.duplicate).toBe(false);
    expect(firstPass.paymentState).toBe('paid');
    expect(duplicatePass.duplicate).toBe(true);
    expect(refreshedOrder.status).toBe('paid');
    expect(refreshedOrder.paymentStatus).toBe('paid');
    expect(refreshedAttempt.status).toBe('captured');
    expect(await PaymentWebhookEvent.countDocuments()).toBe(1);
  });
});
