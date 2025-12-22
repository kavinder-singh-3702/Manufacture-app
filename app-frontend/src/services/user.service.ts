import { apiClient } from "./apiClient";
import { AuthUser, UpdateUserPayload } from "../types/auth";
import { UploadedFile } from "../types/uploads";

type UserResponse = {
  user: AuthUser;
};

const getCurrentUser = () => apiClient.get<UserResponse>("/users/me");

const updateCurrentUser = (payload: UpdateUserPayload) =>
  apiClient.patch<UserResponse>("/users/me", payload);

const uploadUserFile = async (payload: { fileName: string; mimeType?: string; uri: string; purpose?: string }) => {
  const response = await fetch(payload.uri);
  const blob = await response.blob();

  const form = new FormData();
  form.append("file", blob, payload.fileName);
  if (payload.purpose) {
    form.append("purpose", payload.purpose);
  }

  return apiClient.post<{ file: UploadedFile }>("/users/me/uploads", form);
};

export const userService = {
  getCurrentUser,
  updateCurrentUser,
  uploadUserFile,
};
