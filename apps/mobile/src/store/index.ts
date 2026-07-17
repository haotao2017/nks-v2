/**
 * Redux store —— 离线优先本地状态。
 *
 * - Redux Toolkit + react-redux。
 * - redux-persist + AsyncStorage 做持久化(离线可用、冷启动即时渲染上次用户)。
 * - auth 只持久化 `user`(白名单),不持久化 `status`:每次冷启动都从 'bootstrapping'
 *   开始,由根布局用 SecureStore token + GetUserProfile 续登校验后再切到
 *   authenticated/unauthenticated,避免"看似已登录但 token 已失效"。
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers, configureStore } from '@reduxjs/toolkit';
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';

import authReducer from './auth-slice';
import activeProjectReducer from './active-project-slice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  whitelist: ['user'],
};

// activeProject:持久化「当前打开项目」的本地可编辑副本(离线可用、冷启动即时渲染)。
// 只落 projectId + detail(含各同步标志);status/error 为瞬态不持久化。
const activeProjectPersistConfig = {
  key: 'activeProject',
  storage: AsyncStorage,
  whitelist: ['projectId', 'detail'],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  activeProject: persistReducer(activeProjectPersistConfig, activeProjectReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist 会派发这些非序列化 action,忽略即可
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
