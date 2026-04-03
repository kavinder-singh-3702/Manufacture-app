const crypto = require('crypto');
const createError = require('http-errors');
const mongoose = require('mongoose');
const Product = require('../../../models/product.model');
const ProductVariant = require('../../../models/productVariant.model');
const User = require('../../../models/user.model');
const ProductOrder = require('../../../models/productOrder.model');
const PaymentAttempt = require('../../../models/paymentAttempt.model');
const PaymentWebhookEvent = require('../../../models/paymentWebhookEvent.model');
const {
  PRODUCT_ORDER_SOURCES,
  PRODUCT_ORDER_STATUSES,
  PRODUCT_ORDER_PAYMENT_STATUSES,
  PRODUCT_ORDER_PAYMENT_PROVIDER,
  PRODUCT_ORDER_CURRENCY
} = require('../../../constants/productOrder');
const { computePurchaseOptionsState, mapToObject } = require('../../product/utils/purchaseOptions.util');
const {
  createOrder: createRazorpayOrder,
  fetchPayment: fetchRazorpayPayment,
  verifyPaymentSignature,
  verifyWebhookSignature,
  getPublicConfig
} = require('./razorpayGateway.service');

const VALID_ADMIN_MUTATION_STATUSES = new Set(['processing', 'shipped', 'delivered', 'cancelled']);

const normalizeString = (value, { max = 200 } = {}) => {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim();
  if (!normalized) return undefined;
  return normalized.slice(0, max);
};

const roundMoney = (value) => {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
};

const assertSupportedPaymentCurrency = () => {
  if (PRODUCT_ORDER_CURRENCY !== 'INR') {
    throw createError(503, 'Unsupported payment currency configuration', {
      code: 'PAYMENT_CURRENCY_UNSUPPORTED',
      currency: PRODUCT_ORDER_CURRENCY
    });
  }
};

const toSubunits = (amount) => Math.round(roundMoney(amount) * 100);

const normalizeAddress = (address = {}) => ({
  line1: normalizeString(address.line1),
  line2: normalizeString(address.line2),
  city: normalizeString(address.city, { max: 120 }),
  state: normalizeString(address.state, { max: 120 }),
  postalCode: normalizeString(address.postalCode, { max: 40 }),
  country: normalizeString(address.country, { max: 80 })
});

const hasCompleteAddress = (address = {}) => {
  return Boolean(address.line1 && address.city && address.state && address.postalCode && address.country);
};

const getBuyerDisplayName = (user) => {
  return (
    normalizeString(user?.displayName, { max: 160 }) ||
    normalizeString([user?.firstName, user?.lastName].filter(Boolean).join(' '), { max: 160 }) ||
    normalizeString(user?.email, { max: 160 }) ||
    'Buyer'
  );
};

const toObjectId = (value, label = 'identifier') => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw createError(400, `Invalid ${label}`);
  }
  return new mongoose.Types.ObjectId(value);
};

const shapeLineItem = (line) => ({
  product: line.product ? String(line.product) : undefined,
  variant: line.variant ? String(line.variant) : undefined,
  productName: line.productName,
  productSku: line.productSku,
  productCategory: line.productCategory,
  productSubCategory: line.productSubCategory,
  variantTitle: line.variantTitle,
  variantSku: line.variantSku,
  quantity: Number(line.quantity || 0),
  unitPrice: Number(line.unitPrice || 0),
  lineTotal: Number(line.lineTotal || 0),
  currency: line.currency,
  unit: line.unit,
  purchaseConfig: {
    prepaidEnabled: Boolean(line.purchaseConfig?.prepaidEnabled),
    paymentMode: line.purchaseConfig?.paymentMode || 'none',
    provider: line.purchaseConfig?.provider || 'none'
  }
});

