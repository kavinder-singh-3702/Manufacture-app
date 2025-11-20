const { Router } = require('express');
const {
  createCompanyController,
  listCompaniesController,
  getCompanyController,
  switchCompanyController,
  updateCompanyController
} = require('../controllers/company.controller');
const { authenticate } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  createCompanyValidation,
  companyIdParamValidation,
  updateCompanyValidation
} = require('../validators/company.validators');
const companyVerificationRouter = require('../../companyVerification/routes/companyVerificationUser.routes');

const router = Router();

router.use(authenticate);

router
  .route('/')
  .get(listCompaniesController)
  .post(validate(createCompanyValidation), createCompanyController);

router.get('/:companyId', validate(companyIdParamValidation), getCompanyController);
router.patch('/:companyId', validate(companyIdParamValidation), validate(updateCompanyValidation), updateCompanyController);
router.post('/:companyId/select', validate(companyIdParamValidation), switchCompanyController);
router.use(
  '/:companyId/verification',
  validate(companyIdParamValidation),
  companyVerificationRouter
);

module.exports = router;
