import * as FileSystem from "expo-file-system/legacy";
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
  // Backend expects JSON { fileName, mimeType, content (base64), purpose }
  // via express-validator's `body('content').isString().notEmpty()`. The
  // previous FormData/blob path silently dropped `content`, so the
  // validator failed with "Base64 content is required" the moment a
  // user tried to upload a company logo (or avatar). Read the local
  // file as base64 and send it inline.
  const content = await FileSystem.readAsStringAsync(payload.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return apiClient.post<{ file: UploadedFile }>("/users/me/uploads", {
    fileName: payload.fileName,
    mimeType: payload.mimeType,
    content,
    purpose: payload.purpose,
  });
};

export const userService = {
  getCurrentUser,
  updateCurrentUser,
  uploadUserFile,
};
