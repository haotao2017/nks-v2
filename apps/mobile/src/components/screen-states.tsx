/**
 * 全屏/嵌入页面状态 —— 加载 / 错误 / 空数据 + 全屏 Modal 壳。
 * Tab 内用 embedded(无 SafeArea,避免与导航 header 双重留白);
 * 独立全屏页可用默认 SafeArea。
 */
import * as React from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui';
import type { ActiveProjectStatus } from '@/store/active-project-slice';

function StateShell({
  embedded,
  children,
}: {
  embedded?: boolean;
  children: React.ReactNode;
}) {
  if (embedded) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-50 px-6 dark:bg-neutral-950">
        {children}
      </View>
    );
  }
  return (
    <SafeAreaView
      className="flex-1 items-center justify-center bg-neutral-50 px-6 dark:bg-neutral-950"
      edges={['top', 'left', 'right', 'bottom']}
    >
      {children}
    </SafeAreaView>
  );
}

export function ScreenLoading({
  label,
  embedded,
}: {
  label?: string;
  embedded?: boolean;
}) {
  return (
    <StateShell embedded={embedded}>
      <ActivityIndicator size="large" />
      {label ? (
        <Text className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          {label}
        </Text>
      ) : null}
    </StateShell>
  );
}

export function ScreenError({
  message,
  onRetry,
  embedded,
}: {
  message?: string | null;
  onRetry?: () => void;
  embedded?: boolean;
}) {
  return (
    <StateShell embedded={embedded}>
      <Ionicons name="alert-circle-outline" size={40} color="#dc2626" />
      <Text className="mt-3 text-center text-base font-medium text-neutral-800 dark:text-neutral-100">
        Kunne ikke laste innhold
      </Text>
      <Text className="mt-2 text-center text-sm text-red-600">
        {message ?? 'Ukjent feil'}
      </Text>
      {onRetry ? (
        <View className="mt-6 w-full max-w-xs">
          <Button label="Prøv igjen" onPress={onRetry} />
        </View>
      ) : null}
    </StateShell>
  );
}

export function ScreenEmpty({
  title,
  hint,
  icon = 'folder-open-outline',
  embedded,
}: {
  title: string;
  hint?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  embedded?: boolean;
}) {
  return (
    <StateShell embedded={embedded}>
      <Ionicons name={icon} size={48} color="#a3a3a3" />
      <Text className="mt-3 text-center text-base font-medium text-neutral-500 dark:text-neutral-400">
        {title}
      </Text>
      {hint ? (
        <Text className="mt-2 text-center text-sm text-neutral-400">{hint}</Text>
      ) : null}
    </StateShell>
  );
}

/**
 * 项目详情 Tab 通用门禁:无 detail 时显示加载/错误(可重试),有 detail 则渲染 children。
 */
export function ProjectLoadGate({
  detail,
  status,
  error,
  onRetry,
  children,
}: {
  detail: unknown;
  status: ActiveProjectStatus;
  error: string | null;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (!detail) {
    if (status === 'error') {
      return (
        <ScreenError
          embedded
          message={error ?? 'Kunne ikke laste prosjektet'}
          onRetry={onRetry}
        />
      );
    }
    return <ScreenLoading embedded label="Laster prosjekt…" />;
  }
  return <>{children}</>;
}

/** 全屏 Modal 壳:用外层 insets 做 padding(Modal 窗口内 SafeArea 常失效)。 */
export function FullscreenModal({
  visible,
  title,
  onClose,
  onConfirm,
  confirmLabel = 'Lagre',
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmLabel?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  // Modal 新建窗口时 insets 偶发为 0;仅此时兜底,避免非刘海机型额外留白。
  const topPad =
    insets.top > 0 ? insets.top : Platform.OS === 'ios' ? 54 : 0;
  const bottomPad =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'ios' ? 20 : 0;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: '#ffffff',
            paddingTop: topPad,
            paddingBottom: bottomPad,
            paddingLeft: insets.left,
            paddingRight: insets.right,
          }}
        >
          <View className="z-10 flex-row items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
            <Pressable
              onPress={onClose}
              hitSlop={12}
              className="min-h-11 min-w-16 justify-center py-1"
              accessibilityRole="button"
              accessibilityLabel="Avbryt"
            >
              <Text className="text-base text-neutral-600">Avbryt</Text>
            </Pressable>
            <Text className="text-base font-semibold text-neutral-900">{title}</Text>
            {onConfirm ? (
              <Pressable
                onPress={onConfirm}
                hitSlop={12}
                className="min-h-11 min-w-16 items-end justify-center py-1"
                accessibilityRole="button"
                accessibilityLabel={confirmLabel}
              >
                <Text className="text-base font-semibold text-blue-600">
                  {confirmLabel}
                </Text>
              </Pressable>
            ) : (
              <View className="min-w-16" />
            )}
          </View>
          <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
          {footer ? (
            <View className="border-t border-neutral-200 bg-white p-4">{footer}</View>
          ) : null}
        </View>
      </SafeAreaProvider>
    </Modal>
  );
}
