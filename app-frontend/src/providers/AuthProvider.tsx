import { createContext, ReactNode, useCallback, useMemo, useState } from "react";
import { AuthUser, LoginPayload } from "../types/auth";
import { authService } from "../services/auth.service";

type AuthContextValue = {
  user: AuthUser | null;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<AuthUser | null>(null);

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
    }),
    [login, logout, setUser, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
