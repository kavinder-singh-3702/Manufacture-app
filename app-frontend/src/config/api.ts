/**
 * Centralized API configuration.
 * Adjust base URLs and shared HTTP settings here to keep API usage consistent.
 */

const rawApiBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const appVariant = process.env.APP_VARIANT?.trim().toLowerCase() ?? "dev";

if (!rawApiBaseUrl) {
  throw new Error(
    "Missing EXPO_PUBLIC_API_URL. Set it in .env for local runs or in the matching EAS build profile.",
  );
}

if (appVariant === "prod" && !rawApiBaseUrl.startsWith("https://")) {
  throw new Error(
    `Production builds require an HTTPS EXPO_PUBLIC_API_URL. Received: ${rawApiBaseUrl}`,
  );
}

export const API_BASE_URL = rawApiBaseUrl.replace(/\/$/, "");

export const DEFAULT_API_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  defaultHeaders: DEFAULT_API_HEADERS,
};
