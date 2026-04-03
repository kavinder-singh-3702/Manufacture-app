const config = require('../config/env');

const PRODUCT_ORDER_SOURCES = Object.freeze(['buy_now', 'cart']);
const PRODUCT_ORDER_STATUSES = Object.freeze([
  'payment_pending',
  'payment_authorized',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded'
]);
const PRODUCT_ORDER_PAYMENT_STATUSES = Object.freeze([
  'pending',
  'authorized',
  'paid',
  'failed',
  'cancelled',
  'refunded'
]);
const PRODUCT_ORDER_PAYMENT_PROVIDER = 'razorpay';
const PRODUCT_ORDER_CURRENCY = String(config.paymentCurrency || 'INR').trim().toUpperCase() || 'INR';

module.exports = {
  PRODUCT_ORDER_SOURCES,
  PRODUCT_ORDER_STATUSES,
  PRODUCT_ORDER_PAYMENT_STATUSES,
  PRODUCT_ORDER_PAYMENT_PROVIDER,
  PRODUCT_ORDER_CURRENCY
};
