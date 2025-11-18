const { Router } = require('express');
const {
  createCompanyController,
  listCompaniesController,
  getCompanyController,
  switchCompanyController
} = require('../controllers/company.controller');
const { authenticate } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  createCompanyValidation,
  companyIdParamValidation
} = require('../validators/company.validators');

const router = Router();

router.use(authenticate);

router
  .route('/')
  .get(listCompaniesController)
  .post(validate(createCompanyValidation), createCompanyController);

router.get('/:companyId', validate(companyIdParamValidation), getCompanyController);
router.post('/:companyId/select', validate(companyIdParamValidation), switchCompanyController);

module.exports = router;
