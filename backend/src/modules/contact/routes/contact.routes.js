const { Router } = require('express');
const { authenticate, authenticateOptional } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  createContactMessageController,
  listContactMessagesController,
  updateContactMessageStatusController,
} = require('../controllers/contact.controller');
const {
  createContactMessageValidation,
  listContactMessagesValidation,
  messageIdParamValidation,
  updateContactMessageStatusValidation,
} = require('../validators/contact.validators');

const router = Router();

// Public submission — links the message to a user when one is signed in.
router.post(
  '/',
  authenticateOptional,
  validate(createContactMessageValidation),
  createContactMessageController
);

// Admin review.
router.get(
  '/',
  authenticate,
  validate(listContactMessagesValidation),
  listContactMessagesController
);

router.patch(
  '/:messageId/status',
  authenticate,
  validate([...messageIdParamValidation, ...updateContactMessageStatusValidation]),
  updateContactMessageStatusController
);

module.exports = router;
