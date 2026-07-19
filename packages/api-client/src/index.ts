/**
 * @nks/api-client — 框架无关的 NKS 后端传输层。
 *
 * 契约要点(对齐 Spring Boot 后端):
 *  - 所有业务路径在 baseUrl 之后加 `/api` 前缀(与旧前端 axios 拦截器一致)。
 *  - 认证:登录成功后携带 `Authorization: Bearer <token>`。
 *  - 后端 query 参数为 PascalCase(如 `ProjectID`)、部分请求体包装键为 PascalCase(如 `Contact`)。
 *    这些由调用方/端点目录决定,本传输层原样透传 params/body。
 *  - 401 触发 onUnauthorized(用于自动登出)。
 *  - 错误响应对齐后端 ApiError / RequestResponse。
 *
 * admin(web)与 mobile(RN)共用同一实例,差异仅在 token 存取(getToken)与 baseUrl。
 */

export interface NksClientOptions {
  /** 后端根地址,不含 `/api`,例如 https://api.nksystem.no */
  baseUrl: string;
  /** 返回当前 JWT(无则返回 null/undefined)。同步或异步均可。 */
  getToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /** 收到 401 时回调(通常用于清 token + 跳登录)。 */
  onUnauthorized?: () => void;
  /** 默认请求超时(ms)。 */
  timeoutMs?: number;
  /** 自定义 fetch(RN/测试注入用);默认全局 fetch。 */
  fetchImpl?: typeof fetch;
}

/** 后端 ApiError(GlobalExceptionHandler)形状。 */
export interface ApiErrorBody {
  status?: number;
  message?: string;
  timestamp?: string;
  path?: string;
  errors?: Record<string, unknown> | string[] | null;
}

export class NksApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | string | null;
  constructor(status: number, message: string, body: ApiErrorBody | string | null) {
    super(message);
    this.name = 'NksApiError';
    this.status = status;
    this.body = body;
  }
}

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  /** PascalCase query 参数,原样拼接。 */
  params?: QueryParams;
  signal?: AbortSignal;
  /** 覆盖默认超时。 */
  timeoutMs?: number;
}

function buildQuery(params?: QueryParams): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined) usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export class NksClient {
  private readonly baseUrl: string;
  private readonly getToken: NonNullable<NksClientOptions['getToken']>;
  private readonly onUnauthorized?: () => void;
  private readonly timeoutMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: NksClientOptions) {
    // 归一化:去掉末尾斜杠,统一加 /api 前缀
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '') + '/api';
    this.getToken = opts.getToken ?? (() => null);
    this.onUnauthorized = opts.onUnauthorized;
    this.timeoutMs = opts.timeoutMs ?? 30000;
    // 必须绑定到 globalThis:直接把 globalThis.fetch 存成实例方法再调用,
    // 浏览器会因 this 不是 Window 抛 "Illegal invocation / Can only call Window.fetch on instances of Window"。
    this.fetchImpl = opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
  }

  get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, undefined, opts);
  }

  post<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, body, opts);
  }

  put<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, body, opts);
  }

  delete<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, undefined, opts);
  }

  /** multipart/form-data 上传(后端 multipart 端点:字段名如 request/file/files)。 */
  postForm<T>(path: string, form: FormData, opts?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, form, opts, true);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    opts?: RequestOptions,
    isForm = false,
  ): Promise<T> {
    const url = this.baseUrl + (path.startsWith('/') ? path : `/${path}`) + buildQuery(opts?.params);

    const headers: Record<string, string> = {};
    const token = await this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    let payload: BodyInit | undefined;
    if (isForm) {
      payload = body as FormData; // 不设 Content-Type,交给运行时带 boundary
    } else if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      payload = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), opts?.timeoutMs ?? this.timeoutMs);
    if (opts?.signal) {
      opts.signal.addEventListener('abort', () => controller.abort(), { once: true });
    }

    let res: Response;
    try {
      res = await this.fetchImpl(url, {
        method,
        headers,
        body: payload,
        signal: controller.signal,
        // Mutating GETs (e.g. ArchiveProject) and list GETs must never be browser-cached,
        // or invalidateQueries can refetch stale snapshots for minutes.
        cache: 'no-store',
      });
    } finally {
      clearTimeout(timeout);
    }

    if (res.status === 401) {
      this.onUnauthorized?.();
      throw new NksApiError(401, 'Unauthorized. Please sign in again.', await safeBody(res));
    }

    if (!res.ok) {
      const errBody = await safeBody(res);
      const msg =
        (typeof errBody === 'object' && errBody && 'message' in errBody && (errBody as ApiErrorBody).message) ||
        `Request failed (${res.status})`;
      throw new NksApiError(res.status, String(msg), errBody);
    }

    // 204 或空响应
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }
}

async function safeBody(res: Response): Promise<ApiErrorBody | string | null> {
  try {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text) as ApiErrorBody;
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

export function createNksClient(opts: NksClientOptions): NksClient {
  return new NksClient(opts);
}
