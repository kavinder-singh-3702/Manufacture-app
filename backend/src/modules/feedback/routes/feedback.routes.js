const { Router } = require('express');
const { authenticate } = require('../../../middleware/authMiddleware');
const {
  submitFeedbackController,
  listFeedbackController,
  resolveFeedbackController,
} = require('../controllers/feedback.controller');

const router = Router();

// User-side: submit feedback
router.post('/', authenticate, submitFeedbackController);

// Admin-side: list + mark resolved (permission enforced in controller)
router.get('/', authenticate, listFeedbackController);
router.patch('/:feedbackId/resolve', authenticate, resolveFeedbackController);

module.exports = router;
