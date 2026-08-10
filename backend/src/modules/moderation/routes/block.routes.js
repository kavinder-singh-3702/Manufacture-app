const { Router } = require('express');
const { authenticate } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  blockUserController,
  unblockUserController,
  listMyBlocksController,
} = require('../controllers/block.controller');
const {
  blockUserValidation,
  unblockUserValidation,
} = require('../validators/moderation.validators');

const router = Router();

// GET   /blocks             → list users I've blocked
// POST  /blocks/:userId     → block a user (idempotent)
// DELETE /blocks/:userId    → unblock
router.get('/', authenticate, listMyBlocksController);
router.post('/:userId', authenticate, validate(blockUserValidation), blockUserController);
router.delete('/:userId', authenticate, validate(unblockUserValidation), unblockUserController);

module.exports = router;
