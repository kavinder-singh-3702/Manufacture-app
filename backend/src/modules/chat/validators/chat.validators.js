const { body, param, query } = require('express-validator');

const createConversationValidation = [body('participantId').isMongoId().withMessage('participantId is required')];

const conversationIdParamValidation = [param('conversationId').isMongoId().withMessage('Valid conversationId is required')];

const sendMessageValidation = [body('content').trim().notEmpty().withMessage('Message content is required')];

// Was declared with body() and never wired to any route (X11) — the messages
// list and conversations list are both GET requests, so their limit/offset
// arrive as query params, not a body.
const paginateValidation = [
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('offset').optional().isInt({ min: 0 })
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
