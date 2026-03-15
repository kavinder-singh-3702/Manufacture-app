const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const validate = require('../../../middleware/validate');
const {
  getAdminStatsController,
  getAdminOverviewController,
  getAdminUserOverviewController,
  listAllCompaniesController,
  listAllUsersController,
  listAdminAuditEventsController,
  listAdminOpsRequestsController,
  listAdminServiceRequestsController,
  listAdminBusinessSetupRequestsController,
  getAdminServiceRequestController,
  getAdminBusinessSetupRequestController,
  updateAdminServiceRequestWorkflowController,
  updateAdminServiceRequestContentController,
  updateAdminBusinessSetupRequestWorkflowController,
  listAdminInhouseProductCategoriesController,
  listAdminInhouseProductsController,
  getAdminInhouseProductController,
  createAdminInhouseProductController,
  updateAdminInhouseProductController,
  adjustAdminInhouseProductQuantityController,
  deleteAdminInhouseProductController,
  uploadAdminInhouseProductImageController,
  listAdminInhouseVariantsController,
  getAdminInhouseVariantController,
  createAdminInhouseVariantController,
  updateAdminInhouseVariantController,
  adjustAdminInhouseVariantQuantityController,
  deleteAdminInhouseVariantController,
  listAdminConversationsController,
  listAdminCallLogsController,
  setCompanyStatusController,
  archiveCompanyController,
  deleteCompanyController,
  hardDeleteCompanyController,
  requestDocumentsController
} = require('../controllers/admin.controller');
const {
  listEntitiesValidation,
  setCompanyStatusValidation,
  archiveCompanyValidation,
  hardDeleteCompanyValidation,
  requestDocumentsValidation,
  listAdminAuditEventsValidation,
  listAdminOpsRequestsValidation,
  listAdminServiceRequestsValidation,
  listAdminBusinessSetupRequestsValidation,
  listAdminInhouseProductsValidation,
  listAdminInhouseVariantsValidation,
  inhouseProductIdParamValidation,
  inhouseVariantIdParamValidation,
  updateServiceRequestWorkflowValidation,
  updateServiceRequestContentValidation,
  updateBusinessSetupWorkflowValidation,
  listAdminConversationsValidation,
  listAdminCallLogsValidation,
  serviceRequestIdParamValidation,
  businessSetupRequestIdParamValidation,
  userIdParamValidation
} = require('../validators/admin.validators');
const {
  createProductValidation,
  updateProductValidation,
  adjustQuantityValidation,
  uploadProductImageValidation
} = require('../../product/validators/product.validators');
const {
  createVariantValidation,
  updateVariantValidation,
  adjustVariantQuantityValidation
} = require('../../product/validators/productVariant.validators');

const router = Router();

// All admin routes require authentication and admin-compatible role.
router.use(authenticate, authorizeRoles('admin'));

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', getAdminStatsController);

// GET /api/admin/overview - Extended observability payload
router.get('/overview', getAdminOverviewController);

// GET /api/admin/companies - List all companies
router.get('/companies', validate(listEntitiesValidation), listAllCompaniesController);

// PATCH /api/admin/companies/:companyId/status - set lifecycle status
router.patch('/companies/:companyId/status', validate(setCompanyStatusValidation), setCompanyStatusController);

// POST /api/admin/companies/:companyId/archive - archive/deactivate company
router.post('/companies/:companyId/archive', validate(archiveCompanyValidation), archiveCompanyController);

// DELETE /api/admin/companies/:companyId - legacy endpoint (archives instead)
router.delete('/companies/:companyId', validate(archiveCompanyValidation), deleteCompanyController);

// POST /api/admin/companies/:companyId/hard-delete - super-admin only async cleanup path
router.post('/companies/:companyId/hard-delete', validate(hardDeleteCompanyValidation), hardDeleteCompanyController);

// POST /api/admin/companies/:companyId/request-documents - Request verification documents from company
router.post('/companies/:companyId/request-documents', validate(requestDocumentsValidation), requestDocumentsController);

// GET /api/admin/users - List all users
router.get('/users', validate(listEntitiesValidation), listAllUsersController);

// GET /api/admin/users/:userId/overview - User 360 details for admin console
router.get('/users/:userId/overview', validate(userIdParamValidation), getAdminUserOverviewController);

// GET /api/admin/service-requests - Global admin service queue
router.get('/service-requests', validate(listAdminServiceRequestsValidation), listAdminServiceRequestsController);

// GET /api/admin/business-setup-requests - Startup assistance queue
router.get('/business-setup-requests', validate(listAdminBusinessSetupRequestsValidation), listAdminBusinessSetupRequestsController);

// GET /api/admin/ops-requests - merged services + startup queue
router.get('/ops-requests', validate(listAdminOpsRequestsValidation), listAdminOpsRequestsController);

// GET /api/admin/inhouse-products/categories - in-house category stats
router.get('/inhouse-products/categories', listAdminInhouseProductCategoriesController);

