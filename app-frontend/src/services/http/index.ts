import { HttpClient } from "./httpClient";

// Respect Expo env var when present; default to local in dev and deployed API in production builds.
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__ ? "http://localhost:4000/api" : "http://3.108.52.140/api");

export const httpClient = new HttpClient({
  baseURL: API_BASE_URL,
  defaultHeaders: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

export type { HttpClient, HttpMethod, RequestConfig } from "./httpClient";
export { ApiError } from "./errors";
