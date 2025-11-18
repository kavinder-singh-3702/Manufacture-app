const { Router } = require('express');
const validate = require('../../../middleware/validate');
const {
  submitCompanyVerificationRequestController,
  getLatestCompanyVerificationRequestController
} = require('../controllers/companyVerification.controller');
const { submitCompanyVerificationValidation } = require('../validators/companyVerification.validators');

const router = Router({ mergeParams: true });

router.post('/', validate(submitCompanyVerificationValidation), submitCompanyVerificationRequestController);
router.get('/', getLatestCompanyVerificationRequestController);

module.exports = router;
