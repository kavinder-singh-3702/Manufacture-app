const { Router } = require('express');
const { authenticate } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  createInquiryController,
  listUserInquiriesController,
} = require('../controllers/productInquiry.controller');
const {
  createInquiryValidation,
  listUserInquiriesValidation,
} = require('../validators/productInquiry.validators');

const router = Router();

router.use(authenticate);

router
  .route('/')
  .post(validate(createInquiryValidation), createInquiryController)
  .get(validate(listUserInquiriesValidation), listUserInquiriesController);

module.exports = router;
