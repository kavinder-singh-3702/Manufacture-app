const { body, param, query } = require('express-validator');
const { PRODUCT_INQUIRY_STATUSES } = require('../../../constants/productInquiry');

const inquiryIdParamValidation = [
  param('inquiryId').isMongoId().withMessage('Valid inquiryId is required'),
];

const createInquiryValidation = [
  body('productId').isMongoId().withMessage('productId is required'),
  body('variantId').optional({ nullable: true }).isMongoId().withMessage('variantId must be valid'),
  body('quantity').optional({ nullable: true }).isFloat({ gt: 0 }).withMessage('quantity must be greater than 0'),
  body('location').optional({ nullable: true }).isString().trim().isLength({ max: 500 }),
  body('message').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
];

const listUserInquiriesValidation = [
  query('status').optional().isIn(PRODUCT_INQUIRY_STATUSES).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

const listAdminInquiriesValidation = [
  query('status').optional().isIn(PRODUCT_INQUIRY_STATUSES).withMessage('Invalid status'),
  query('productId').optional().isMongoId().withMessage('productId must be a valid ObjectId'),
  query('buyerId').optional().isMongoId().withMessage('buyerId must be a valid ObjectId'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

const updateAdminInquiryStatusValidation = [
  body('status').isIn(PRODUCT_INQUIRY_STATUSES).withMessage('Invalid inquiry status'),
  body('adminNotes').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
];

module.exports = {
  inquiryIdParamValidation,
  createInquiryValidation,
  listUserInquiriesValidation,
  listAdminInquiriesValidation,
  updateAdminInquiryStatusValidation,
};