// GET /api/admin/inhouse-products - in-house product list
router.get('/inhouse-products', validate(listAdminInhouseProductsValidation), listAdminInhouseProductsController);

// POST /api/admin/inhouse-products - create in-house product
router.post('/inhouse-products', validate(createProductValidation), createAdminInhouseProductController);

// GET /api/admin/inhouse-products/:productId - in-house product detail
router.get('/inhouse-products/:productId', validate(inhouseProductIdParamValidation), getAdminInhouseProductController);

// PUT /api/admin/inhouse-products/:productId - update in-house product
router.put(
  '/inhouse-products/:productId',
  validate([...inhouseProductIdParamValidation, ...updateProductValidation]),
  updateAdminInhouseProductController
);

// PATCH /api/admin/inhouse-products/:productId/quantity - quantity adjust
router.patch(
  '/inhouse-products/:productId/quantity',
  validate([...inhouseProductIdParamValidation, ...adjustQuantityValidation]),
  adjustAdminInhouseProductQuantityController
);

// DELETE /api/admin/inhouse-products/:productId - archive in-house product
router.delete('/inhouse-products/:productId', validate(inhouseProductIdParamValidation), deleteAdminInhouseProductController);

// POST /api/admin/inhouse-products/:productId/images - upload in-house product image
router.post(
  '/inhouse-products/:productId/images',
  validate([...inhouseProductIdParamValidation, ...uploadProductImageValidation]),
  uploadAdminInhouseProductImageController
);

// GET /api/admin/inhouse-products/:productId/variants - list in-house variants
router.get(
  '/inhouse-products/:productId/variants',
  validate(listAdminInhouseVariantsValidation),
  listAdminInhouseVariantsController
);

// POST /api/admin/inhouse-products/:productId/variants - create in-house variant
router.post(
  '/inhouse-products/:productId/variants',
  validate([...inhouseProductIdParamValidation, ...createVariantValidation]),
  createAdminInhouseVariantController
);

// GET /api/admin/inhouse-products/:productId/variants/:variantId - in-house variant detail
router.get(
  '/inhouse-products/:productId/variants/:variantId',
  validate([...inhouseProductIdParamValidation, ...inhouseVariantIdParamValidation]),
  getAdminInhouseVariantController
);

// PUT /api/admin/inhouse-products/:productId/variants/:variantId - update in-house variant
router.put(
  '/inhouse-products/:productId/variants/:variantId',
  validate([...inhouseProductIdParamValidation, ...inhouseVariantIdParamValidation, ...updateVariantValidation]),
  updateAdminInhouseVariantController
);

// PATCH /api/admin/inhouse-products/:productId/variants/:variantId/quantity - adjust in-house variant quantity
router.patch(
  '/inhouse-products/:productId/variants/:variantId/quantity',
  validate([...inhouseProductIdParamValidation, ...inhouseVariantIdParamValidation, ...adjustVariantQuantityValidation]),
  adjustAdminInhouseVariantQuantityController
);

// DELETE /api/admin/inhouse-products/:productId/variants/:variantId - archive in-house variant
router.delete(
  '/inhouse-products/:productId/variants/:variantId',
  validate([...inhouseProductIdParamValidation, ...inhouseVariantIdParamValidation]),
  deleteAdminInhouseVariantController
);

// GET /api/admin/service-requests/:serviceRequestId - Service request detail
router.get('/service-requests/:serviceRequestId', validate(serviceRequestIdParamValidation), getAdminServiceRequestController);

// GET /api/admin/business-setup-requests/:requestId - Startup request detail
router.get(
  '/business-setup-requests/:requestId',
  validate(businessSetupRequestIdParamValidation),
  getAdminBusinessSetupRequestController
);

// PATCH /api/admin/service-requests/:serviceRequestId/workflow - workflow mutation
router.patch(
  '/service-requests/:serviceRequestId/workflow',
  validate(updateServiceRequestWorkflowValidation),
  updateAdminServiceRequestWorkflowController
);

// PATCH /api/admin/service-requests/:serviceRequestId/content - content correction mutation
router.patch(
  '/service-requests/:serviceRequestId/content',
  validate(updateServiceRequestContentValidation),
  updateAdminServiceRequestContentController
);

// PATCH /api/admin/business-setup-requests/:requestId/workflow - workflow mutation
router.patch(
  '/business-setup-requests/:requestId/workflow',
  validate(updateBusinessSetupWorkflowValidation),
  updateAdminBusinessSetupRequestWorkflowController
);

// GET /api/admin/conversations - admin communications queue
router.get('/conversations', validate(listAdminConversationsValidation), listAdminConversationsController);

// GET /api/admin/call-logs - admin call log queue
router.get('/call-logs', validate(listAdminCallLogsValidation), listAdminCallLogsController);

// GET /api/admin/audit-events - immutable admin audit stream
router.get('/audit-events', validate(listAdminAuditEventsValidation), listAdminAuditEventsController);

module.exports = router;
