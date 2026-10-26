/** A field error as returned by pleate-backend. */
export interface FieldError {
  code: string;
  message: string;
}

/** The body of every error response: `{ "error": { ... } }`. */
export interface ApiErrorBody {
  status: number;
  code: string;
  message: string;
  fields?: Record<string, FieldError[]>;
  retry_after?: number;
  [extra: string]: unknown;
}

/**
 * Thrown by every client call that gets a non 2xx answer. `code` is stable
 * and safe to switch on or translate; `message` is already localized by the
 * backend (Accept-Language / locale cookie).
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, FieldError[]>;
  readonly body: ApiErrorBody;

  constructor(body: ApiErrorBody) {
    super(body.message);
    this.name = "ApiError";
    this.status = body.status;
    this.code = body.code;
    this.fields = body.fields ?? {};
    this.body = body;
  }

  /** First message per field, the shape pleate forms take as `fieldErrors`. */
  fieldErrors(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [field, errors] of Object.entries(this.fields)) {
      if (errors[0]) out[field] = errors[0].message;
    }
    return out;
  }

  /** Seconds to wait when rate limited (429). */
  get retryAfter(): number | undefined {
    return typeof this.body.retry_after === "number" ? this.body.retry_after : undefined;
  }
}

export function isApiError(error: unknown, code?: string): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code);
}

export function networkError(cause: unknown): ApiError {
  const err = new ApiError({ status: 0, code: "network_error", message: "Could not reach the server." });
  (err as { cause?: unknown }).cause = cause;
  return err;
}
