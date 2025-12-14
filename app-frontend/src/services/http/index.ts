import { HttpClient } from "./httpClient";

// IMPORTANT: Change this URL based on your environment
// For APK build: use "http://3.108.52.140/api"
// For local dev: use "http://192.168.0.198:4000/api"
const API_BASE_URL = "http://192.168.0.198:4000/api";

export const httpClient = new HttpClient({
  baseURL: API_BASE_URL,
  defaultHeaders: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

export type { HttpClient, HttpMethod, RequestConfig } from "./httpClient";
export { ApiError } from "./errors";
