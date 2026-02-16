const ADMIN_ROLES = Object.freeze(['admin', 'super-admin']);

const ROLE_IMPLICATIONS = Object.freeze({
  'super-admin': ['admin', 'user'],
  admin: ['user'],
  user: []
});

const isAdminRole = (role) => ADMIN_ROLES.includes(role);

const roleSatisfies = (actualRole, allowedRoles = []) => {
  if (!actualRole || !Array.isArray(allowedRoles) || !allowedRoles.length) return false;
  if (allowedRoles.includes(actualRole)) return true;
  const implied = ROLE_IMPLICATIONS[actualRole] || [];
  return implied.some((role) => allowedRoles.includes(role));
};

module.exports = {
  ADMIN_ROLES,
  ROLE_IMPLICATIONS,
  isAdminRole,
  roleSatisfies
};
