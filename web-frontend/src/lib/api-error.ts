export class ApiError extends Error {
  status: number;
  data: unknown;
  /**
   * Per-field messages parsed from an express-validator 422 body
   * (`{ errors: [{ path, msg }] }`). Populated by http-client so forms can
   * highlight the actual invalid field instead of only showing a toast.
   * Undefined for non-validation errors.
   */
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, data?: unknown, fieldErrors?: Record<string, string>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.fieldErrors = fieldErrors;
  }
}

// True when an error is a caller-initiated AbortController cancellation, which
// callers should ignore rather than surface as a failure.
export const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";
