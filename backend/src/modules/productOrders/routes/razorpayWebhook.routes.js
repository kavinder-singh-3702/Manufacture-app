const { Router } = require('express');
const { razorpayWebhookController } = require('../controllers/productOrder.controller');

const router = Router();

router.post('/', razorpayWebhookController);

module.exports = router;
