import { apiClient } from "./apiClient";
import { AuthUser } from "../types/auth";

type UserResponse = {
  user: AuthUser;
};

const getCurrentUser = () => apiClient.get<UserResponse>("/users/me");

export const userService = {
  getCurrentUser,
};
