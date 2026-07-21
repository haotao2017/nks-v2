/**
 * 极简 UI 基元(NativeWind)。NBK 风格:干净、克制、挪威语文案。
 * 仅覆盖登录/列表纵切所需;后续按需扩展。
 */
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function Button({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`h-12 flex-row items-center justify-center rounded-xl px-4 ${
        isDisabled ? 'bg-brand/50' : 'bg-brand active:bg-brand/90'
      }`}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className="text-base font-semibold text-white">{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  secureTextEntryToggle,
  secureTextEntry,
  className,
  ...props
}: {
  label: string;
  /** 显示眼睛图标,用于切换密码明文/密文。 */
  secureTextEntryToggle?: boolean;
} & TextInputProps) {
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const isSecure = secureTextEntryToggle ? !passwordVisible : secureTextEntry;

  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-neutral-700">{label}</Text>
      <View className="relative">
        <TextInput
          className={`h-12 rounded-xl border border-neutral-300 bg-white px-3 text-base text-neutral-900 ${
            secureTextEntryToggle ? 'pr-12' : ''
          } ${className ?? ''}`}
          placeholderTextColor="#a3a3a3"
          secureTextEntry={isSecure}
          {...props}
        />
        {secureTextEntryToggle ? (
          <Pressable
            onPress={() => setPasswordVisible((v) => !v)}
            className="absolute right-0 top-0 h-12 w-12 items-center justify-center"
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={passwordVisible ? 'Skjul passord' : 'Vis passord'}
          >
            <Ionicons
              name={passwordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#737373"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <View className="rounded-2xl border border-neutral-200 bg-white p-4">
      {children}
    </View>
  );
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <Text className="text-sm text-red-600">{children}</Text>;
}
