const { body, param, query } = require('express-validator');
const { CONTACT_MESSAGE_STATUSES } = require('../../../constants/contact');

const createContactMessageValidation = [
  body('name').isString().trim().isLength({ min: 1, max: 120 }).withMessage('name is required'),
  body('email').isEmail().withMessage('A valid email is required').isLength({ max: 200 }),
  body('company').optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
  body('topic').optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
  body('message').isString().trim().isLength({ min: 1, max: 4000 }).withMessage('message is required'),
];

const listContactMessagesValidation = [
  query('status').optional().isIn(CONTACT_MESSAGE_STATUSES).withMessage('Invalid status'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
];

const messageIdParamValidation = [
  param('messageId').isMongoId().withMessage('Valid messageId is required'),
];

const updateContactMessageStatusValidation = [
  body('status').isIn(CONTACT_MESSAGE_STATUSES).withMessage('Invalid contact message status'),
  body('adminNotes').optional({ nullable: true }).isString().trim().isLength({ max: 2000 }),
];

module.exports = {
  createContactMessageValidation,
  listContactMessagesValidation,
  messageIdParamValidation,
  updateContactMessageStatusValidation,
};
