const { Router } = require('express');
const validate = require('../../../middleware/validate');
const {
  submitCompanyVerificationRequestController,
  getLatestCompanyVerificationRequestController
} = require('../controllers/companyVerification.controller');
const { submitCompanyVerificationValidation } = require('../validators/companyVerification.validators');
const { uploadMemory } = require('../../../middleware/upload');

const router = Router({ mergeParams: true });

// Accept multipart form data for documents; map files into the expected body shape before validation.
router.post(
  '/',
  uploadMemory.fields([
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'aadhaarCard', maxCount: 1 },
  ]),
  (req, _res, next) => {
    const mapFile = (file) =>
      file
        ? {
            fileName: file.originalname,
            mimeType: file.mimetype,
            content: file.buffer.toString('base64'),
          }
        : undefined;

    if (req.files) {
      const gst = Array.isArray(req.files.gstCertificate) ? req.files.gstCertificate[0] : undefined;
      const aadhaar = Array.isArray(req.files.aadhaarCard) ? req.files.aadhaarCard[0] : undefined;

      if (gst) {
        req.body.gstCertificate = mapFile(gst);
      }
      if (aadhaar) {
        req.body.aadhaarCard = mapFile(aadhaar);
      }
    }
    next();
  },
  validate(submitCompanyVerificationValidation),
  submitCompanyVerificationRequestController
);
router.get('/', getLatestCompanyVerificationRequestController);

module.exports = router;
