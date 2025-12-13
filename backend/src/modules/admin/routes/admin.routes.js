const { Router } = require('express');
const { authenticate, authorizeRoles } = require('../../../middleware/authMiddleware');
const {
  getAdminStatsController,
  listAllCompaniesController,
  listAllUsersController,
  deleteCompanyController,
  requestDocumentsController
} = require('../controllers/admin.controller');

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate, authorizeRoles('admin'));

// GET /api/admin/stats - Get dashboard statistics
router.get('/stats', getAdminStatsController);

// GET /api/admin/companies - List all companies
router.get('/companies', listAllCompaniesController);

// DELETE /api/admin/companies/:companyId - Delete a company
router.delete('/companies/:companyId', deleteCompanyController);

// POST /api/admin/companies/:companyId/request-documents - Request verification documents from company
router.post('/companies/:companyId/request-documents', requestDocumentsController);

// GET /api/admin/users - List all users
router.get('/users', listAllUsersController);

module.exports = router;
