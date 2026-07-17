/**
 * 登录态守卫(受保护区)。
 *  - bootstrapping:显示 loading。
 *  - unauthenticated:跳 /login。
 *  - authenticated:渲染子路由(headerShown 交给各屏/嵌套 Tabs 自行处理)。
 */
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAppSelector } from '@/store/hooks';

export default function AppLayout() {
  const status = useAppSelector((s) => s.auth.status);

  if (status === 'bootstrapping') {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
