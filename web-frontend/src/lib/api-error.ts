export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

// True when an error is a caller-initiated AbortController cancellation, which
// callers should ignore rather than surface as a failure.
export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";
