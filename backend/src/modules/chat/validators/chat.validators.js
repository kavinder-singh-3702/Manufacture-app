const { body, param } = require('express-validator');

const createConversationValidation = [body('participantId').isMongoId().withMessage('participantId is required')];

const conversationIdParamValidation = [param('conversationId').isMongoId().withMessage('Valid conversationId is required')];

const sendMessageValidation = [body('content').trim().notEmpty().withMessage('Message content is required')];

const paginateValidation = [
  body('limit').optional().isInt({ min: 1, max: 200 }),
  body('offset').optional().isInt({ min: 0 })
];

const callLogValidation = [
  body('conversationId').optional().isMongoId(),
  body('calleeId').isMongoId().withMessage('calleeId is required'),
  body('startedAt').optional().isISO8601().toDate(),
  body('endedAt').optional().isISO8601().toDate(),
  body('durationSeconds').optional().isInt({ min: 0 }),
  body('notes').optional().isString().isLength({ max: 500 })
];

module.exports = {
  createConversationValidation,
  conversationIdParamValidation,
  sendMessageValidation,
  paginateValidation,
  callLogValidation
};
