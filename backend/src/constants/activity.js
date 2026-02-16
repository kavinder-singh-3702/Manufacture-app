const ACTIVITY_ACTIONS = Object.freeze({
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_SIGNUP_COMPLETED: 'auth.signup.completed',
  AUTH_PASSWORD_RESET_REQUESTED: 'auth.password.reset-requested',
  AUTH_PASSWORD_RESET: 'auth.password.reset',
  USER_PROFILE_UPDATED: 'user.profile.updated',
  USER_FILE_UPLOADED: 'user.file.uploaded',
  COMPANY_CREATED: 'company.created',
  COMPANY_UPDATED: 'company.updated',
  COMPANY_SWITCHED: 'company.switched',
  COMPANY_VERIFICATION_SUBMITTED: 'company.verification.submitted',
  COMPANY_VERIFICATION_DECIDED: 'company.verification.decided',
  ADMIN_COMPANY_STATUS_CHANGED: 'admin.company.status.changed',
  ADMIN_COMPANY_ARCHIVED: 'admin.company.archived',
  ADMIN_COMPANY_HARD_DELETE_REQUESTED: 'admin.company.hard-delete.requested',
  ADMIN_COMPANY_HARD_DELETE_COMPLETED: 'admin.company.hard-delete.completed',
  ADMIN_DOCUMENTS_REQUESTED: 'admin.company.documents.requested',
  ADMIN_VERIFICATION_DECIDED: 'admin.verification.decided',
  ADMIN_SERVICE_REQUEST_WORKFLOW_UPDATED: 'admin.service-request.workflow.updated',
  ADMIN_SERVICE_REQUEST_CONTENT_UPDATED: 'admin.service-request.content.updated'
});

const ACTIVITY_CATEGORIES = Object.freeze({
  AUTH: 'auth',
  USER: 'user',
  COMPANY: 'company',
  VERIFICATION: 'verification',
  ADMIN: 'admin'
});

module.exports = {
  ACTIVITY_ACTIONS,
  ACTIVITY_CATEGORIES
};