const shapeProductOrder = (order) => {
  const plain = typeof order?.toObject === 'function' ? order.toObject() : order;
  if (!plain) return null;

  return {
    id: String(plain._id),
    clientRequestId: plain.clientRequestId,
    buyer: {
      id: plain.buyer?.user ? String(plain.buyer.user) : undefined,
      displayName: plain.buyer?.displayName,
      email: plain.buyer?.email,
      phone: plain.buyer?.phone
    },
    shippingAddress: normalizeAddress(plain.shippingAddress || {}),
    source: plain.source,
    status: plain.status,
    paymentStatus: plain.paymentStatus,
    paymentProvider: plain.paymentProvider,
    lineItems: Array.isArray(plain.lineItems) ? plain.lineItems.map(shapeLineItem) : [],
    totals: {
      subtotal: Number(plain.totals?.subtotal || 0),
      total: Number(plain.totals?.total || 0),
      amountPaid: Number(plain.totals?.amountPaid || 0),
      currency: plain.totals?.currency || PRODUCT_ORDER_CURRENCY,
      itemCount: Number(plain.totals?.itemCount || 0)
    },
    paidAt: plain.paidAt,
    refundedAt: plain.refundedAt,
    cancelledAt: plain.cancelledAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt
  };
};

const buildPaymentResponse = (paymentAttempt) => {
  const publicConfig = getPublicConfig();
  return {
    provider: PRODUCT_ORDER_PAYMENT_PROVIDER,
    razorpayOrderId: paymentAttempt.providerOrderId,
    amount: paymentAttempt.amount,
    currency: paymentAttempt.currency,
    keyId: publicConfig.keyId,
    receipt: paymentAttempt.receipt,
    notes: paymentAttempt.providerOrderPayload?.notes || {}
  };
};

const buildCheckoutResponse = (order, paymentAttempt) => ({
  order: shapeProductOrder(order),
  payment: buildPaymentResponse(paymentAttempt)
});

const fetchBuyerForCheckout = async (userId) => {
  const user = await User.findById(userId)
    .select('_id displayName firstName lastName email phone address')
    .lean();
  if (!user?._id) {
    throw createError(404, 'Buyer not found');
  }
  return user;
};

const fetchExistingOrderByClientRequestId = async ({ buyerId, clientRequestId }) => {
  if (!clientRequestId) return null;
  const order = await ProductOrder.findOne({
    'buyer.user': toObjectId(buyerId, 'buyer id'),
    clientRequestId
  }).sort({ createdAt: -1 });
  return order || null;
};

const fetchLatestAttemptForOrder = async (orderId) => {
  return PaymentAttempt.findOne({ order: orderId }).sort({ createdAt: -1 });
};

const buildPaymentStateFromProviderStatus = (status) => {
  const normalized = normalizeString(status, { max: 40 });
  if (normalized === 'captured') return 'paid';
  if (normalized === 'authorized') return 'authorized';
  if (normalized === 'refunded') return 'refunded';
  if (normalized === 'failed') return 'failed';
  return 'pending';
};

const applyPaymentState = ({ order, paymentAttempt, paymentState, occurredAt, paymentPayload, verifyPayload }) => {
  const eventAt = occurredAt || new Date();

  if (paymentPayload) {
    paymentAttempt.providerPaymentPayload = paymentPayload;
    if (paymentPayload.id) {
      paymentAttempt.providerPaymentId = String(paymentPayload.id);
    }
  }
  if (verifyPayload) {
    paymentAttempt.latestVerifyPayload = verifyPayload;
  }

  order.lastPaymentEventAt = eventAt;

  if (paymentState === 'authorized') {
    paymentAttempt.status = 'authorized';
    paymentAttempt.authorizedAt = paymentAttempt.authorizedAt || eventAt;
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded') {
      order.paymentStatus = 'authorized';
      if (order.status === 'payment_pending') {
        order.status = 'payment_authorized';
      }
    }
    return;
  }

  if (paymentState === 'paid') {
    paymentAttempt.status = 'captured';
    paymentAttempt.authorizedAt = paymentAttempt.authorizedAt || eventAt;
    paymentAttempt.capturedAt = paymentAttempt.capturedAt || eventAt;
    paymentAttempt.verifiedAt = paymentAttempt.verifiedAt || eventAt;
    order.paymentStatus = 'paid';
    order.status = 'paid';
    order.paidAt = order.paidAt || eventAt;
    order.totals.amountPaid = order.totals.total;
    return;
  }

  if (paymentState === 'failed') {
    paymentAttempt.status = 'failed';
    paymentAttempt.failedAt = paymentAttempt.failedAt || eventAt;
    if (order.paymentStatus !== 'paid' && order.paymentStatus !== 'refunded') {
      order.paymentStatus = 'failed';
      if (order.status === 'payment_authorized') {
        order.status = 'payment_pending';
      }
    }
    return;
  }

  if (paymentState === 'refunded') {
    paymentAttempt.status = 'refunded';
    paymentAttempt.refundedAt = paymentAttempt.refundedAt || eventAt;
    order.paymentStatus = 'refunded';
    order.status = 'refunded';
    order.refundedAt = order.refundedAt || eventAt;
    return;
  }
};

