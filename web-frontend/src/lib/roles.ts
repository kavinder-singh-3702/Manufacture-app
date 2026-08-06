/**
 * Single source of truth for "is this account an admin?" and "where does it
 * live?" — mirrors app-frontend/src/constants/roles.ts's `isAdminRole`.
 *
 * Before this file, `role === "admin"` was re-implemented inline in ~8 places
 * across the web frontend, and every one of them missed `"super-admin"`
 * (backend/src/models/user.model.js's USER_ROLES is
 * `["super-admin", "admin", "user"]`). A super-admin logging in was silently
 * treated as a normal user and sent to /dashboard instead of /admin. Route
 * through these instead of re-checking `role` by hand.
 */

export const isAdminRole = (role?: string | null): boolean => role === "admin" || role === "super-admin";

/** The workspace home for a user — the single answer to "where does this account belong?". */
export const homePathFor = (user?: { role?: string | null } | null): string =>
  isAdminRole(user?.role) ? "/admin" : "/dashboard";

/** True when `path` is a route this account is allowed to occupy. Only /admin is currently restricted. */
export const isPathAllowedForRole = (path: string, user?: { role?: string | null } | null): boolean =>
  path.startsWith("/admin") ? isAdminRole(user?.role) : true;
