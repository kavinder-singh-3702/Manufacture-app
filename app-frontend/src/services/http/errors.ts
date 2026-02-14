export type ApiErrorKind = "network" | "http" | "unknown";

type ApiErrorOptions = {
  kind?: ApiErrorKind;
  debug?: Record<string, unknown>;
};

export class ApiError<T = unknown> extends Error {
  status: number;
  data?: T;
  kind: ApiErrorKind;
  debug?: Record<string, unknown>;

  constructor(message: string, status: number, data?: T, options?: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.kind = options?.kind ?? "unknown";
    this.debug = options?.debug;
  }
}
