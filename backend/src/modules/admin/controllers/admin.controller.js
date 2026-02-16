const {
  getAdminStats,
  getAdminOverview,
  listAllCompanies,
  listAllUsers,
  setCompanyStatus,
  archiveCompany,
  deleteCompany,
  hardDeleteCompany,
  listAdminAuditEvents,
  requestDocuments
} = require('../services/admin.service');
const {
  ADMIN_PERMISSIONS,
  assertAdminPermission,
  validateMutationContext
} = require('../permissions');
const { ACTIVITY_ACTIONS } = require('../../../constants/activity');
const { recordActivitySafe, extractRequestContext } = require('../../activity/services/activity.service');

const recordAdminActivity = async ({
  req,
  action,
  label,
  description,
  companyId,
  companyName,
  meta
}) => {
  await recordActivitySafe({
    userId: req.user?.id,
    action,
    label,
    description,
    category: 'admin',
    companyId,
    companyName,
    meta,
    context: extractRequestContext(req)
  });
};

/**
 * GET /api/admin/stats
 */
const getAdminStatsController = async (_req, res, next) => {
  try {
    const stats = await getAdminStats();
    return res.json({ stats });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/overview
 */
const getAdminOverviewController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_OVERVIEW);
    const overview = await getAdminOverview();
    return res.json({ overview });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/companies
 */
const listAllCompaniesController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_COMPANIES);
    const { status, search, limit, offset, sort } = req.query;
    const result = await listAllCompanies({
      status,
      search,
      limit,
      offset,
      sort
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/users
 */
const listAllUsersController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_USERS);
    const { status, search, limit, offset, sort, companyId } = req.query;
    const result = await listAllUsers({
      status,
      search,
      limit,
      offset,
      sort,
      companyId
    });
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/admin/audit-events
 */
const listAdminAuditEventsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.READ_AUDIT_EVENTS);
    const result = await listAdminAuditEvents(req.query);
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/admin/companies/:companyId/status
 */
const setCompanyStatusController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_COMPANY_STATUS);
    const { companyId } = req.params;
    const { status, reason, contextCompanyId } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId,
      targetCompanyId: companyId
    });

    const result = await setCompanyStatus({
      companyId,
      actorId: req.user.id,
      status,
      reason
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_COMPANY_STATUS_CHANGED,
      label: 'Company status changed',
      description: `${result.company.displayName} moved to ${status}`,
      companyId,
      companyName: result.company.displayName,
      meta: { status, reason }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/companies/:companyId/archive
 */
const archiveCompanyController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_COMPANY_STATUS);
    const { companyId } = req.params;
    const { reason, contextCompanyId } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId,
      targetCompanyId: companyId
    });

    const result = await archiveCompany({
      companyId,
      actorId: req.user.id,
      reason
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_COMPANY_ARCHIVED,
      label: 'Company archived',
      description: `${result.company.displayName} archived`,
      companyId,
      companyName: result.company.displayName,
      meta: { reason }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * DELETE /api/admin/companies/:companyId (deprecated -> archive)
 */
const deleteCompanyController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.MUTATE_COMPANY_STATUS);
    const { companyId } = req.params;
    const { reason, contextCompanyId } = req.body || {};

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId,
      targetCompanyId: companyId
    });

    const result = await deleteCompany({
      companyId,
      actorId: req.user.id,
      reason
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_COMPANY_ARCHIVED,
      label: 'Company archived (legacy delete route)',
      description: `${result.company.displayName} archived via deprecated delete route`,
      companyId,
      companyName: result.company.displayName,
      meta: { reason, deprecated: true }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/companies/:companyId/hard-delete
 */
const hardDeleteCompanyController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.HARD_DELETE_COMPANY);
    const { companyId } = req.params;
    const { reason, contextCompanyId } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId,
      targetCompanyId: companyId
    });

    const result = await hardDeleteCompany({
      companyId,
      actorId: req.user.id,
      reason
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_COMPANY_HARD_DELETE_REQUESTED,
      label: 'Company hard delete requested',
      description: `Hard delete job queued for company ${companyId}`,
      companyId,
      meta: { reason, jobId: result.job?.id }
    });

    return res.status(202).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/admin/companies/:companyId/request-documents
 */
const requestDocumentsController = async (req, res, next) => {
  try {
    assertAdminPermission(req.user, ADMIN_PERMISSIONS.REQUEST_COMPANY_DOCUMENTS);
    const { companyId } = req.params;
    const { message, sendEmail, sendNotification, contextCompanyId } = req.body;

    validateMutationContext({
      actorRole: req.user.role,
      contextCompanyId,
      targetCompanyId: companyId
    });

    const result = await requestDocuments(companyId, req.user.id, {
      message,
      sendEmail: sendEmail !== false,
      sendNotification: sendNotification !== false
    });

    await recordAdminActivity({
      req,
      action: ACTIVITY_ACTIONS.ADMIN_DOCUMENTS_REQUESTED,
      label: 'Company documents requested',
      description: `Requested documents for company ${companyId}`,
      companyId,
      meta: {
        sendEmail: sendEmail !== false,
        sendNotification: sendNotification !== false,
        message: message || null
      }
    });

    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getAdminStatsController,
  getAdminOverviewController,
  listAllCompaniesController,
  listAllUsersController,
  listAdminAuditEventsController,
  setCompanyStatusController,
  archiveCompanyController,
  deleteCompanyController,
  hardDeleteCompanyController,
  requestDocumentsController
};
