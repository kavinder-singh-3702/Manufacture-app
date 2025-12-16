const { Router } = require('express');
const { authenticate } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  listConversationsController,
  createConversationController,
  getMessagesController,
  sendMessageController,
  markReadController,
  createCallLogController
} = require('../controllers/chat.controller');
const {
  createConversationValidation,
  conversationIdParamValidation,
  sendMessageValidation,
  callLogValidation
} = require('../validators/chat.validators');

const router = Router();

router.use(authenticate);

router.get('/conversations', listConversationsController);
router.post('/conversations', validate(createConversationValidation), createConversationController);
router.get('/conversations/:conversationId/messages', validate(conversationIdParamValidation), getMessagesController);
router.post(
  '/conversations/:conversationId/messages',
  validate([...conversationIdParamValidation, ...sendMessageValidation]),
  sendMessageController
);
router.post('/conversations/:conversationId/read', validate(conversationIdParamValidation), markReadController);

router.post('/call-logs', validate(callLogValidation), createCallLogController);

module.exports = router;
