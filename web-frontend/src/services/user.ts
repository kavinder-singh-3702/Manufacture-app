import { httpClient } from "../lib/http-client";
import { AuthUser, UpdateUserPayload } from "../types/auth";
import { UploadedFile } from "../types/uploads";

export type UserResponse = { user: AuthUser };

const getCurrentUser = () => httpClient.get<UserResponse>("/users/me");

const updateCurrentUser = (payload: UpdateUserPayload) =>
  httpClient.patch<UserResponse>("/users/me", payload);

const uploadUserFile = (payload: { fileName: string; mimeType?: string; content: string; purpose?: string }) =>
  httpClient.post<{ file: UploadedFile }>("/users/me/uploads", payload);

export const userService = {
  getCurrentUser,
  updateCurrentUser,
  uploadUserFile,
};
