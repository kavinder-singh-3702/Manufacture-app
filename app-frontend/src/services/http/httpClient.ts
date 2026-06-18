import { ApiError } from "./errors";
import { tokenStorage } from "../tokenStorage";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type QueryParams = Record<string, string | number | boolean | undefined>;

export type RequestConfig = {
  path: string;
  method?: HttpMethod;
  data?: unknown;
  params?: QueryParams;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export type HttpClientConfig = {
  baseURL: string;
  defaultHeaders?: Record<string, string>;
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

  constructor({ baseURL, defaultHeaders }: HttpClientConfig) {
    this.baseURL = baseURL.replace(/\/$/, "");
    this.defaultHeaders = defaultHeaders ?? {};
  }

  setHeader(key: string, value: string) {
    this.defaultHeaders[key] = value;
  }

  removeHeader(key: string) {
    delete this.defaultHeaders[key];
  }

  private buildUrl(path: string, params?: QueryParams) {
    const sanitizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${this.baseURL}${sanitizedPath}${serializeParams(params)}`;
  }

  async request<T>({ path, method = "GET", data, params, headers, signal }: RequestConfig): Promise<T> {
    const endpoint = this.buildUrl(path, params);
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const requestHeaders: Record<string, string> = { ...this.defaultHeaders, ...headers };
    if (isFormData) {
      delete requestHeaders["Content-Type"];
    }

    // Add Authorization header if token exists
    const token = await tokenStorage.getToken();
    if (token) {
      requestHeaders["Authorization"] = `Bearer ${token}`;
    }

    // Compose a per-request AbortController with a 30s timeout. Without this
    // a hung request (cold backend, lost TCP packet, JS bridge drop) just
    // never resolves and the caller's await sits forever — most visibly
    // observed on the AddMobileNumberScreen save flow where the user taps
    // Save, sees nothing happen, and has to force-close the app to escape.
    // We OR-merge the timeout signal with any externally-supplied signal so
    // both cancel paths still work.
    const timeoutController = new AbortController();
    const timeoutMs = 30000;
    const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);
    const externalAbortListener = () => timeoutController.abort();
    if (signal) {
      if (signal.aborted) {
        timeoutController.abort();
      } else {
        signal.addEventListener("abort", externalAbortListener, { once: true });
      }
    }

    let response: Response;
    try {
      console.log(`[HTTP] ${method} ${endpoint}`, isFormData ? "(FormData)" : "");
      response = await fetch(endpoint, {
        method,
        headers: requestHeaders,
        body: data ? (isFormData ? (data as BodyInit) : JSON.stringify(data)) : undefined,
        signal: timeoutController.signal,
        credentials: "include",
      });
      console.log(`[HTTP] Response status: ${response.status}`);
    } catch (networkError: unknown) {
      // Distinguish a real network failure from a timeout-induced abort so
      // the caller can surface the right message. fetch throws an
      // AbortError when the controller fires; we treat it as a timeout
      // rather than a generic "network failure".
      const errorMessage = networkError instanceof Error ? networkError.message : String(networkError);
      const isAbort =
        (networkError instanceof Error && networkError.name === "AbortError") ||
        timeoutController.signal.aborted;
      console.error(isAbort ? "Request timed out:" : "Network error:", errorMessage, "URL:", endpoint);
      throw new ApiError(
        isAbort
          ? "Request took too long and was cancelled. Please check your connection and try again."
          : "Network request failed. Please check your connection and try again.",
        0,
        undefined,
        {
          kind: isAbort ? "timeout" : "network",
          debug: { endpoint, method, networkError: errorMessage, timedOut: isAbort },
        }
      );
    } finally {
      // Always clear the timeout and detach the external-abort listener,
      // even on success — otherwise the timeout would still fire later
      // and trying to abort an already-completed fetch is a no-op but the
      // memory holds onto the listener.
      clearTimeout(timeoutId);
      if (signal) {
        signal.removeEventListener("abort", externalAbortListener);
      }
    }

    let parsedBody: unknown;
    try {
      parsedBody = await response.json();
    } catch (error) {
      parsedBody = undefined;
    }

    if (!response.ok) {
      const body = parsedBody as { message?: string; error?: string; code?: string };

      // Auto-retry on ACTIVE_COMPANY_REQUIRED: restore company context and retry once
      if (body?.code === "ACTIVE_COMPANY_REQUIRED" && !headers?.__retried) {
        try {
          const { companyService } = await import("../company.service");
          const { userService } = await import("../user.service");
          const { user } = await userService.getCurrentUser();
          if (Array.isArray(user.companies) && user.companies.length > 0) {
            await companyService.switchActive(user.companies[0]);
            // Retry the original request once
            return this.request<T>({
              path,
              method,
              data,
              params,
              headers: { ...headers, __retried: "1" },
              signal,
            });
          }
        } catch (retryErr) {
          console.warn("Auto-retry after ACTIVE_COMPANY_REQUIRED failed:", retryErr);
        }
      }

      // express-validator returns 422 with `{ errors: [{ msg, param, location, ... }] }`.
      // Fall back to that shape so users see the actual field-level reason
      // (e.g. "Date of birth must be in YYYY-MM-DD format") instead of a generic
      // "Request failed".
      const validatorErrors = (parsedBody as { errors?: Array<{ msg?: string; param?: string }> })?.errors;
      const firstValidatorMessage = Array.isArray(validatorErrors) && validatorErrors.length > 0
        ? validatorErrors
            .map((entry) => (entry?.msg ? `${entry.msg}` : null))
            .filter(Boolean)
            .join(" · ")
        : null;

      const errorMessage =
        body?.message ||
        body?.error ||
        firstValidatorMessage ||
        "Request failed";
      throw new ApiError(errorMessage, response.status, parsedBody, { kind: "http" });
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
