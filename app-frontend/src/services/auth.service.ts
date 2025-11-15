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
    apiClient<SignupStartResponse>({
      path: `${signupBasePath}/start`,
      method: "POST",
      data: payload,
    }),
  verify: (payload: SignupVerifyPayload) =>
    apiClient<SignupVerifyResponse>({
      path: `${signupBasePath}/verify`,
      method: "POST",
      data: payload,
    }),
  complete: (payload: SignupCompletePayload) =>
    apiClient<SignupCompleteResponse>({
      path: `${signupBasePath}/complete`,
      method: "POST",
      data: payload,
    }),
};

const login = (payload: LoginPayload) =>
  apiClient<LoginResponse>({
    path: "/auth/login",
    method: "POST",
    data: payload,
  });

const logout = () =>
  apiClient<void>({
    path: "/auth/logout",
    method: "POST",
  });

export const authService = {
  signup,
  login,
  logout,
};
