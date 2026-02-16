const createError = require('http-errors');
const { isAdminRole } = require('../../utils/roles');

const ADMIN_PERMISSIONS = Object.freeze({
  READ_OVERVIEW: 'admin.read.overview',
  READ_AUDIT_EVENTS: 'admin.read.audit-events',
  READ_USERS: 'admin.read.users',
  READ_COMPANIES: 'admin.read.companies',
  READ_USER_OVERVIEW: 'admin.read.user-overview',
  READ_VERIFICATIONS: 'admin.read.verifications',
  READ_SERVICE_REQUESTS: 'admin.read.service-requests',
  READ_CONVERSATIONS: 'admin.read.conversations',
  READ_CALL_LOGS: 'admin.read.call-logs',
  MUTATE_COMPANY_STATUS: 'admin.mutate.company-status',
  MUTATE_SERVICE_REQUEST_WORKFLOW: 'admin.mutate.service-request-workflow',
  MUTATE_SERVICE_REQUEST_CONTENT: 'admin.mutate.service-request-content',
  REQUEST_COMPANY_DOCUMENTS: 'admin.mutate.request-documents',
  HARD_DELETE_COMPANY: 'admin.mutate.hard-delete-company'
});

const PERMISSIONS_BY_ROLE = Object.freeze({
  admin: new Set([
    ADMIN_PERMISSIONS.READ_OVERVIEW,
    ADMIN_PERMISSIONS.READ_AUDIT_EVENTS,
    ADMIN_PERMISSIONS.READ_USERS,
    ADMIN_PERMISSIONS.READ_COMPANIES,
    ADMIN_PERMISSIONS.READ_USER_OVERVIEW,
    ADMIN_PERMISSIONS.READ_VERIFICATIONS,
    ADMIN_PERMISSIONS.READ_SERVICE_REQUESTS,
    ADMIN_PERMISSIONS.READ_CONVERSATIONS,
    ADMIN_PERMISSIONS.READ_CALL_LOGS,
    ADMIN_PERMISSIONS.MUTATE_COMPANY_STATUS,
    ADMIN_PERMISSIONS.MUTATE_SERVICE_REQUEST_WORKFLOW,
    ADMIN_PERMISSIONS.REQUEST_COMPANY_DOCUMENTS
  ]),
  'super-admin': new Set(Object.values(ADMIN_PERMISSIONS))
});

const hasAdminPermission = (role, permission) => {
  if (!role || !permission || !isAdminRole(role)) return false;
  const permissions = PERMISSIONS_BY_ROLE[role];
  return Boolean(permissions && permissions.has(permission));
};

const assertAdminPermission = (user, permission) => {
  if (!user?.role || !hasAdminPermission(user.role, permission)) {
    throw createError(403, 'You are not allowed to perform this admin action');
  }
};

const validateMutationContext = ({
  actorRole,
  contextCompanyId,
  targetCompanyId
}) => {
  // super-admin can act globally and may omit company context.
  if (actorRole === 'super-admin') {
    if (contextCompanyId && targetCompanyId && String(contextCompanyId) !== String(targetCompanyId)) {
      throw createError(400, 'contextCompanyId must match the target company');
    }
    return;
  }

  if (!contextCompanyId) {
    throw createError(400, 'contextCompanyId is required for admin mutations');
  }

  if (targetCompanyId && String(contextCompanyId) !== String(targetCompanyId)) {
    throw createError(400, 'contextCompanyId must match the target company');
  }
};

module.exports = {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
  assertAdminPermission,
  validateMutationContext
};
