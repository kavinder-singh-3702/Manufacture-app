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

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method,
        headers: requestHeaders,
        body: data ? (isFormData ? (data as BodyInit) : JSON.stringify(data)) : undefined,
        signal,
        credentials: "include",
      });
    } catch (networkError: unknown) {
      // Network error - couldn't connect at all
      const errorMessage = networkError instanceof Error ? networkError.message : String(networkError);
      console.error("Network error:", errorMessage, "URL:", endpoint);
      throw new ApiError(`${errorMessage} - URL: ${endpoint}`, 0, { networkError: errorMessage });
    }

    let parsedBody: unknown;
    try {
      parsedBody = await response.json();
    } catch (error) {
      parsedBody = undefined;
    }

    if (!response.ok) {
      const body = parsedBody as { message?: string; error?: string };
      const errorMessage = body?.message || body?.error || "Request failed";
      throw new ApiError(errorMessage, response.status, parsedBody);
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
