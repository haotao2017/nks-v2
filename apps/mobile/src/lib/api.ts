/**
 * NksClient 单例 —— mobile(RN)侧配置。
 *
 * - baseUrl 来自 EXPO_PUBLIC_API_BASE_URL(默认 http://localhost:8080);client 内部自动加 /api。
 * - getToken:异步从 SecureStore 读 JWT(NksClient 支持异步 getToken)。
 * - onUnauthorized:401 时删除 SecureStore token 并把 redux 置为未登录,
 *   路由守卫据此自动跳回 /login(自动登出)。
 */
import { createNksClient, type NksClient } from '@nks/api-client';

import { deleteToken, getToken } from './secure-token';
import { store } from '../store';
import { setUnauthenticated } from '../store/auth-slice';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

let client: NksClient | null = null;

export function getApiClient(): NksClient {
  if (client) return client;
  client = createNksClient({
    baseUrl: API_BASE_URL,
    getToken,
    onUnauthorized: () => {
      // 清 token + 置未登录;守卫监听 status 后跳 /login
      void deleteToken();
      store.dispatch(setUnauthenticated());
    },
  });
  return client;
}
