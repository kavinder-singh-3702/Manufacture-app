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
  listAdminServiceRequestsController,
  getAdminServiceRequestController,
  updateAdminServiceRequestWorkflowController,
  updateAdminServiceRequestContentController,
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
  listAdminServiceRequestsValidation,
  updateServiceRequestWorkflowValidation,
  updateServiceRequestContentValidation,
  listAdminConversationsValidation,
  listAdminCallLogsValidation,
  serviceRequestIdParamValidation,
  userIdParamValidation
} = require('../validators/admin.validators');

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

// GET /api/admin/service-requests/:serviceRequestId - Service request detail
router.get('/service-requests/:serviceRequestId', validate(serviceRequestIdParamValidation), getAdminServiceRequestController);

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

// GET /api/admin/conversations - admin communications queue
router.get('/conversations', validate(listAdminConversationsValidation), listAdminConversationsController);

// GET /api/admin/call-logs - admin call log queue
router.get('/call-logs', validate(listAdminCallLogsValidation), listAdminCallLogsController);

// GET /api/admin/audit-events - immutable admin audit stream
router.get('/audit-events', validate(listAdminAuditEventsValidation), listAdminAuditEventsController);

module.exports = router;
