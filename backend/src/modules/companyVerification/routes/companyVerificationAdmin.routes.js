const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  listCompanyVerificationRequestsController,
  decideCompanyVerificationRequestController
} = require('../controllers/companyVerification.controller');
const {
  listCompanyVerificationValidation,
  decideCompanyVerificationValidation
} = require('../validators/companyVerification.validators');

const router = Router();

router.use(authenticate, authorizeRoles('admin'));

router.get('/', validate(listCompanyVerificationValidation), listCompanyVerificationRequestsController);
router.patch('/:requestId', validate(decideCompanyVerificationValidation), decideCompanyVerificationRequestController);

module.exports = router;
