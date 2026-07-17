/**
 * JWT 安全存储 —— 用 expo-secure-store(iOS Keychain / Android Keystore),比
 * AsyncStorage 更安全,故 token 单独存这里,不进 redux-persist(避免明文落 AsyncStorage)。
 *
 * 全部异步:NksClient.getToken 支持返回 Promise,直接注入本模块的 getToken。
 */
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'nks_token';

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function deleteToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // ignore
  }
}
