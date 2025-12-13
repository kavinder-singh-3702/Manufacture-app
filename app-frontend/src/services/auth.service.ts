import { apiClient } from "./apiClient";
import {
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  ResetPasswordPayload,
  SignupCompletePayload,
  SignupStartPayload,
  SignupVerifyPayload,
} from "../types/auth";

type SignupStartResponse = {
  message: string;
  expiresInMs: number;
};

type SignupVerifyResponse = {
  message: string;
};

type SignupCompleteResponse = {
  user: AuthUser;
  token?: string;
};

type LoginResponse = {
  user: AuthUser;
  token?: string;
};

type ForgotPasswordResponse = {
  message: string;
  expiresInMs?: number;
  resetToken?: string;
  expiresAt?: string;
};

type ResetPasswordResponse = {
  user: AuthUser;
};

const signupBasePath = "/auth/signup";

const signup = {
  start: (payload: SignupStartPayload) =>
    apiClient.post<SignupStartResponse>(`${signupBasePath}/start`, payload),
  verify: (payload: SignupVerifyPayload) =>
    apiClient.post<SignupVerifyResponse>(`${signupBasePath}/verify`, payload),
  complete: (payload: SignupCompletePayload) =>
    apiClient.post<SignupCompleteResponse>(`${signupBasePath}/complete`, payload),
};

const login = (payload: LoginPayload) => apiClient.post<LoginResponse>("/auth/login", payload);

const logout = () => apiClient.post<void>("/auth/logout");

const requestPasswordReset = (payload: ForgotPasswordPayload) =>
  apiClient.post<ForgotPasswordResponse>("/auth/password/forgot", payload);

const resetPassword = (payload: ResetPasswordPayload) =>
  apiClient.post<ResetPasswordResponse>("/auth/password/reset", payload);

export const authService = {
  signup,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
};
