/**
 * 认证态存取 —— JWT 存 cookie(SameSite=Lax,非 httpOnly,client 直读)。
 *
 * 说明:无 BFF,浏览器直连 Spring Boot 后端,client 需读 token 拼 Authorization 头,
 * 且 Next middleware 需读同一 cookie 做路由守卫,故用可读 cookie 而非 httpOnly。
 * 用户信息(LoginResponseDto 摘要)另存一个 cookie,供刷新后即时渲染,避免闪烁。
 */
import Cookies from 'js-cookie';
import type { LoginResponseDto } from '@nks/api-types';

export const TOKEN_COOKIE = 'nks_token';
export const USER_COOKIE = 'nks_user';

/** 存活用户信息(登录响应的可序列化摘要)。 */
export type StoredUser = Pick<
  LoginResponseDto,
  'id' | 'fullName' | 'userName' | 'isAdmin' | 'companyID'
>;

const COOKIE_OPTS: Cookies.CookieAttributes = {
  sameSite: 'lax',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  expires: 7,
  path: '/',
};

export function getToken(): string | null {
  return Cookies.get(TOKEN_COOKIE) ?? null;
}

export function setToken(token: string): void {
  Cookies.set(TOKEN_COOKIE, token, COOKIE_OPTS);
}

/* --------------------------------------------------------------------------
 * 用户信息作为「外部 store」暴露,供 useSyncExternalStore 消费。
 * getUserSnapshot 需返回稳定引用(仅当底层 cookie 字符串变化时才重算),
 * 否则 useSyncExternalStore 会因 Object.is 不等而无限重渲染。
 * ------------------------------------------------------------------------ */
let cachedRaw: string | undefined;
let cachedUser: StoredUser | null = null;
const listeners = new Set<() => void>();

function computeUser(): StoredUser | null {
  const raw = Cookies.get(USER_COOKIE);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    if (!raw) {
      cachedUser = null;
    } else {
      try {
        cachedUser = JSON.parse(raw) as StoredUser;
      } catch {
        cachedUser = null;
      }
    }
  }
  return cachedUser;
}

function emit(): void {
  for (const listener of listeners) listener();
}

/** 订阅用户信息变化(useSyncExternalStore 用)。 */
export function subscribeUser(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** 客户端快照:从 cookie 读取,引用稳定。 */
export function getUserSnapshot(): StoredUser | null {
  return computeUser();
}

/** 服务端快照:SSR 时无 cookie 访问,返回 null(hydration 后由客户端快照接管)。 */
export function getServerUserSnapshot(): StoredUser | null {
  return null;
}

export function getStoredUser(): StoredUser | null {
  return computeUser();
}

export function setStoredUser(user: StoredUser): void {
  Cookies.set(USER_COOKIE, JSON.stringify(user), COOKIE_OPTS);
  emit();
}

export function clearAuth(): void {
  Cookies.remove(TOKEN_COOKIE, { path: '/' });
  Cookies.remove(USER_COOKIE, { path: '/' });
  emit();
}
