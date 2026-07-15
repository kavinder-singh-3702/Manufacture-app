import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AppleSignInPayload, AuthUser, AuthView, LoginPayload } from "../types/auth";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import { companyService } from "../services/company.service";
import { ApiError } from "../services/http";
import { AppRole, AppRoleType, isAdminRole } from "../constants/roles";
import { tokenStorage } from "../services/tokenStorage";
import { disconnectChatSocket } from "../services/chatSocket";

/**
 * Normalizes the user object to ensure it has a valid role
 * If the API doesn't return a role, defaults to "user"
 */
const normalizeUser = (user: AuthUser): AuthUser => ({
  ...user,
  role: (user.role as AppRoleType) || AppRole.USER,
});

/**
 * True when a user needs to complete the one-time phone-collection gate:
 * created via a social provider (Apple today) AND non-admin AND no phone.
 * Used to hydrate pendingSocialPhoneCollection on bootstrap so a user who
 * force-quit right after Apple sign-in still lands on AddMobileNumberScreen
 * on relaunch instead of falling through to Dashboard.
 */
const shouldGatePhoneForUser = (user: AuthUser): boolean => {
  if (isAdminRole(user.role)) return false;
  if (user.phone) return false;
  return typeof user.appleUserId === "string" && user.appleUserId.length > 0;
};

