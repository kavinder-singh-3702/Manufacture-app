import { createContext, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { AuthUser, LoginPayload } from "../types/auth";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import { ApiError } from "../services/http";

type AuthContextValue = {
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
  initializing: boolean;
  bootstrapError: string | null;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const bootstrap = async () => {
      try {
        const { user: currentUser } = await userService.getCurrentUser();
        if (isMounted) {
          setUserState(currentUser);
          setBootstrapError(null);
        }
      } catch (error) {
        if (isMounted) {
          setUserState(null);
          if (error instanceof ApiError) {
            if (error.status === 401) {
              setBootstrapError(null);
            } else {
              setBootstrapError(error.message);
            }
          } else if (error instanceof Error) {
            setBootstrapError(error.message);
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
    const { user: authenticatedUser } = await authService.login(payload);
    setUserState(authenticatedUser);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUserState(null);
  }, []);

  const setUser = useCallback((next: AuthUser | null) => {
    setUserState(next);
  }, []);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      setUser,
      initializing,
      bootstrapError,
    }),
    [bootstrapError, initializing, login, logout, setUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
