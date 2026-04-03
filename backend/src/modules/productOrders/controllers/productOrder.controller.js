const {
  createCheckoutIntent,
  verifyOrderPayment,
  listBuyerOrders,
  getBuyerOrderById,
  listAdminOrders,
  getAdminOrderById,
  updateAdminOrderStatus,
  processRazorpayWebhook
} = require('../services/productOrder.service');
const { ADMIN_PERMISSIONS, assertAdminPermission } = require('../../admin/permissions');

const createCheckoutIntentController = async (req, res, next) => {
  try {
    const result = await createCheckoutIntent({
      buyerUserId: req.user.id,
      payload: req.body
    });
    return res.status(201).json(result);
  } catch (error) {
    return next(error);
  }
};

const verifyProductOrderPaymentController = async (req, res, next) => {
  try {
    const result = await verifyOrderPayment({
      buyerUserId: req.user.id,
      payload: req.body
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const listBuyerOrdersController = async (req, res, next) => {
  try {
    const result = await listBuyerOrders({
      buyerUserId: req.user.id,
      query: req.query
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getBuyerOrderController = async (req, res, next) => {
  try {
    const order = await getBuyerOrderById({
      buyerUserId: req.user.id,
      orderId: req.params.orderId
    });
    return res.json({ order });
  } catch (error) {
    return next(error);
  }
};

const listAdminProductOrdersController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_PRODUCT_ORDERS);
    const result = await listAdminOrders({ query: req.query });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const getAdminProductOrderController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_PRODUCT_ORDERS);
    const order = await getAdminOrderById({ orderId: req.params.orderId });
    return res.json({ order });
  } catch (error) {
    return next(error);
  }
};

const updateAdminProductOrderStatusController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_PRODUCT_ORDERS);
    const order = await updateAdminOrderStatus({
      orderId: req.params.orderId,
      nextStatus: req.body.status
    });
    return res.json({ order });
  } catch (error) {
    return next(error);
  }
};

const razorpayWebhookController = async (req, res, next) => {
  try {
    const rawBody = Buffer.isBuffer(req.body)
      ? req.body.toString('utf8')
      : typeof req.body === 'string'
      ? req.body
      : '';
    const signature = req.header('x-razorpay-signature');
    const result = await processRazorpayWebhook({ rawBody, signature });
    return res.json({ success: true, ...result });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createCheckoutIntentController,
  verifyProductOrderPaymentController,
  listBuyerOrdersController,
  getBuyerOrderController,
  listAdminProductOrdersController,
  getAdminProductOrderController,
  updateAdminProductOrderStatusController,
  razorpayWebhookController
};
