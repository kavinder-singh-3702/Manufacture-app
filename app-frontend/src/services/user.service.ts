import { apiClient } from "./apiClient";
import { AuthUser, UpdateUserPayload } from "../types/auth";

type UserResponse = {
  user: AuthUser;
};

const getCurrentUser = () => apiClient.get<UserResponse>("/users/me");

const updateCurrentUser = (payload: UpdateUserPayload) =>
  apiClient.patch<UserResponse>("/users/me", payload);

export const userService = {
  getCurrentUser,
  updateCurrentUser,
};
