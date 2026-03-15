const { Router } = require('express');
const { authenticate, authenticateOptional } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  createBusinessSetupRequestController,
  listMyBusinessSetupRequestsController
} = require('../controllers/businessSetup.controller');
const {
  createBusinessSetupRequestValidation,
  listMyBusinessSetupRequestsValidation
} = require('../validators/businessSetup.validators');

const router = Router();

router.post('/', authenticateOptional, validate(createBusinessSetupRequestValidation), createBusinessSetupRequestController);
router.get('/me', authenticate, validate(listMyBusinessSetupRequestsValidation), listMyBusinessSetupRequestsController);

module.exports = router;
