const { Router } = require('express');
const {
  createCompanyController,
  listCompaniesController,
  getCompanyController,
  switchCompanyController,
  updateCompanyController,
  uploadCompanyFileController
} = require('../controllers/company.controller');
const { authenticate } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  createCompanyValidation,
  companyIdParamValidation,
  updateCompanyValidation,
  uploadCompanyFileValidation
} = require('../validators/company.validators');
const companyVerificationRouter = require('../../companyVerification/routes/companyVerificationUser.routes');
const { uploadMemory } = require('../../../middleware/upload');

const router = Router();

router.use(authenticate);

router
  .route('/')
  .get(listCompaniesController)
  .post(validate(createCompanyValidation), createCompanyController);

router.get('/:companyId', validate(companyIdParamValidation), getCompanyController);
router.patch('/:companyId', validate(companyIdParamValidation), validate(updateCompanyValidation), updateCompanyController);
router.post('/:companyId/select', validate(companyIdParamValidation), switchCompanyController);
router.post(
  '/:companyId/uploads',
  uploadMemory.single('file'),
  (req, _res, next) => {
    if (req.file) {
      req.body.fileName = req.file.originalname;
      req.body.mimeType = req.file.mimetype;
      req.body.content = req.file.buffer.toString('base64');
    }
    next();
  },
  validate(companyIdParamValidation),
  validate(uploadCompanyFileValidation),
  uploadCompanyFileController
);
router.use(
  '/:companyId/verification',
  validate(companyIdParamValidation),
  companyVerificationRouter
);

module.exports = router;
