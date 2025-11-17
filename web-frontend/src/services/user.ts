import { httpClient } from "../lib/http-client";
import { AuthUser, UpdateUserPayload } from "../types/auth";

export type UserResponse = { user: AuthUser };

const getCurrentUser = () => httpClient.get<UserResponse>("/users/me");

const updateCurrentUser = (payload: UpdateUserPayload) =>
  httpClient.patch<UserResponse>("/users/me", payload);

export const userService = {
  getCurrentUser,
  updateCurrentUser,
};
