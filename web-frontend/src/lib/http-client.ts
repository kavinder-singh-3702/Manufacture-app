import { ApiError } from "./api-error";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryParams = Record<string, string | number | boolean | undefined>;

export type RequestConfig = {
  path: string;
  method?: HttpMethod;
  data?: unknown;
  params?: QueryParams;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  /** Overrides the client default for this request (e.g. long file uploads). */
  timeoutMs?: number;
};

export type HttpClientConfig = {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
  /** Per-request timeout in ms (default 30s). Use 0 to disable. */
  timeoutMs?: number;
};

// Global hook invoked whenever any request returns 401, so the app can react to
// session expiry (clear user, redirect to sign-in) from a single place instead
// of each component handling it. Registered by AuthProvider on mount.
let unauthorizedHandler: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  unauthorizedHandler = handler;
};

// Combines an optional caller signal with a timeout signal so a hung request
// can't leave the UI spinning forever.
const buildSignal = (timeoutMs: number, signal?: AbortSignal): AbortSignal | undefined => {
  const timeoutSignal = timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined;
  if (timeoutSignal && signal) return AbortSignal.any([signal, timeoutSignal]);
  return signal ?? timeoutSignal;
};

const serializeParams = (params?: QueryParams) => {
  if (!params) return "";
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    searchParams.append(key, String(value));
  });
  const serialized = searchParams.toString();
  return serialized ? `?${serialized}` : "";
};

export class HttpClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;
  private timeoutMs: number;

  constructor({ baseURL, defaultHeaders, timeoutMs }: HttpClientConfig) {
    this.baseURL = baseURL.replace(/\/$/, "");
    this.defaultHeaders = defaultHeaders ?? {};
    this.timeoutMs = timeoutMs ?? 30_000;
  }

  private buildUrl(path: string, params?: QueryParams) {
    const sanitizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseURL}${sanitizedPath}${serializeParams(params)}`;
  }

  async request<T>({ path, method = "GET", data, params, headers, signal, timeoutMs }: RequestConfig): Promise<T> {
    const endpoint = this.buildUrl(path, params);
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    // FormData bodies (file uploads) must be sent raw so the browser sets the
    // multipart boundary itself — forcing application/json would corrupt them.
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    if (isFormData) delete requestHeaders["Content-Type"];

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method,
        headers: requestHeaders,
        credentials: "include",
        body: isFormData ? (data as FormData) : data ? JSON.stringify(data) : undefined,
        signal: buildSignal(timeoutMs ?? this.timeoutMs, signal),
      });
    } catch (error) {
      // Caller-initiated aborts propagate untouched so callers can ignore them.
      if (error instanceof DOMException && error.name === "AbortError" && signal?.aborted) {
        throw error;
      }
      // Timeouts (TimeoutError) and network failures (TypeError) become friendly ApiErrors.
      const message =
        error instanceof DOMException && error.name === "TimeoutError"
          ? "The request timed out. Please check your connection and try again."
          : "Unable to reach the server. Please check your connection and try again.";
      throw new ApiError(message, 0, error);
    }

    let parsedBody: unknown;
    try {
      parsedBody = await response.json();
    } catch {
      parsedBody = undefined;
    }

    if (!response.ok) {
      if (response.status === 401) {
        unauthorizedHandler?.();
      }
      // Most backend errors use { message }, but a handful of older
      // controller sites still respond with { error } directly instead of
      // going through the shared errorHandler — fall back to that before
      // giving up and showing the generic "Request failed".
      const body = parsedBody as { message?: string; error?: string; errors?: Array<{ path?: string; param?: string; msg?: string }> } | undefined;

      // express-validator's `validate` middleware (backend/src/middleware/validate.js)
      // returns 422 with ONLY `{ errors: [...] }` — no `message`/`error` key —
      // so without this, every validation failure surfaced as the useless
      // generic "Request failed" string with no indication of which field or
      // why. Parse the array into a field->message map and use the first
      // message as the headline error so callers get a real reason even if
      // they don't read `fieldErrors`.
      let fieldErrors: Record<string, string> | undefined;
      if (Array.isArray(body?.errors) && body.errors.length > 0) {
        fieldErrors = {};
        for (const e of body.errors) {
          const key = e.path ?? e.param;
          if (key && e.msg) fieldErrors[key] = e.msg;
        }
      }

      const errorMessage = body?.message ?? body?.error ?? body?.errors?.[0]?.msg ?? "Request failed";
      throw new ApiError(errorMessage, response.status, parsedBody, fieldErrors);
    }

    return parsedBody as T;
  }

  get<T>(path: string, config?: Omit<RequestConfig, "path" | "method" | "data">) {
    return this.request<T>({ path, method: "GET", ...config });
  }

  post<T>(path: string, data?: unknown, config?: Omit<RequestConfig, "path" | "method" | "data">) {
    return this.request<T>({ path, method: "POST", data, ...config });
  }

  put<T>(path: string, data?: unknown, config?: Omit<RequestConfig, "path" | "method" | "data">) {
    return this.request<T>({ path, method: "PUT", data, ...config });
  }

  patch<T>(path: string, data?: unknown, config?: Omit<RequestConfig, "path" | "method" | "data">) {
    return this.request<T>({ path, method: "PATCH", data, ...config });
  }

  delete<T>(path: string, config?: Omit<RequestConfig, "path" | "method" | "data">) {
    return this.request<T>({ path, method: "DELETE", ...config });
  }
}

const resolveApiBaseUrl = () => {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!configuredBaseUrl) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is required for web-frontend API requests. Set it in your environment before loading the app."
    );
  }

  return configuredBaseUrl.replace(/\/+$/, "");
};

const API_BASE_URL = resolveApiBaseUrl();

export const httpClient = new HttpClient({
  baseURL: API_BASE_URL,
  defaultHeaders: {
    "Content-Type": "application/json",
  },
});
