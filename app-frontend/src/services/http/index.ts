import { HttpClient } from "./httpClient";
import { API_CONFIG } from "../../config/api";

export const httpClient = new HttpClient({
  baseURL: API_CONFIG.baseURL,
  defaultHeaders: API_CONFIG.defaultHeaders,
});

export type { HttpClient, HttpMethod, RequestConfig } from "./httpClient";
export { ApiError } from "./errors";
