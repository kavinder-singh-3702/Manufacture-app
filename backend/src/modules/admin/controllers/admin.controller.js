const { getAdminStats, listAllCompanies, listAllUsers, deleteCompany, requestDocuments } = require('../services/admin.service');

/**
 * GET /api/admin/stats
 * Returns dashboard statistics for admin users
 */
const getAdminStatsController = async (req, res, next) => {
  try {
    const stats = await getAdminStats();
    return res.json({ stats });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/companies
 * Returns all companies (admin only)
 * Query params: status, search, limit, offset
 */
const listAllCompaniesController = async (req, res, next) => {
  try {
    const { status, search, limit, offset } = req.query;
    const result = await listAllCompanies({
      status,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/users
 * Returns all users (admin only)
 * Query params: status, search, limit, offset
 */
const listAllUsersController = async (req, res, next) => {
  try {
    const { status, search, limit, offset } = req.query;
    const result = await listAllUsers({
      status,
      search,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/admin/companies/:companyId
 * Deletes a company (admin only)
 */
const deleteCompanyController = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const result = await deleteCompany(companyId);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/companies/:companyId/request-documents
 * Request verification documents from a company owner (admin only)
 * Body: { message?, sendEmail?, sendNotification? }
 */
const requestDocumentsController = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { message, sendEmail, sendNotification } = req.body;
    const adminId = req.user.id;

    const result = await requestDocuments(companyId, adminId, {
      message,
      sendEmail: sendEmail !== false, // Default to true
      sendNotification: sendNotification !== false // Default to true
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdminStatsController,
  listAllCompaniesController,
  listAllUsersController,
  deleteCompanyController,
  requestDocumentsController
};
