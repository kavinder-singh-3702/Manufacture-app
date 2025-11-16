import { apiClient } from "./apiClient";
import {
  AuthUser,
  LoginPayload,
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
};

type LoginResponse = {
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

export const authService = {
  signup,
  login,
  logout,
};
