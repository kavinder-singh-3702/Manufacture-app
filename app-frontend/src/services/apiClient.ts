type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  path: string;
  method?: HttpMethod;
  data?: unknown;
};

const DEFAULT_API_URL = "http://localhost:4000/api";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL;

// Lightweight wrapper that centralizes headers, telemetry hooks, etc.
export const apiClient = async <T>({ path, method = "GET", data }: RequestOptions): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined,
  });

  let parsedBody: unknown;
  try {
    parsedBody = await response.json();
  } catch (error) {
    parsedBody = null;
  }

  if (!response.ok) {
    const message = (parsedBody as { message?: string })?.message || "Request failed";
    throw new Error(message);
  }

  return parsedBody as T;
};
