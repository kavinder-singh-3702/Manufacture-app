const { body, query, param } = require('express-validator');
const { COMPANY_VERIFICATION_STATUSES } = require('../../../constants/companyVerification');

const documentValidation = (field, label) => [
  body(field).isObject().withMessage(`${label} payload is required`),
  body(`${field}.fileName`).isString().notEmpty().withMessage(`${label} file name is required`),
  body(`${field}.mimeType`).isString().notEmpty().withMessage(`${label} mimeType is required`),
  body(`${field}.content`)
    .isString()
    .notEmpty()
    .withMessage(`${label} base64 content is required`)
];

const submitCompanyVerificationValidation = [
  ...documentValidation('gstCertificate', 'GST certificate'),
  ...documentValidation('aadhaarCard', 'Aadhaar card'),
  body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be under 500 characters')
];

const listCompanyVerificationValidation = [
  query('status').optional().isIn(COMPANY_VERIFICATION_STATUSES).withMessage('Unsupported status filter provided'),
  query('search').optional().isString().trim().isLength({ min: 1, max: 120 }),
  query('companyId').optional().isMongoId().withMessage('companyId must be a valid ObjectId'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  query('sort')
    .optional()
    .isIn(['createdAt:desc', 'createdAt:asc', 'updatedAt:desc', 'updatedAt:asc'])
    .withMessage('Unsupported sort option')
];

const decideCompanyVerificationValidation = [
  param('requestId').isMongoId().withMessage('A valid verification request id is required'),
  body('action').isIn(['approve', 'reject']).withMessage('Action must be approve or reject'),
  body('notes').optional().isString().isLength({ max: 500 }).withMessage('Notes must be under 500 characters'),
  body('rejectionReason')
    .if(body('action').equals('reject'))
    .isString()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ max: 500 })
    .withMessage('Rejection reason must be under 500 characters')
];

module.exports = {
  submitCompanyVerificationValidation,
  listCompanyVerificationValidation,
  decideCompanyVerificationValidation
};
