/**
 * 认证 slice —— 保存已登录用户摘要(会被 redux-persist 落 AsyncStorage,便于离线/续登)。
 *
 * 注意:token 不放这里(在 SecureStore)。这里只存足以渲染 + 续登所需的用户信息。
 * status:
 *  - 'bootstrapping' 启动中(尚未确定登录态,守卫应显示 loading)
 *  - 'authenticated' 已登录
 *  - 'unauthenticated' 未登录
 */
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LoginResponseDto } from '@nks/api-types';

/** 持久化的用户摘要(登录响应 / GetUserProfile 的可序列化子集)。 */
export type StoredUser = Pick<
  LoginResponseDto,
  'id' | 'fullName' | 'userName' | 'isAdmin' | 'companyID'
>;

export type AuthStatus = 'bootstrapping' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: StoredUser | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  status: 'bootstrapping',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** 登录成功(或续登成功)后写入用户摘要。 */
    setAuthenticated(state, action: PayloadAction<StoredUser>) {
      state.user = action.payload;
      state.status = 'authenticated';
    },
    /** 明确未登录(登出 / 续登失败 / 无 token)。 */
    setUnauthenticated(state) {
      state.user = null;
      state.status = 'unauthenticated';
    },
    /** 标记启动校验开始(登出后再启动时也会回到 bootstrapping)。 */
    setBootstrapping(state) {
      state.status = 'bootstrapping';
    },
  },
});

export const { setAuthenticated, setUnauthenticated, setBootstrapping } =
  authSlice.actions;

export default authSlice.reducer;
