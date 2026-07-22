/**
 * Plantegning 屏（Tab「Plantegning」）—— 渲染 detail.floorPlanUrl 的 PDF 户型图。
 *
 * PDF 方案:react-native-webview。
 *   - iOS 的 WKWebView 原生渲染远程 PDF(自带滚动 + 捏合缩放),在 Expo 新架构(SDK 57)
 *     下稳定。此前用 react-native-pdf 在 iOS 新架构下黑屏(原生视图不绘制、回调不触发)。
 *   - Android:系统 WebView 不原生渲染 PDF,故降级为「在系统查看器打开」(Linking.openURL,
 *     用户自己的浏览器/PDF app 直取预签名链接,不经第三方在线预览)。日后若要 Android 内联
 *     渲染,再上原生 PdfRenderer 或本地 pdf.js。
 *   ⚠ 需 EAS/dev build,不支持 Expo Go(react-native-webview 依赖原生模块)。
 * floorPlanUrl 为空时显示占位。
 */
import * as React from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import {
  ProjectLoadGate,
  ScreenEmpty,
  ScreenError,
} from '@/components/screen-states';
import { useLoadActiveProject } from '@/features/active-project/hooks';
import { useProjectRouteId } from '@/lib/use-project-route-id';

export default function PlantegningTab() {
  const id = useProjectRouteId();
  const { detail, status, error, reload } = useLoadActiveProject(id);

  const [pdfError, setPdfError] = React.useState<string | null>(null);

  if (!detail) {
    return (
      <ProjectLoadGate
        detail={detail}
        status={status}
        error={error}
        onRetry={() => void reload()}
      >
        {null}
      </ProjectLoadGate>
    );
  }

  const url = detail.floorPlanUrl;

  if (!url) {
    return (
      <ScreenEmpty
        embedded
        icon="document-outline"
        title="Ingen plantegning tilgjengelig"
        hint="Last opp plantegning i admin for å se den her."
      />
    );
  }

  if (pdfError) {
    return (
      <ScreenError
        embedded
        message={pdfError}
        onRetry={() => {
          setPdfError(null);
          void reload();
        }}
      />
    );
  }

  // Android 的系统 WebView 不原生渲染 PDF —— 在系统查看器中打开(用户自己的浏览器/PDF app
  // 直接取预签名链接,不经任何第三方在线预览,无隐私外泄)。
  if (Platform.OS === 'android') {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-white px-6">
        <Ionicons name="document-text-outline" size={48} color="#a3a3a3" />
        <Text className="text-center text-base font-medium text-neutral-600">
          Plantegning (PDF)
        </Text>
        <Pressable
          onPress={() => {
            void Linking.openURL(url).catch(() =>
              setPdfError('Fant ingen app som kan åpne PDF-en.'),
            );
          }}
          className="rounded-lg bg-blue-600 px-5 py-3 active:opacity-80"
        >
          <Text className="text-sm font-semibold text-white">Åpne plantegning</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <WebView
        key={url}
        source={{ uri: url }}
        originWhitelist={['*']}
        style={{ flex: 1, backgroundColor: '#ffffff' }}
        startInLoadingState
        renderLoading={() => (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#ffffff',
            }}
          >
            <ActivityIndicator size="large" color="#404040" />
            <Text style={{ marginTop: 12, color: '#737373' }}>Laster plantegning…</Text>
          </View>
        )}
        onError={() =>
          setPdfError('Kunne ikke laste plantegningen. Sjekk nettforbindelsen.')
        }
        onHttpError={(e) => {
          const code = e.nativeEvent.statusCode;
          // 预签名链接可能已过期(403)或对象缺失(404)。
          setPdfError(
            code === 403
              ? 'Lenken til plantegningen er utløpt. Gå ut og inn igjen for å oppdatere.'
              : `Kunne ikke hente plantegningen (feil ${code}).`,
          );
        }}
      />
    </View>
  );
}
