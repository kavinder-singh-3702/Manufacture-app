import { apiClient } from "./apiClient";
import { AuthUser, UpdateUserPayload } from "../types/auth";
import { UploadedFile } from "../types/uploads";

type UserResponse = {
  user: AuthUser;
};

const getCurrentUser = () => apiClient.get<UserResponse>("/users/me");

const updateCurrentUser = (payload: UpdateUserPayload) =>
  apiClient.patch<UserResponse>("/users/me", payload);

const uploadUserFile = (payload: { fileName: string; mimeType?: string; uri: string; purpose?: string }) => {
  const form = new FormData();
  form.append("file", {
    uri: payload.uri,
    name: payload.fileName,
    type: payload.mimeType ?? "application/octet-stream",
  } as any);
  if (payload.purpose) {
    form.append("purpose", payload.purpose);
  }
  return apiClient.post<{ file: UploadedFile }>("/users/me/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const userService = {
  getCurrentUser,
  updateCurrentUser,
  uploadUserFile,
};
