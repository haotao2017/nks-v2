'use client';

/**
 * useAuth —— admin 认证入口。
 *
 * - login:调 POST /users/Authenticate,成功后存 token + 用户信息 cookie,跳 /。
 * - logout:清 cookie,跳 /login。
 * - user:当前登录用户(来自 cookie 摘要)。
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { LoginRequestDto, LoginResponseDto } from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import {
  clearAuth,
  getServerUserSnapshot,
  getUserSnapshot,
  setStoredUser,
  setToken,
  subscribeUser,
  type StoredUser,
} from '@/lib/auth-storage';

export interface LoginInput {
  userName: string;
  password: string;
}

export function useAuth() {
  const router = useRouter();
  const user = React.useSyncExternalStore(
    subscribeUser,
    getUserSnapshot,
    getServerUserSnapshot,
  );
  const [isPending, setIsPending] = React.useState(false);

  const login = React.useCallback(
    async ({ userName, password }: LoginInput) => {
      setIsPending(true);
      try {
        const body: LoginRequestDto = {
          UserName: userName,
          Password: password,
          IsMobileApp: false,
        };
        const res = await getApiClient().post<LoginResponseDto>(
          endpoints.auth.authenticate.path,
          body,
        );

        if (!res?.token) {
          throw new Error('登录响应缺少 token');
        }

        const stored: StoredUser = {
          id: res.id,
          fullName: res.fullName,
          userName: res.userName,
          isAdmin: res.isAdmin,
          companyID: res.companyID,
        };
        setToken(res.token);
        setStoredUser(stored); // 触发 store 通知 → useSyncExternalStore 更新 user
        router.replace('/');
        router.refresh();
        return res;
      } finally {
        setIsPending(false);
      }
    },
    [router],
  );

  const logout = React.useCallback(() => {
    clearAuth(); // 触发 store 通知 → user 变为 null
    router.replace('/login');
    router.refresh();
  }, [router]);

  return { user, login, logout, isPending };
}
