/**
 * Plantegning 屏（Tab「Plantegning」）—— 渲染 detail.floorPlanUrl 的 PDF 户型图。
 * 参考旧 Components/PdfViewer(翻页/旋转/缩放)。
 *
 * PDF 方案:react-native-pdf(原生模块,手势捏合缩放/横向翻页体验最好)。
 *   - 翻页:page 受控 + 底部上一页/下一页;缩放:scale 受控 + 原生捏合(min/max);
 *     旋转:对渲染视图施加 transform rotate,循环 0/90/180/270。
 *   ⚠ 需 EAS/dev build(prebuild),不支持 Expo Go(react-native-pdf 依赖原生模块
 *      react-native-blob-util)。
 * floorPlanUrl 为空时显示占位。
 */
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';

import { useLoadActiveProject } from '@/features/active-project/hooks';

const MIN_SCALE = 1;
const MAX_SCALE = 3;
const SCALE_STEP = 0.5;

function ToolButton({
  icon,
  onPress,
  disabled,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={`h-11 w-11 items-center justify-center rounded-full ${
        disabled ? 'opacity-30' : 'active:bg-white/20'
      }`}
    >
      <Ionicons name={icon} size={24} color="#ffffff" />
    </Pressable>
  );
}

export default function PlantegningTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, status, error } = useLoadActiveProject(id);
  const { width, height } = useWindowDimensions();

  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(0);
  const [scale, setScale] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [pdfError, setPdfError] = React.useState<string | null>(null);

  if (!detail) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-neutral-950">
        {status === 'error' ? (
          <Text className="text-center text-sm text-red-600">
            {error ?? 'Kunne ikke laste prosjektet'}
          </Text>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    );
  }

  const url = detail.floorPlanUrl;

  if (!url) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-neutral-50 px-6 dark:bg-neutral-950">
        <Ionicons name="document-outline" size={56} color="#a3a3a3" />
        <Text className="text-center text-base font-medium text-neutral-500 dark:text-neutral-400">
          Ingen plantegning tilgjengelig
        </Text>
      </View>
    );
  }

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => (totalPages ? Math.min(totalPages, p + 1) : p + 1));
  const rotate = () => setRotation((r) => (r + 90) % 360);
  const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, s + SCALE_STEP));
  const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, s - SCALE_STEP));

  const sideways = rotation === 90 || rotation === 270;

  return (
    <View className="flex-1 bg-black">
      <View className="flex-1 items-center justify-center">
        {pdfError ? (
          <View className="items-center gap-3 px-6">
            <Ionicons name="alert-circle-outline" size={48} color="#f87171" />
            <Text className="text-center text-sm text-red-400">{pdfError}</Text>
          </View>
        ) : (
          <Pdf
            key={url}
            source={{ uri: url, cache: true }}
            page={page}
            scale={scale}
            minScale={MIN_SCALE}
            maxScale={MAX_SCALE}
            onLoadComplete={(numberOfPages) => {
              setTotalPages(numberOfPages);
              setPdfError(null);
            }}
            onPageChanged={(p) => setPage(p)}
            onError={() => setPdfError('Kunne ikke åpne plantegningen')}
            trustAllCerts={false}
            // 旋转:整页渲染视图做 transform;横向时交换宽高避免被裁切。
            style={{
              width: sideways ? height : width,
              height: sideways ? width : height,
              backgroundColor: '#000000',
              transform: [{ rotate: `${rotation}deg` }],
            }}
          />
        )}
      </View>

      {/* 底部工具条:上一页 / 页码 / 下一页 / 旋转 / 缩放 */}
      <View className="flex-row items-center justify-between bg-black/80 px-4 py-2">
        <View className="flex-row items-center">
          <ToolButton icon="chevron-back" onPress={goPrev} disabled={page <= 1} />
          <Text className="min-w-16 text-center text-sm font-medium text-white">
            {totalPages ? `${page} / ${totalPages}` : '…'}
          </Text>
          <ToolButton
            icon="chevron-forward"
            onPress={goNext}
            disabled={totalPages > 0 && page >= totalPages}
          />
        </View>
        <View className="flex-row items-center">
          <ToolButton icon="remove-outline" onPress={zoomOut} disabled={scale <= MIN_SCALE} />
          <ToolButton icon="add-outline" onPress={zoomIn} disabled={scale >= MAX_SCALE} />
          <ToolButton icon="sync-outline" onPress={rotate} />
        </View>
      </View>
    </View>
  );
}
