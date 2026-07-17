/**
 * NksClient 单例 —— admin(web)侧配置。
 *
 * - baseUrl 来自 NEXT_PUBLIC_API_BASE_URL(默认 http://localhost:8080);client 内部自动加 /api。
 * - getToken:从 cookie 读 JWT。
 * - onUnauthorized:401 时清 cookie 并跳 /login(整页跳转,绕开 App Router 客户端状态)。
 */
import { createNksClient, type NksClient } from '@nks/api-client';
import { clearAuth, getToken } from './auth-storage';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

let client: NksClient | null = null;

export function getApiClient(): NksClient {
  if (client) return client;
  client = createNksClient({
    baseUrl: API_BASE_URL,
    getToken,
    onUnauthorized: () => {
      clearAuth();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    },
  });
  return client;
}
