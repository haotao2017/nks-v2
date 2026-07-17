import '../global.css';

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Providers } from '@/providers';
import { useAuthBootstrap } from '@/features/auth/use-bootstrap';

function RootNavigator() {
  // 冷启动续登校验(须在 Providers 之内,能访问 store)
  useAuthBootstrap();
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <Providers>
      <RootNavigator />
    </Providers>
  );
}
