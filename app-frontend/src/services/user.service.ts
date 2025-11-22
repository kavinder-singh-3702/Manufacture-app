import { apiClient } from "./apiClient";
import { AuthUser, UpdateUserPayload } from "../types/auth";
import { UploadedFile } from "../types/uploads";

type UserResponse = {
  user: AuthUser;
};

const getCurrentUser = () => apiClient.get<UserResponse>("/users/me");

const updateCurrentUser = (payload: UpdateUserPayload) =>
  apiClient.patch<UserResponse>("/users/me", payload);

const uploadUserFile = (payload: { fileName: string; mimeType?: string; content: string; purpose?: string }) =>
  apiClient.post<{ file: UploadedFile }>("/users/me/uploads", payload);

export const userService = {
  getCurrentUser,
  updateCurrentUser,
  uploadUserFile,
};
