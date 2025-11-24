"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthUser, LoginPayload } from "../types/auth";
import { authService } from "../services/auth";
import { userService } from "../services/user";
import { companyService } from "../services/company";
import { ApiError } from "../lib/api-error";

export type AuthView = "intro" | "login" | "signup";

type AuthContextValue = {
  user: AuthUser | null;
  initializing: boolean;
  bootstrapError: string | null;
  login: (payload: LoginPayload) => Promise<AuthUser>;
  logout: () => Promise<void>;
  switchCompany: (companyId: string) => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  refreshUser: () => Promise<void>;
  requestAuthView: (view: AuthView) => void;
  activeAuthView: AuthView;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [activeAuthView, setActiveAuthView] = useState<AuthView>("intro");

  const refreshUser = useCallback(async () => {
    try {
      setInitializing(true);
      const { user: currentUser } = await userService.getCurrentUser();
      setUser(currentUser);
      setBootstrapError(null);
      setActiveAuthView("intro");
    } catch (error) {
      setUser(null);
      if (error instanceof ApiError) {
        if (error.status === 401) {
          setBootstrapError(null);
        } else {
          setBootstrapError(error.message);
        }
      } else if (error instanceof Error) {
        setBootstrapError(error.message);
      } else {
        setBootstrapError("Unable to connect to backend API.");
      }
    } finally {
      setInitializing(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (payload: LoginPayload) => {
    const { user: authenticatedUser } = await authService.login(payload);
    setUser(authenticatedUser);
    setBootstrapError(null);
    setActiveAuthView("intro");
    return authenticatedUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setActiveAuthView("login");
  }, []);

  const switchCompany = useCallback(
    async (companyId: string) => {
      const response = await companyService.switchActive(companyId);
      setUser((previous) => {
        if (!previous) return previous;
        const existingCompanies = Array.isArray(previous.companies) ? previous.companies : [];
        const updatedCompanies = existingCompanies.includes(companyId)
          ? existingCompanies
          : [...existingCompanies, companyId];
        return {
          ...previous,
          activeCompany: response.activeCompany ?? companyId,
          companies: updatedCompanies,
        };
      });
    },
    []
  );

  const requestAuthView = useCallback((view: AuthView) => {
    setActiveAuthView(view);
  }, []);

  const value = useMemo(
    () => ({
      user,
      initializing,
      bootstrapError,
      login,
      logout,
      switchCompany,
      setUser,
      refreshUser,
      requestAuthView,
      activeAuthView,
    }),
    [user, initializing, bootstrapError, login, logout, switchCompany, refreshUser, requestAuthView, activeAuthView]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
};
