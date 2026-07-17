/**
 * 入口重定向:按认证态分流。bootstrapping 时显示 loading。
 */
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAppSelector } from '@/store/hooks';

export default function Index() {
  const status = useAppSelector((s) => s.auth.status);

  if (status === 'bootstrapping') {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator />
      </View>
    );
  }

  if (status === 'authenticated') {
    return <Redirect href="/(app)/projects" />;
  }
  return <Redirect href="/login" />;
}
