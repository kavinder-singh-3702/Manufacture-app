import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AuthUser, AuthView, LoginPayload } from "../types/auth";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import { companyService } from "../services/company.service";
import { ApiError } from "../services/http";
import { AppRole, AppRoleType } from "../constants/roles";
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

type AuthContextValue = {
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  setUser: (user: AuthUser | null, options?: { requiresVerification?: boolean }) => void;
  initializing: boolean;
  bootstrapError: string | null;
  requestLogin: () => void;
  requestSignup: () => void;
  refreshUser: () => Promise<AuthUser | null>;
  authView: AuthView | null;
  clearAuthView: () => void;
  pendingVerificationRedirect: string | null;
  clearPendingVerificationRedirect: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView | null>(null);
  const [pendingVerificationRedirect, setPendingVerificationRedirect] = useState<string | null>(null);

  const refreshUser = useCallback(async () => {
    const { user: currentUser } = await userService.getCurrentUser();
    const normalized = normalizeUser(currentUser);
    setUserState(normalized);
    setAuthView(null);
    setBootstrapError(null);
    return normalized;
  }, []);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        const { user: currentUser } = await userService.getCurrentUser();
        if (!isMounted) return;
        setUserState(normalizeUser(currentUser));
        setAuthView(null);
        setBootstrapError(null);
      } catch (error) {
        if (isMounted) {
          setUserState(null);
          if (error instanceof ApiError) {
            // 401 = not logged in, this is expected - don't show error
            if (error.status === 401) {
              setBootstrapError(null);
            } else if (error.status === 0) {
              // Network error - couldn't connect
              setBootstrapError(error.message);
            } else {
              setBootstrapError(error.message);
            }
          } else if (error instanceof Error) {
            setBootstrapError(`Network error: ${error.message}`);
          } else {
            setBootstrapError("Unable to reach the backend.");
          }
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
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    // Remove the stored JWT token
    await tokenStorage.removeToken();
    disconnectChatSocket();
    setUserState(null);
    setAuthView("login");
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
      // If this is a signup that requires verification, set the redirect
      if (options?.requiresVerification && next.activeCompany) {
        setPendingVerificationRedirect(next.activeCompany);
      }
    }
  }, []);

  const requestLogin = useCallback(() => {
    setUserState(null);
    setAuthView("login");
  }, []);

  const requestSignup = useCallback(() => {
    setUserState(null);
    setAuthView("signup");
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
      logout,
      switchCompany,
      setUser,
      initializing,
      bootstrapError,
      requestLogin,
      requestSignup,
      refreshUser,
      authView,
      clearAuthView,
      pendingVerificationRedirect,
      clearPendingVerificationRedirect,
    }),
    [authView, bootstrapError, clearAuthView, clearPendingVerificationRedirect, initializing, login, logout, pendingVerificationRedirect, refreshUser, requestLogin, requestSignup, setUser, switchCompany, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
