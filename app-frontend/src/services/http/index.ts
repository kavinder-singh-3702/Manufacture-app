import Constants from "expo-constants";
import { HttpClient } from "./httpClient";

type ExpoHostManifest = {
  hostUri?: string;
  debuggerHost?: string;
};

const inferDeviceHost = () => {
  const manifest = Constants.manifest as (typeof Constants.manifest & ExpoHostManifest) | null;
  const hostUri = Constants.expoConfig?.hostUri ?? manifest?.hostUri ?? manifest?.debuggerHost;
  if (!hostUri) {
    return null;
  }
  const [host] = hostUri.split(":");
  return host;
};

const buildDefaultApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  const host = inferDeviceHost();
  if (host) {
    return `http://${host}:4000/api`;
  }
  return "http://localhost:4000/api";
};

const API_BASE_URL = buildDefaultApiUrl();

export const httpClient = new HttpClient({
  baseURL: API_BASE_URL,
  defaultHeaders: {
    "Content-Type": "application/json",
  },
});

export type { HttpClient, HttpMethod, RequestConfig } from "./httpClient";
export { ApiError } from "./errors";
