/**
 * Centralized API configuration.
 * Adjust base URLs and shared HTTP settings here to keep API usage consistent.
 */
const FALLBACK_BASE_URL = "http://localhost:4000/api";

const normalizeUrl = (url: string) => url?.replace(/\/+$/, "") || "";

// Use environment variable if available, otherwise fallback to localhost
export const API_BASE_URL = normalizeUrl(
  process.env.EXPO_PUBLIC_API_URL || FALLBACK_BASE_URL
);

export const DEFAULT_API_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  defaultHeaders: DEFAULT_API_HEADERS,
};