const validateCheckoutLines = async (lines) => {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw createError(422, 'At least one checkout line is required');
  }

  const normalizedLines = lines.map((line, index) => {
    const quantity = Number(line?.quantity || 0);
    if (!mongoose.Types.ObjectId.isValid(line?.productId)) {
      throw createError(422, `Line ${index + 1} has an invalid productId`);
    }
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw createError(422, `Line ${index + 1} quantity must be a positive integer`);
    }
    if (line?.variantId && !mongoose.Types.ObjectId.isValid(line.variantId)) {
      throw createError(422, `Line ${index + 1} has an invalid variantId`);
    }

    return {
      productId: String(line.productId),
      variantId: line?.variantId ? String(line.variantId) : undefined,
      quantity
    };
  });

  const productIds = [...new Set(normalizedLines.map((line) => line.productId))].map((id) => toObjectId(id, 'product id'));
  const variantIds = [...new Set(normalizedLines.map((line) => line.variantId).filter(Boolean))].map((id) => toObjectId(id, 'variant id'));

  const [products, variants] = await Promise.all([
    Product.find({ _id: { $in: productIds }, deletedAt: { $exists: false } })
      .populate({ path: 'company', select: 'displayName metadata' })
      .lean(),
    variantIds.length
      ? ProductVariant.find({ _id: { $in: variantIds }, deletedAt: { $exists: false } }).lean()
      : Promise.resolve([])
  ]);

  const productsById = new Map(products.map((product) => [String(product._id), product]));
  const variantsById = new Map(variants.map((variant) => [String(variant._id), variant]));

  const lineItems = normalizedLines.map((line) => {
    const product = productsById.get(line.productId);
    if (!product) {
      throw createError(404, 'Product not found');
    }

    const purchaseOptions = computePurchaseOptionsState(product);
    if (!purchaseOptions.checkoutEligible) {
      throw createError(422, `${product.name} is not eligible for prepaid checkout`, {
        code: 'CHECKOUT_NOT_ELIGIBLE',
        reason: purchaseOptions.checkoutReason,
        productId: line.productId
      });
    }

    const variant = line.variantId ? variantsById.get(line.variantId) : null;
    if (line.variantId && (!variant || String(variant.product) !== String(product._id))) {
      throw createError(422, `Selected variant is invalid for ${product.name}`);
    }
    if (variant && variant.status !== 'active') {
      throw createError(422, `${product.name} variant is inactive`);
    }

    const price = variant?.price || product.price || {};
    const currency = normalizeString(price.currency || product.price?.currency || PRODUCT_ORDER_CURRENCY, { max: 10 }) || PRODUCT_ORDER_CURRENCY;
    if (currency !== PRODUCT_ORDER_CURRENCY) {
      throw createError(422, `${product.name} must be priced in ${PRODUCT_ORDER_CURRENCY}`);
    }

    const unitPrice = Number(price.amount || 0);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw createError(422, `${product.name} has invalid pricing for checkout`);
    }

    const quantity = Number(line.quantity || 0);
    const lineTotal = roundMoney(unitPrice * quantity);

    return {
      product: product._id,
      variant: variant?._id,
      productName: product.name,
      productSku: product.sku,
      productCategory: product.category,
      productSubCategory: product.subCategory,
      variantTitle: variant?.title,
      variantSku: variant?.sku,
      quantity,
      unitPrice,
      lineTotal,
      currency,
      unit: variant?.unit || price.unit || product.unit || product.price?.unit,
      purchaseConfig: {
        prepaidEnabled: purchaseOptions.prepaidEnabled,
        paymentMode: purchaseOptions.paymentMode,
        provider: purchaseOptions.provider
      }
    };
  });

  return lineItems;
};

