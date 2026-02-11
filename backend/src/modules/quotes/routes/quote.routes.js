const { Router } = require('express');
const { authenticate } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  createQuoteController,
  listQuotesController,
  getQuoteController,
  respondToQuoteController,
  updateQuoteStatusController
} = require('../controllers/quote.controller');
const {
  quoteIdParamValidation,
  createQuoteValidation,
  listQuotesValidation,
  respondToQuoteValidation,
  updateQuoteStatusValidation
} = require('../validators/quote.validators');

const router = Router();

router.use(authenticate);

router
  .route('/')
  .post(validate(createQuoteValidation), createQuoteController)
  .get(validate(listQuotesValidation), listQuotesController);

router.get('/:quoteId', validate(quoteIdParamValidation), getQuoteController);
router.patch(
  '/:quoteId/respond',
  validate([...quoteIdParamValidation, ...respondToQuoteValidation]),
  respondToQuoteController
);
router.patch(
  '/:quoteId/status',
  validate([...quoteIdParamValidation, ...updateQuoteStatusValidation]),
  updateQuoteStatusController
);

module.exports = router;
