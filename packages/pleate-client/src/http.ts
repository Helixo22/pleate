import { ApiError, type ApiErrorBody, networkError } from "./errors.ts";
import { toSearchParams } from "./list.ts";
import { parseSse, type SseEvent } from "./sse.ts";

export interface HttpOptions {
  /** Where pleate-backend is mounted. Default `/api` (same origin, e.g. a Next.js rewrite). */
  baseUrl?: string;
  /** Custom fetch (tests, server side cookies forwarding). */
  fetch?: typeof fetch;
  /** Default `include`, so the session cookie travels on cross origin setups too. */
  credentials?: RequestCredentials;
  /** Extra headers on every request, e.g. `{ Authorization: "Bearer pl_..." }`. */
  headers?: Record<string, string> | (() => Record<string, string>);
  /** Sent as Accept-Language, so backend messages come back translated. */
  locale?: string | (() => string | undefined);
  csrf?: { cookieName?: string; headerName?: string; path?: string } | false;
  /** Called on every 401, for example to redirect to the login page. */
  onUnauthorized?: (error: ApiError) => void;
}

export interface RequestOptions {
  query?: Record<string, unknown>;
  /** JSON body. */
  body?: unknown;
  /** Multipart body, takes precedence over `body`. */
  form?: FormData;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

export interface UploadOptions {
  signal?: AbortSignal;
  /** 0..1 */
  onProgress?: (progress: number) => void;
}

const UNSAFE = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export class Http {
  readonly baseUrl: string;
  private readonly options: HttpOptions;
  private csrfToken: string | undefined;
  private csrfPromise: Promise<string | undefined> | undefined;

  constructor(options: HttpOptions = {}) {
    this.options = options;
    this.baseUrl = (options.baseUrl ?? "/api").replace(/\/$/, "");
  }

  /** Absolute URL of an endpoint, for links (`href`) such as OAuth start or downloads. */
  url(path: string, query?: Record<string, unknown>): string {
    const qs = toSearchParams(query).toString();
    return `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}${qs ? `?${qs}` : ""}`;
  }

  private get fetcher(): typeof fetch {
    return this.options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  private baseHeaders(): Record<string, string> {
    const extra = typeof this.options.headers === "function" ? this.options.headers() : this.options.headers;
    const locale = typeof this.options.locale === "function" ? this.options.locale() : this.options.locale;
    return { Accept: "application/json", ...(locale ? { "Accept-Language": locale } : {}), ...extra };
  }

  private csrfConfig() {
    if (this.options.csrf === false) return null;
    return {
      cookieName: this.options.csrf?.cookieName ?? "csrftoken",
      headerName: this.options.csrf?.headerName ?? "X-CSRFToken",
      path: this.options.csrf?.path ?? "/csrf",
    };
  }

  /** Makes sure a CSRF token exists. Called automatically before unsafe requests. */
  async ensureCsrf(force = false): Promise<string | undefined> {
    const conf = this.csrfConfig();
    if (!conf) return undefined;
    if (!force) {
      const cookie = readCookie(conf.cookieName);
      if (cookie) return cookie;
      if (this.csrfToken) return this.csrfToken;
    }
    this.csrfPromise ??= this.fetcher(this.url(conf.path), {
      credentials: this.options.credentials ?? "include",
      headers: this.baseHeaders(),
    })
      .then((res) => (res.ok ? (res.json() as Promise<{ csrf_token?: string }>) : {}))
      .then((data: { csrf_token?: string }) => {
        this.csrfToken = data.csrf_token;
        return this.csrfToken;
      })
      .catch(() => undefined)
      .finally(() => {
        this.csrfPromise = undefined;
      });
    return this.csrfPromise;
  }

  private async send(method: string, path: string, opts: RequestOptions, retried = false): Promise<Response> {
    const headers: Record<string, string> = { ...this.baseHeaders(), ...opts.headers };
    let body: BodyInit | undefined;
    if (opts.form) body = opts.form;
    else if (opts.body !== undefined) {
      body = JSON.stringify(opts.body);
      headers["Content-Type"] = "application/json";
    }
    const conf = this.csrfConfig();
    if (conf && UNSAFE.has(method)) {
      const token = await this.ensureCsrf();
      if (token) headers[conf.headerName] = token;
    }
    let res: Response;
    try {
      res = await this.fetcher(this.url(path, opts.query), {
        method,
        headers,
        body,
        signal: opts.signal,
        credentials: this.options.credentials ?? "include",
      });
    } catch (error) {
      if ((error as Error)?.name === "AbortError") throw error;
      throw networkError(error);
    }
    if (res.status === 403 && conf && UNSAFE.has(method) && !retried) {
      const err = await this.toError(res.clone());
      if (err.code === "csrf_failed") {
        await this.ensureCsrf(true);
        return this.send(method, path, opts, true);
      }
    }
    return res;
  }

  private async toError(res: Response): Promise<ApiError> {
    let body: ApiErrorBody = { status: res.status, code: "http_error", message: res.statusText || "Request failed." };
    try {
      const data = (await res.json()) as { error?: ApiErrorBody };
      if (data?.error?.code) body = { ...data.error, status: res.status };
    } catch {
      // not JSON
    }
    return new ApiError(body);
  }

  private async fail(res: Response): Promise<never> {
    const error = await this.toError(res);
    if (error.status === 401) this.options.onUnauthorized?.(error);
    throw error;
  }

  async request<T>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const res = await this.send(method, path, opts);
    if (!res.ok) return this.fail(res);
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    const type = res.headers.get("Content-Type") ?? "";
    return (type.includes("json") ? JSON.parse(text) : text) as T;
  }

  get<T>(path: string, query?: Record<string, unknown>, opts: Omit<RequestOptions, "query"> = {}) {
    return this.request<T>("GET", path, { ...opts, query });
  }
  post<T>(path: string, body?: unknown, opts: RequestOptions = {}) {
    return this.request<T>("POST", path, { ...opts, body });
  }
  put<T>(path: string, body?: unknown, opts: RequestOptions = {}) {
    return this.request<T>("PUT", path, { ...opts, body });
  }
  patch<T>(path: string, body?: unknown, opts: RequestOptions = {}) {
    return this.request<T>("PATCH", path, { ...opts, body });
  }
  delete<T>(path: string, body?: unknown, opts: RequestOptions = {}) {
    return this.request<T>("DELETE", path, { ...opts, body });
  }

  /** Raw response, for downloads. */
  async raw(method: string, path: string, opts: RequestOptions = {}): Promise<Response> {
    const res = await this.send(method, path, opts);
    if (!res.ok) return this.fail(res);
    return res;
  }

  /**
   * Server-Sent Events over fetch (works with POST bodies). Throws ApiError
   * if the server answers with an error instead of a stream.
   */
  async *stream<T = unknown>(
    method: string,
    path: string,
    opts: RequestOptions = {},
  ): AsyncGenerator<SseEvent<T>> {
    const res = await this.send(method, path, {
      ...opts,
      headers: { ...opts.headers, Accept: "text/event-stream" },
    });
    if (!res.ok) await this.fail(res);
    if (!res.body) return;
    yield* parseSse<T>(res.body, opts.signal);
  }

  /**
   * Multipart upload with progress. Uses XMLHttpRequest in browsers (fetch
   * has no upload progress) and falls back to fetch elsewhere.
   */
  async upload<T>(method: string, path: string, form: FormData, opts: UploadOptions = {}): Promise<T> {
    if (typeof XMLHttpRequest === "undefined" || this.options.fetch) {
      const result = await this.request<T>(method, path, { form, signal: opts.signal });
      opts.onProgress?.(1);
      return result;
    }
    const conf = this.csrfConfig();
    const token = conf ? await this.ensureCsrf() : undefined;
    return new Promise<T>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, this.url(path));
      xhr.withCredentials = (this.options.credentials ?? "include") === "include";
      for (const [key, value] of Object.entries(this.baseHeaders())) xhr.setRequestHeader(key, value);
      if (conf && token) xhr.setRequestHeader(conf.headerName, token);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) opts.onProgress?.(Math.min(1, event.loaded / event.total));
      };
      xhr.onload = () => {
        let data: unknown;
        try {
          data = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
        } catch {
          data = undefined;
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          opts.onProgress?.(1);
          resolve(data as T);
          return;
        }
        const body = (data as { error?: ApiErrorBody } | undefined)?.error;
        const error = new ApiError(
          body?.code ? { ...body, status: xhr.status } : { status: xhr.status, code: "http_error", message: "Upload failed." },
        );
        if (error.status === 401) this.options.onUnauthorized?.(error);
        reject(error);
      };
      xhr.onerror = () => reject(networkError(new Error("upload failed")));
      xhr.onabort = () => reject(new DOMException("Aborted", "AbortError"));
      opts.signal?.addEventListener("abort", () => xhr.abort());
      xhr.send(form);
    });
  }
}