const createCheckoutIntent = async ({ buyerUserId, payload }) => {
  assertSupportedPaymentCurrency();

  const source = PRODUCT_ORDER_SOURCES.includes(payload?.source) ? payload.source : null;
  if (!source) {
    throw createError(422, 'source must be buy_now or cart');
  }

  const clientRequestId = normalizeString(payload?.clientRequestId, { max: 120 });
  if (!clientRequestId) {
    throw createError(422, 'clientRequestId is required');
  }

  const buyer = await fetchBuyerForCheckout(buyerUserId);
  const existingOrder = await fetchExistingOrderByClientRequestId({ buyerId: buyerUserId, clientRequestId });
  if (existingOrder) {
    const existingAttempt = await fetchLatestAttemptForOrder(existingOrder._id);
    if (existingAttempt) {
      return buildCheckoutResponse(existingOrder, existingAttempt);
    }
  }

  const shippingAddress = normalizeAddress(hasCompleteAddress(payload?.shippingAddress) ? payload.shippingAddress : buyer.address);
  if (!hasCompleteAddress(shippingAddress)) {
    throw createError(422, 'A complete shipping address is required');
  }

  const lineItems = await validateCheckoutLines(payload?.lines);
  const subtotal = roundMoney(lineItems.reduce((sum, line) => sum + Number(line.lineTotal || 0), 0));
  const total = subtotal;
  const itemCount = lineItems.reduce((sum, line) => sum + Number(line.quantity || 0), 0);
  const providerAmount = toSubunits(total);

  const orderId = new mongoose.Types.ObjectId();
  const receipt = `po_${String(orderId).slice(-12)}`;
  const providerOrder = await createRazorpayOrder({
    amount: providerAmount,
    currency: PRODUCT_ORDER_CURRENCY,
    receipt,
    notes: {
      localOrderId: String(orderId),
      source,
      buyerId: String(buyer._id),
      clientRequestId
    }
  });

  const order = await ProductOrder.create({
    _id: orderId,
    clientRequestId,
    buyer: {
      user: buyer._id,
      displayName: getBuyerDisplayName(buyer),
      email: normalizeString(buyer.email, { max: 200 }),
      phone: normalizeString(buyer.phone, { max: 40 })
    },
    shippingAddress,
    source,
    status: 'payment_pending',
    paymentStatus: 'pending',
    paymentProvider: PRODUCT_ORDER_PAYMENT_PROVIDER,
    lineItems,
    totals: {
      subtotal,
      total,
      amountPaid: 0,
      currency: PRODUCT_ORDER_CURRENCY,
      itemCount
    }
  });

  const paymentAttempt = await PaymentAttempt.create({
    order: order._id,
    buyer: buyer._id,
    provider: PRODUCT_ORDER_PAYMENT_PROVIDER,
    status: 'created',
    receipt,
    amount: providerAmount,
    currency: PRODUCT_ORDER_CURRENCY,
    providerOrderId: providerOrder.id,
    providerOrderPayload: providerOrder
  });

  return buildCheckoutResponse(order, paymentAttempt);
};

const assertBuyerOrderAccess = (order, buyerUserId) => {
  if (!order || String(order.buyer?.user) !== String(buyerUserId)) {
    throw createError(404, 'Order not found');
  }
};

const verifyOrderPayment = async ({ buyerUserId, payload }) => {
  assertSupportedPaymentCurrency();

  const orderId = payload?.orderId;
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw createError(400, 'Valid orderId is required');
  }

  const order = await ProductOrder.findById(orderId);
  assertBuyerOrderAccess(order, buyerUserId);

  const paymentAttempt = await fetchLatestAttemptForOrder(order._id);
  if (!paymentAttempt?.providerOrderId) {
    throw createError(404, 'Payment attempt not found');
  }

  if (String(paymentAttempt.providerOrderId) !== String(payload.razorpay_order_id)) {
    throw createError(400, 'Razorpay order does not match the checkout intent');
  }

  const signatureOk = verifyPaymentSignature({
    orderId: payload.razorpay_order_id,
    paymentId: payload.razorpay_payment_id,
    signature: payload.razorpay_signature
  });
  if (!signatureOk) {
    throw createError(400, 'Invalid payment signature');
  }

  const providerPayment = await fetchRazorpayPayment(payload.razorpay_payment_id);
  if (!providerPayment?.id) {
    throw createError(502, 'Unable to validate payment with provider');
  }

  if (String(providerPayment.order_id) !== String(paymentAttempt.providerOrderId)) {
    throw createError(409, 'Provider payment order mismatch');
  }
  if (Number(providerPayment.amount || 0) !== Number(paymentAttempt.amount || 0)) {
    throw createError(409, 'Provider payment amount mismatch');
  }
  if (String(providerPayment.currency || '').toUpperCase() !== String(paymentAttempt.currency || '').toUpperCase()) {
    throw createError(409, 'Provider payment currency mismatch');
  }

  paymentAttempt.signatureVerifiedAt = new Date();
  paymentAttempt.verifiedAt = paymentAttempt.verifiedAt || new Date();

  const paymentState = buildPaymentStateFromProviderStatus(providerPayment.status);
  if (paymentState === 'pending') {
    throw createError(409, 'Payment is not ready for verification yet');
  }

  applyPaymentState({
    order,
    paymentAttempt,
    paymentState,
    occurredAt: new Date(),
    paymentPayload: providerPayment,
    verifyPayload: payload
  });

  await Promise.all([order.save(), paymentAttempt.save()]);

  return {
    success: true,
    message:
      paymentState === 'paid'
        ? 'Payment verified successfully'
        : paymentState === 'authorized'
        ? 'Payment authorized and awaiting capture'
        : 'Payment verification completed',
    orderId: String(order._id),
    paymentStatus: order.paymentStatus,
    order: shapeProductOrder(order)
  };
};

