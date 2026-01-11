/**
 * Centralized API configuration.
 * Adjust base URLs and shared HTTP settings here to keep API usage consistent.
 */

// Use environment variable for API URL
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://3.108.52.140/api";

export const DEFAULT_API_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  defaultHeaders: DEFAULT_API_HEADERS,
};
