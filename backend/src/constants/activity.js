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
  COMPANY_VERIFICATION_DECIDED: 'company.verification.decided'
});

const ACTIVITY_CATEGORIES = Object.freeze({
  AUTH: 'auth',
  USER: 'user',
  COMPANY: 'company',
  VERIFICATION: 'verification'
});

module.exports = {
  ACTIVITY_ACTIONS,
  ACTIVITY_CATEGORIES
};
