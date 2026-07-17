/**
 * 启动续登校验。
 *
 * 冷启动流程(PersistGate 已回灌 user 后执行):
 *  1. 读 SecureStore token。
 *  2. 无 token → 未登录。
 *  3. 有 token 但无持久化 user.id → 无法续登校验,清 token → 未登录。
 *  4. 有 token 且有 user.id → GetUserProfile 校验;成功刷新 user → 已登录,
 *     失败(含 401)清 token → 未登录。
 */
import * as React from 'react';

import { getToken, deleteToken } from '@/lib/secure-token';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setAuthenticated, setUnauthenticated } from '@/store/auth-slice';

import { fetchUserProfile } from './api';

export function useAuthBootstrap() {
  const dispatch = useAppDispatch();
  const persistedUser = useAppSelector((s) => s.auth.user);
  const ran = React.useRef(false);

  React.useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      const token = await getToken();
      if (!token) {
        dispatch(setUnauthenticated());
        return;
      }
      const userId = persistedUser?.id;
      if (typeof userId !== 'number') {
        await deleteToken();
        dispatch(setUnauthenticated());
        return;
      }
      try {
        const user = await fetchUserProfile(userId);
        dispatch(setAuthenticated(user));
      } catch {
        // 401 时 api-client 已清 token;这里兜底再清一次并置未登录
        await deleteToken();
        dispatch(setUnauthenticated());
      }
    })();
    // 仅在挂载时跑一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
