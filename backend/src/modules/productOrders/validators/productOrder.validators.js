const { body, param, query } = require('express-validator');
const {
  PRODUCT_ORDER_SOURCES,
  PRODUCT_ORDER_PAYMENT_STATUSES,
  PRODUCT_ORDER_STATUSES
} = require('../../../constants/productOrder');

const ADMIN_MUTABLE_ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];

const addressValidationChain = (prefix) => ([
  body(`${prefix}.line1`).optional().isString().trim().isLength({ min: 1, max: 200 }),
  body(`${prefix}.line2`).optional().isString().trim().isLength({ max: 200 }),
  body(`${prefix}.city`).optional().isString().trim().isLength({ min: 1, max: 120 }),
  body(`${prefix}.state`).optional().isString().trim().isLength({ min: 1, max: 120 }),
  body(`${prefix}.postalCode`).optional().isString().trim().isLength({ min: 1, max: 40 }),
  body(`${prefix}.country`).optional().isString().trim().isLength({ min: 1, max: 80 })
]);

const orderIdParamValidation = [
  param('orderId').isMongoId().withMessage('A valid orderId is required')
];

const checkoutIntentValidation = [
  body('source').isIn(PRODUCT_ORDER_SOURCES).withMessage('source must be buy_now or cart'),
  body('clientRequestId').isString().trim().isLength({ min: 1, max: 120 }).withMessage('clientRequestId is required'),
  body('lines').isArray({ min: 1 }).withMessage('At least one line item is required'),
  body('lines.*.productId').isMongoId().withMessage('Each line must contain a valid productId'),
  body('lines.*.variantId').optional().isMongoId().withMessage('variantId must be a valid ObjectId'),
  body('lines.*.quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
  body('shippingAddress').optional().isObject(),
  ...addressValidationChain('shippingAddress')
];

const verifyPaymentValidation = [
  body('orderId').isMongoId().withMessage('A valid orderId is required'),
  body('razorpay_order_id').isString().trim().notEmpty().withMessage('razorpay_order_id is required'),
  body('razorpay_payment_id').isString().trim().notEmpty().withMessage('razorpay_payment_id is required'),
  body('razorpay_signature').isString().trim().notEmpty().withMessage('razorpay_signature is required')
];

const listBuyerOrdersValidation = [
  query('status').optional().isIn(PRODUCT_ORDER_STATUSES),
  query('paymentStatus').optional().isIn(PRODUCT_ORDER_PAYMENT_STATUSES),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

const listAdminOrdersValidation = [
  query('status').optional().isIn(PRODUCT_ORDER_STATUSES),
  query('paymentStatus').optional().isIn(PRODUCT_ORDER_PAYMENT_STATUSES),
  query('search').optional().isString().trim().isLength({ min: 1, max: 120 }),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt()
];

const updateAdminOrderStatusValidation = [
  ...orderIdParamValidation,
  body('status').isIn(ADMIN_MUTABLE_ORDER_STATUSES).withMessage('Unsupported admin order status')
];

module.exports = {
  ADMIN_MUTABLE_ORDER_STATUSES,
  orderIdParamValidation,
  checkoutIntentValidation,
  verifyPaymentValidation,
  listBuyerOrdersValidation,
  listAdminOrdersValidation,
  updateAdminOrderStatusValidation
};