const listBuyerOrders = async ({ buyerUserId, query = {} }) => {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const mongoQuery = { 'buyer.user': toObjectId(buyerUserId, 'buyer id') };

  if (query.status && PRODUCT_ORDER_STATUSES.includes(query.status)) {
    mongoQuery.status = query.status;
  }
  if (query.paymentStatus && PRODUCT_ORDER_PAYMENT_STATUSES.includes(query.paymentStatus)) {
    mongoQuery.paymentStatus = query.paymentStatus;
  }

  const [orders, total] = await Promise.all([
    ProductOrder.find(mongoQuery).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    ProductOrder.countDocuments(mongoQuery)
  ]);

  return {
    orders: orders.map(shapeProductOrder),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + orders.length < total
    }
  };
};

const getBuyerOrderById = async ({ buyerUserId, orderId }) => {
  const order = await ProductOrder.findById(orderId).lean();
  assertBuyerOrderAccess(order, buyerUserId);
  return shapeProductOrder(order);
};

const listAdminOrders = async ({ query = {} } = {}) => {
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100);
  const offset = Math.max(Number(query.offset) || 0, 0);
  const mongoQuery = {};

  if (query.status && PRODUCT_ORDER_STATUSES.includes(query.status)) {
    mongoQuery.status = query.status;
  }
  if (query.paymentStatus && PRODUCT_ORDER_PAYMENT_STATUSES.includes(query.paymentStatus)) {
    mongoQuery.paymentStatus = query.paymentStatus;
  }
  if (query.search) {
    const regex = new RegExp(query.search, 'i');
    mongoQuery.$or = [
      { 'buyer.displayName': regex },
      { 'buyer.email': regex },
      { 'buyer.phone': regex },
      { 'lineItems.productName': regex }
    ];
  }

  const [orders, total] = await Promise.all([
    ProductOrder.find(mongoQuery).sort({ createdAt: -1 }).skip(offset).limit(limit).lean(),
    ProductOrder.countDocuments(mongoQuery)
  ]);

  return {
    orders: orders.map(shapeProductOrder),
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + orders.length < total
    }
  };
};

const getAdminOrderById = async ({ orderId }) => {
  const order = await ProductOrder.findById(orderId).lean();
  if (!order) {
    throw createError(404, 'Order not found');
  }
  return shapeProductOrder(order);
};

const updateAdminOrderStatus = async ({ orderId, nextStatus }) => {
  const order = await ProductOrder.findById(orderId);
  if (!order) {
    throw createError(404, 'Order not found');
  }
  if (!VALID_ADMIN_MUTATION_STATUSES.has(nextStatus)) {
    throw createError(422, 'Unsupported admin order status');
  }
  if (order.paymentStatus !== 'paid') {
    throw createError(409, 'Only paid orders can enter admin fulfillment workflows');
  }
  if (!['paid', 'processing', 'shipped'].includes(order.status) && nextStatus !== 'cancelled') {
    throw createError(409, 'Order cannot transition to the requested status');
  }

  order.status = nextStatus;
  if (nextStatus === 'cancelled') {
    order.cancelledAt = order.cancelledAt || new Date();
  }

  await order.save();
  return shapeProductOrder(order);
};

