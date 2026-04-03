const { Router } = require('express');
const { authenticate } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  createCheckoutIntentController,
  verifyProductOrderPaymentController,
  listBuyerOrdersController,
  getBuyerOrderController
} = require('../controllers/productOrder.controller');
const {
  orderIdParamValidation,
  checkoutIntentValidation,
  verifyPaymentValidation,
  listBuyerOrdersValidation
} = require('../validators/productOrder.validators');

const router = Router();

router.use(authenticate);

router.get('/', validate(listBuyerOrdersValidation), listBuyerOrdersController);
router.post('/checkout-intent', validate(checkoutIntentValidation), createCheckoutIntentController);
router.post('/verify-payment', validate(verifyPaymentValidation), verifyProductOrderPaymentController);
router.get('/:orderId', validate(orderIdParamValidation), getBuyerOrderController);

module.exports = router;
