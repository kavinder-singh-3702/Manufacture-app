/**
 * App-level roles for navigation and access control
 * These determine which navigation stack a user sees
 */
export const AppRole = {
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
  USER: "user",
  GUEST: "guest",
} as const;

export type AppRoleType = (typeof AppRole)[keyof typeof AppRole];

export const isAdminRole = (role?: string | null): boolean =>
  role === AppRole.ADMIN || role === AppRole.SUPER_ADMIN;

/**
 * Business/operational roles within a company
 * These determine what operations a user can perform
 */
export const BusinessRole = {
  SUPERVISOR: "Supervisor",
  OPERATOR: "Operator",
  MAINTENANCE: "Maintenance",
  QUALITY: "Quality",
} as const;

export type BusinessRoleType = (typeof BusinessRole)[keyof typeof BusinessRole];

// Legacy export for backward compatibility
export const roles = BusinessRole;
export type Role = BusinessRoleType;
