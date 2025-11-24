import { httpClient } from "../lib/http-client";
import {
  AuthUser,
  ForgotPasswordPayload,
  LoginPayload,
  ForgotPasswordResponse,
  ResetPasswordResponse,
  ResetPasswordPayload,
  SignupCompletePayload,
  SignupStartPayload,
  SignupVerifyPayload,
} from "../types/auth";

export type LoginResponse = { user: AuthUser };
export type SignupStartResponse = { message: string; expiresInMs: number };
export type SignupVerifyResponse = { message: string };
export type SignupCompleteResponse = { user: AuthUser };

const signupBase = "/auth/signup";

const signup = {
  start: (payload: SignupStartPayload) =>
    httpClient.post<SignupStartResponse>(`${signupBase}/start`, payload),
  verify: (payload: SignupVerifyPayload) =>
    httpClient.post<SignupVerifyResponse>(`${signupBase}/verify`, payload),
  complete: (payload: SignupCompletePayload) =>
    httpClient.post<SignupCompleteResponse>(`${signupBase}/complete`, payload),
};

const login = (payload: LoginPayload) => httpClient.post<LoginResponse>("/auth/login", payload);

const logout = () => httpClient.post<void>("/auth/logout");

const requestPasswordReset = (payload: ForgotPasswordPayload) =>
  httpClient.post<ForgotPasswordResponse>("/auth/password/forgot", payload);

const resetPassword = (payload: ResetPasswordPayload) =>
  httpClient.post<ResetPasswordResponse>("/auth/password/reset", payload);

export const authService = {
  signup,
  login,
  logout,
  requestPasswordReset,
  resetPassword,
};