const hashPayload = (rawBody) => crypto.createHash('sha256').update(rawBody).digest('hex');

const buildWebhookIdentifiers = (payload, rawBody) => {
  const payloadHash = hashPayload(rawBody);
  const event = normalizeString(payload?.event, { max: 120 }) || 'unknown';
  const providerEventId = normalizeString(payload?.id, { max: 120 });
  const primaryRef =
    normalizeString(payload?.payload?.payment?.entity?.id, { max: 120 }) ||
    normalizeString(payload?.payload?.refund?.entity?.payment_id, { max: 120 }) ||
    normalizeString(payload?.payload?.order?.entity?.id, { max: 120 }) ||
    'na';
  const createdAt = normalizeString(payload?.created_at, { max: 40 }) || 'na';
  const dedupeKey = providerEventId
    ? `${PRODUCT_ORDER_PAYMENT_PROVIDER}:${providerEventId}`
    : `${PRODUCT_ORDER_PAYMENT_PROVIDER}:${event}:${primaryRef}:${createdAt}:${payloadHash.slice(0, 16)}`;

  return { payloadHash, providerEventId, dedupeKey, event };
};

const resolveWebhookState = (event, payload) => {
  if (event === 'payment.authorized') return 'authorized';
  if (event === 'payment.captured' || event === 'order.paid') return 'paid';
  if (event === 'payment.failed') return 'failed';
  if (event.includes('refund')) return 'refunded';

  const fallbackStatus = buildPaymentStateFromProviderStatus(payload?.payload?.payment?.entity?.status);
  return fallbackStatus === 'pending' ? null : fallbackStatus;
};

const processRazorpayWebhook = async ({ rawBody, signature }) => {
  assertSupportedPaymentCurrency();

  if (!rawBody) {
    throw createError(400, 'Webhook body is required');
  }
  if (!signature) {
    throw createError(400, 'Webhook signature is required');
  }
  if (!verifyWebhookSignature({ rawBody, signature })) {
    throw createError(400, 'Invalid webhook signature');
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    throw createError(400, 'Invalid webhook JSON payload');
  }

  const { payloadHash, providerEventId, dedupeKey, event } = buildWebhookIdentifiers(payload, rawBody);
  const existingEvent = await PaymentWebhookEvent.findOne({ dedupeKey }).lean();
  if (existingEvent) {
    return { duplicate: true, event: existingEvent.event };
  }

  const providerPayment = payload?.payload?.payment?.entity || null;
  const providerOrder = payload?.payload?.order?.entity || null;
  const providerPaymentId = normalizeString(providerPayment?.id, { max: 120 });
  const providerOrderId =
    normalizeString(providerPayment?.order_id, { max: 120 }) ||
    normalizeString(providerOrder?.id, { max: 120 });

  const paymentAttempt =
    (providerPaymentId
      ? await PaymentAttempt.findOne({ provider: PRODUCT_ORDER_PAYMENT_PROVIDER, providerPaymentId })
      : null) ||
    (providerOrderId
      ? await PaymentAttempt.findOne({ provider: PRODUCT_ORDER_PAYMENT_PROVIDER, providerOrderId })
      : null);

  const order = paymentAttempt?.order ? await ProductOrder.findById(paymentAttempt.order) : null;
  const paymentState = resolveWebhookState(event, payload);

  if (paymentAttempt && order && paymentState) {
    paymentAttempt.latestWebhookPayload = payload;
    applyPaymentState({
      order,
      paymentAttempt,
      paymentState,
      occurredAt: new Date(),
      paymentPayload: providerPayment
    });
    await Promise.all([order.save(), paymentAttempt.save()]);
  }

  await PaymentWebhookEvent.create({
    provider: PRODUCT_ORDER_PAYMENT_PROVIDER,
    event,
    eventId: providerEventId,
    dedupeKey,
    signature,
    payloadHash,
    rawBody,
    payload,
    order: order?._id,
    paymentAttempt: paymentAttempt?._id,
    processedAt: new Date()
  });

  return {
    duplicate: false,
    event,
    paymentState,
    orderId: order ? String(order._id) : undefined
  };
};

module.exports = {
  createCheckoutIntent,
  verifyOrderPayment,
  listBuyerOrders,
  getBuyerOrderById,
  listAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  processRazorpayWebhook,
  shapeProductOrder
};
