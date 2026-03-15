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
  BUSINESS_SETUP_REQUEST_SUBMITTED: 'business-setup.request.submitted',
  ADMIN_COMPANY_STATUS_CHANGED: 'admin.company.status.changed',
  ADMIN_COMPANY_ARCHIVED: 'admin.company.archived',
  ADMIN_COMPANY_HARD_DELETE_REQUESTED: 'admin.company.hard-delete.requested',
  ADMIN_COMPANY_HARD_DELETE_COMPLETED: 'admin.company.hard-delete.completed',
  ADMIN_DOCUMENTS_REQUESTED: 'admin.company.documents.requested',
  ADMIN_VERIFICATION_DECIDED: 'admin.verification.decided',
  ADMIN_SERVICE_REQUEST_WORKFLOW_UPDATED: 'admin.service-request.workflow.updated',
  ADMIN_SERVICE_REQUEST_CONTENT_UPDATED: 'admin.service-request.content.updated',
  ADMIN_BUSINESS_SETUP_WORKFLOW_UPDATED: 'admin.business-setup.workflow.updated',
  ADMIN_INHOUSE_PRODUCT_CREATED: 'admin.inhouse-product.created',
  ADMIN_INHOUSE_PRODUCT_UPDATED: 'admin.inhouse-product.updated',
  ADMIN_INHOUSE_PRODUCT_DELETED: 'admin.inhouse-product.deleted',
  ADMIN_INHOUSE_PRODUCT_IMAGE_UPLOADED: 'admin.inhouse-product.image-uploaded',
  ADMIN_INHOUSE_PRODUCT_QUANTITY_ADJUSTED: 'admin.inhouse-product.quantity-adjusted',
  ADMIN_INHOUSE_VARIANT_CREATED: 'admin.inhouse-variant.created',
  ADMIN_INHOUSE_VARIANT_UPDATED: 'admin.inhouse-variant.updated',
  ADMIN_INHOUSE_VARIANT_DELETED: 'admin.inhouse-variant.deleted',
  ADMIN_INHOUSE_VARIANT_QUANTITY_ADJUSTED: 'admin.inhouse-variant.quantity-adjusted'
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