type AuthContextValue = {
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  signInWithApple: (payload: AppleSignInPayload) => Promise<void>;
  logout: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  setUser: (user: AuthUser | null, options?: { requiresVerification?: boolean }) => void;
  initializing: boolean;
  bootstrapError: string | null;
  bootstrapWarning: string | null;
  requestLogin: () => void;
  requestSignup: () => void;
  refreshUser: () => Promise<AuthUser | null>;
  authView: AuthView | null;
  clearAuthView: () => void;
  pendingVerificationRedirect: string | null;
  clearPendingVerificationRedirect: () => void;
  /**
   * True only between a fresh social sign-in (Apple today, Google later)
   * and the user adding their phone. Drives the one-time AddMobileNumber
   * gate. Existing sessions where the app boots into an authenticated
   * user keep this false, so launching the app never lands on the
   * phone screen unless the user just signed in. Admin accounts are
   * exempt — the flag never sets for them.
   */
  pendingSocialPhoneCollection: boolean;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [bootstrapWarning, setBootstrapWarning] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView | null>(null);
  const [pendingVerificationRedirect, setPendingVerificationRedirect] = useState<string | null>(null);
  const [pendingSocialPhoneCollection, setPendingSocialPhoneCollection] = useState(false);

  const refreshUser = useCallback(async () => {
    const { user: currentUser } = await userService.getCurrentUser();
    const normalized = normalizeUser(currentUser);
    setUserState(normalized);
    setAuthView(null);
    setBootstrapError(null);
    setBootstrapWarning(null);
    if (normalized.phone) {
      setPendingSocialPhoneCollection(false);
    }
    return normalized;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const sessionRestoreWarning = "Could not restore previous session. You can still log in.";
    const isHardConfigFailure = (message: string) =>
      /(EXPO_PUBLIC_API_URL|Production builds require an HTTPS|Unable to derive chat socket URL)/i.test(message);

    const bootstrap = async () => {
      try {
        const token = await tokenStorage.getToken();
        if (!isMounted) return;

        if (!token) {
          setUserState(null);
          setPendingSocialPhoneCollection(false);
          setBootstrapError(null);
          setBootstrapWarning(null);
          return;
        }

        const { user: currentUser } = await userService.getCurrentUser();
        if (!isMounted) return;

        // Auto-restore activeCompany if missing but user has companies
        if (!currentUser.activeCompany && Array.isArray(currentUser.companies) && currentUser.companies.length > 0) {
          try {
            const switchRes = await companyService.switchActive(currentUser.companies[0]);
            currentUser.activeCompany = switchRes.activeCompany ?? currentUser.companies[0];
          } catch (switchErr) {
            console.warn("Auto-restore activeCompany failed:", switchErr);
          }
        }

        const normalized = normalizeUser(currentUser);
        setUserState(normalized);
        setAuthView(null);
        setBootstrapError(null);
        setBootstrapWarning(null);
        // Durably re-raise the phone-collection gate for a returning Apple-
        // signed user who never finished the phone step. Without this a
        // force-quit right after the initial Apple sign-in would land them
        // on Dashboard on relaunch because the in-memory flag defaults to
        // false. Only fires for the exact conditions signInWithApple
        // originally set it: non-admin, no phone, and Apple provenance.
        if (shouldGatePhoneForUser(normalized)) {
          setPendingSocialPhoneCollection(true);
        }
      } catch (error) {
        if (!isMounted) return;

        setUserState(null);
        setPendingSocialPhoneCollection(false);
        if (error instanceof ApiError) {
          // 401 = token expired/invalid, clear it and continue logged out.
          if (error.status === 401) {
            await tokenStorage.removeToken();
            setBootstrapWarning(null);
            setBootstrapError(null);
          } else if (error.kind === "network" || error.status === 0) {
            console.warn("Session restore skipped due to network issue.", error.debug);
            setBootstrapWarning(sessionRestoreWarning);
            setBootstrapError(null);
          } else {
            console.warn("Session restore failed with API error.", { status: error.status });
            setBootstrapWarning(sessionRestoreWarning);
            setBootstrapError(null);
          }
        } else if (error instanceof Error) {
          if (isHardConfigFailure(error.message)) {
            setBootstrapWarning(null);
            setBootstrapError(error.message);
          } else {
            console.warn("Session restore failed unexpectedly.", error);
            setBootstrapWarning(sessionRestoreWarning);
            setBootstrapError(null);
          }
        } else {
          console.warn("Session restore failed with unknown error.", error);
          setBootstrapWarning(sessionRestoreWarning);
          setBootstrapError(null);
        }
      } finally {
        if (isMounted) {
          setInitializing(false);
        }
      }
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload);
    // Store the JWT token for API authentication
    if (response.token) {
      await tokenStorage.setToken(response.token);
    }
    setUserState(normalizeUser(response.user));
    setAuthView(null);
    setBootstrapError(null);
    setBootstrapWarning(null);
  }, []);

  const signInWithApple = useCallback(async (payload: AppleSignInPayload) => {
    const response = await authService.appleSignIn(payload);
    if (response.token) {
      await tokenStorage.setToken(response.token);
    }
    const normalized = normalizeUser(response.user);
    setUserState(normalized);
    setAuthView(null);
    setBootstrapError(null);
    setBootstrapWarning(null);
    // Trigger the one-time phone-collection gate ONLY when a non-admin user
    // just signed in and has no phone on file. Admin accounts are exempt —
    // they don't need a phone to operate the app. Existing accounts that
    // already have a phone fall through without gating. Once the user adds
    // a phone, AddMobileNumberScreen calls setUser with the updated record;
    // we clear the flag in setUser when user.phone becomes truthy.
    if (!isAdminRole(normalized.role) && !normalized.phone) {
      setPendingSocialPhoneCollection(true);
    } else {
      setPendingSocialPhoneCollection(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    // Remove the stored JWT token
    await tokenStorage.removeToken();
    disconnectChatSocket();
    setUserState(null);
    setAuthView("login");
    setBootstrapError(null);
    setBootstrapWarning(null);
    setPendingSocialPhoneCollection(false);
  }, []);

  const switchCompany = useCallback(async (companyId: string) => {
    const response = await companyService.switchActive(companyId);
    setUserState((previous) => {
      if (!previous) return previous;
      const existingCompanies = Array.isArray(previous.companies) ? previous.companies : [];
      const updatedCompanies = existingCompanies.includes(companyId) ? existingCompanies : [...existingCompanies, companyId];
      return {
        ...previous,
        activeCompany: response.activeCompany ?? companyId,
        companies: updatedCompanies,
      };
    });
  }, []);

  const setUser = useCallback((next: AuthUser | null, options?: { requiresVerification?: boolean }) => {
    setUserState(next ? normalizeUser(next) : null);
    if (next) {
      setAuthView(null);
      if (options?.requiresVerification && next.activeCompany) {
        setPendingVerificationRedirect(next.activeCompany);
      }
      if (next.phone) {
        setPendingSocialPhoneCollection(false);
      }
    } else {
      // Reset the phone-collection gate when the user becomes null so a
      // stale-true value can't survive into the NEXT sign-in. Logout
      // already clears this, but 401 handlers and the bootstrap error
      // path also null the user without going through logout.
      setPendingSocialPhoneCollection(false);
    }
  }, []);

  const requestLogin = useCallback(() => {
    setUserState(null);
    setAuthView("login");
    setBootstrapWarning(null);
  }, []);

  const requestSignup = useCallback(() => {
    setUserState(null);
    setAuthView("signup");
    setBootstrapWarning(null);
  }, []);

  const clearAuthView = useCallback(() => {
    setAuthView(null);
  }, []);

  const clearPendingVerificationRedirect = useCallback(() => {
    setPendingVerificationRedirect(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      signInWithApple,
      logout,
      switchCompany,
      setUser,
      initializing,
      bootstrapError,
      bootstrapWarning,
      requestLogin,
      requestSignup,
      refreshUser,
      authView,
      clearAuthView,
      pendingVerificationRedirect,
      clearPendingVerificationRedirect,
      pendingSocialPhoneCollection,
    }),
    [authView, bootstrapError, bootstrapWarning, clearAuthView, clearPendingVerificationRedirect, initializing, login, logout, pendingSocialPhoneCollection, pendingVerificationRedirect, refreshUser, requestLogin, requestSignup, setUser, signInWithApple, switchCompany, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
