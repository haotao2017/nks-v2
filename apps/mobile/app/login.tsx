/**
 * 登录页(挪威语,NBK 风格)。
 * 成功后写 token(SecureStore)+ dispatch 已登录,路由跳项目列表。
 */
import * as React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ErrorText, Field } from '@/components/ui';
import { getErrorMessage } from '@/lib/query';
import { login } from '@/features/auth/api';
import { setAuthenticated } from '@/store/auth-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

export default function LoginScreen() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((s) => s.auth.status);

  const [userName, setUserName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  // 已登录则不停留在登录页
  if (status === 'authenticated') {
    return <Redirect href="/(app)/projects" />;
  }

  const onSubmit = async () => {
    if (!userName || !password) {
      setError('Fyll inn brukernavn og passord.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await login({ userName, password });
      dispatch(setAuthenticated(user));
      // 认证态切换后由 index/守卫接管跳转
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          keyboardShouldPersistTaps="handled"
        >
          <View className="mb-8">
            <Text className="text-3xl font-bold text-neutral-900">NKS Kontroll</Text>
            <Text className="mt-1 text-base text-neutral-500">
              Logg inn for å fortsette
            </Text>
          </View>

          <View className="gap-4">
            <Field
              label="Brukernavn"
              value={userName}
              onChangeText={setUserName}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              placeholder="Brukernavn"
            />
            <Field
              label="Passord"
              value={password}
              onChangeText={setPassword}
              secureTextEntryToggle
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              placeholder="Passord"
              onSubmitEditing={onSubmit}
              returnKeyType="go"
            />
            <ErrorText>{error}</ErrorText>
            <View className="mt-2">
              <Button label="Logg inn" onPress={onSubmit} loading={loading} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
