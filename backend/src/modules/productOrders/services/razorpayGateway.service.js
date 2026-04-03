const crypto = require('crypto');
const createError = require('http-errors');
const Razorpay = require('razorpay');
const config = require('../../../config/env');

let razorpayClient;

const assertRazorpayConfig = ({ requireWebhookSecret = false } = {}) => {
  const missing = [];
  if (!config.razorpayKeyId) missing.push('RAZORPAY_KEY_ID');
  if (!config.razorpayKeySecret) missing.push('RAZORPAY_KEY_SECRET');
  if (requireWebhookSecret && !config.razorpayWebhookSecret) missing.push('RAZORPAY_WEBHOOK_SECRET');

  if (missing.length) {
    throw createError(503, `Payment provider is not configured. Missing: ${missing.join(', ')}`, {
      code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
      missing
    });
  }
};

const getRazorpayClient = () => {
  assertRazorpayConfig();
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: config.razorpayKeyId,
      key_secret: config.razorpayKeySecret
    });
  }
  return razorpayClient;
};

const createOrder = async ({ amount, currency, receipt, notes }) => {
  const client = getRazorpayClient();
  return client.orders.create({
    amount,
    currency,
    receipt,
    notes
  });
};

const fetchPayment = async (paymentId) => {
  const client = getRazorpayClient();
  return client.payments.fetch(paymentId);
};

const safeTimingEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left || ''), 'utf8');
  const rightBuffer = Buffer.from(String(right || ''), 'utf8');
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const buildPaymentSignature = ({ orderId, paymentId }) => {
  assertRazorpayConfig();
  return crypto
    .createHmac('sha256', config.razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
};

const verifyPaymentSignature = ({ orderId, paymentId, signature }) => {
  const expectedSignature = buildPaymentSignature({ orderId, paymentId });
  return safeTimingEqual(expectedSignature, signature);
};

const buildWebhookSignature = (rawBody) => {
  assertRazorpayConfig({ requireWebhookSecret: true });
  return crypto
    .createHmac('sha256', config.razorpayWebhookSecret)
    .update(rawBody)
    .digest('hex');
};

const verifyWebhookSignature = ({ rawBody, signature }) => {
  const expectedSignature = buildWebhookSignature(rawBody);
  return safeTimingEqual(expectedSignature, signature);
};

const getPublicConfig = () => {
  assertRazorpayConfig();
  return {
    keyId: config.razorpayKeyId
  };
};

module.exports = {
  assertRazorpayConfig,
  createOrder,
  fetchPayment,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getPublicConfig
};
