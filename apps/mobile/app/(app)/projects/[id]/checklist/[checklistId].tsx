/**
 * 单清单填写屏 —— 现场检验核心。参考旧 SingleCheckList.tsx + NBKCamera。
 *
 * 每个检查项:
 *  - 三态单选 OK(Godkjent) / Avvik / IA(I/A)。状态值为离线层 ChecklistStatus
 *    ('OK' | 'Avvik' | 'IA'),原样传给后端(见 buildChecklistUpdateForm)。
 *  - 选 OK/Avvik 且尚无图片 → 强制拍照(自动弹拍照/相册);至少一张。
 *  - 选 IA → 清空该项图片。
 *  - 备注(失焦提交)。
 *  - 已拍图片九宫格缩略图 + 单张删除。
 *  - 状态/备注/图片任一变化即调 useUpdateChecklistItem().update(离线优先,
 *    本地写 + 联网同步 + updated 去重);离线也能编辑,恢复联网补传。
 *  - 角标显示同步状态(updated=true 已同步 / false 待同步)。
 *
 * 图片仅存本地/远程 URI 到 item.itemImageUrls;压缩/HEIC→JPEG/URI→部件在上传时
 * 由离线层 uriToFormDataPart 处理,这里不做转换。
 */
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useLoadActiveProject } from '@/features/active-project/hooks';
import { useUpdateChecklistItem } from '@/features/active-project/hooks';
import type {
  ChecklistStatus,
  LocalChecklistItem,
} from '@/store/active-project-slice';

const STATUS_OPTIONS: {
  value: ChecklistStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'OK', label: 'Godkjent', icon: 'checkmark-circle-outline' },
  { value: 'Avvik', label: 'Avvik', icon: 'alert-circle-outline' },
  { value: 'IA', label: 'I/A', icon: 'remove-circle-outline' },
];

/** 三态单选按钮的选中/未选中配色。 */
function statusClasses(value: ChecklistStatus, selected: boolean): string {
  if (!selected) {
    return 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900';
  }
  switch (value) {
    case 'OK':
      return 'border-green-600 bg-green-600';
    case 'Avvik':
      return 'border-red-600 bg-red-600';
    case 'IA':
      return 'border-neutral-500 bg-neutral-500';
  }
}

function statusTextColor(value: ChecklistStatus, selected: boolean): string {
  if (selected) return '#ffffff';
  switch (value) {
    case 'OK':
      return '#16a34a';
    case 'Avvik':
      return '#dc2626';
    case 'IA':
      return '#737373';
  }
}

async function ensureCameraPermission(): Promise<boolean> {
  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) {
    Alert.alert('Kameratilgang', 'Gi appen tilgang til kameraet for å ta bilde.');
  }
  return granted;
}

/** 单个检查项卡片(memo:大量项时避免整表重渲染)。 */
const ItemCard = React.memo(function ItemCard({
  item,
  onUpdate,
}: {
  item: LocalChecklistItem;
  onUpdate: (
    itemId: string,
    patch: Partial<
      Pick<LocalChecklistItem, 'status' | 'comment' | 'itemImageUrls'>
    >,
  ) => void;
}) {
  const [commentDraft, setCommentDraft] = React.useState(item.comment ?? '');

  // 项/内容变化时同步草稿(切项目或远端刷新)
  React.useEffect(() => {
    setCommentDraft(item.comment ?? '');
  }, [item.checklistItemId, item.comment]);

  const appendImages = React.useCallback(
    (uris: string[]) => {
      if (uris.length === 0) return;
      onUpdate(item.checklistItemId, {
        itemImageUrls: [...item.itemImageUrls, ...uris],
      });
    },
    [item.checklistItemId, item.itemImageUrls, onUpdate],
  );

  const takePhoto = React.useCallback(async () => {
    if (!(await ensureCameraPermission())) return;
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      cameraType: ImagePicker.CameraType.back,
    });
    if (!res.canceled) {
      appendImages(res.assets.map((a) => a.uri));
    }
  }, [appendImages]);

  const pickFromLibrary = React.useCallback(async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
      allowsMultipleSelection: true,
    });
    if (!res.canceled) {
      appendImages(res.assets.map((a) => a.uri));
    }
  }, [appendImages]);

  const promptAddPhoto = React.useCallback(() => {
    Alert.alert('Legg til bilde', undefined, [
      { text: 'Ta bilde', onPress: () => void takePhoto() },
      { text: 'Velg fra galleri', onPress: () => void pickFromLibrary() },
      { text: 'Avbryt', style: 'cancel' },
    ]);
  }, [takePhoto, pickFromLibrary]);

  const onSelectStatus = React.useCallback(
    (value: ChecklistStatus) => {
      if (value === item.status) return;
      if (value === 'IA') {
        // IA:清空图片
        onUpdate(item.checklistItemId, { status: 'IA', itemImageUrls: [] });
        return;
      }
      // OK / Avvik:强制拍照——先写状态,若还没有图片则立即弹拍照
      onUpdate(item.checklistItemId, { status: value });
      if (item.itemImageUrls.length === 0) {
        promptAddPhoto();
      }
    },
    [item.status, item.checklistItemId, item.itemImageUrls.length, onUpdate, promptAddPhoto],
  );

  const removeImage = React.useCallback(
    (index: number) => {
      const next = item.itemImageUrls.filter((_, i) => i !== index);
      onUpdate(item.checklistItemId, { itemImageUrls: next });
    },
    [item.checklistItemId, item.itemImageUrls, onUpdate],
  );

  const commitComment = React.useCallback(() => {
    const trimmed = commentDraft;
    if (trimmed !== (item.comment ?? '')) {
      onUpdate(item.checklistItemId, { comment: trimmed });
    }
  }, [commentDraft, item.comment, item.checklistItemId, onUpdate]);

  const requiresPhoto =
    (item.status === 'OK' || item.status === 'Avvik') &&
    item.itemImageUrls.length === 0;

  return (
    <View className="gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-base text-neutral-900 dark:text-neutral-100">
          {item.question}
        </Text>
        <View className="flex-row items-center gap-1">
          <Ionicons
            name={item.updated ? 'cloud-done-outline' : 'cloud-upload-outline'}
            size={16}
            color={item.updated ? '#16a34a' : '#d97706'}
          />
          <Text
            className="text-[11px]"
            style={{ color: item.updated ? '#16a34a' : '#d97706' }}
          >
            {item.updated ? 'Synk' : 'Venter'}
          </Text>
        </View>
      </View>

      {/* 三态单选 */}
      <View className="flex-row gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const selected = item.status === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelectStatus(opt.value)}
              className={`flex-1 flex-row items-center justify-center gap-1 rounded-xl border py-2 ${statusClasses(
                opt.value,
                selected,
              )}`}
            >
              <Ionicons
                name={opt.icon}
                size={16}
                color={statusTextColor(opt.value, selected)}
              />
              <Text
                className="text-sm font-semibold"
                style={{ color: statusTextColor(opt.value, selected) }}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {requiresPhoto ? (
        <Text className="text-xs text-red-600">
          Minst ett bilde er påkrevd for denne statusen
        </Text>
      ) : null}

      {/* 备注 */}
      <TextInput
        multiline
        value={commentDraft}
        onChangeText={setCommentDraft}
        onEndEditing={commitComment}
        onBlur={commitComment}
        placeholder="Kommentar…"
        placeholderTextColor="#a3a3a3"
        className="min-h-12 rounded-xl border border-neutral-300 bg-white p-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        textAlignVertical="top"
      />

      {/* 图片九宫格 */}
      {item.itemImageUrls.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {item.itemImageUrls.map((uri, index) => (
            <View key={`${uri}-${index}`} className="relative">
              <Image
                source={{ uri }}
                className="h-24 w-24 rounded-lg"
                resizeMode="cover"
              />
              <Pressable
                onPress={() => removeImage(index)}
                hitSlop={8}
                className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-red-600"
              >
                <Ionicons name="close" size={16} color="#ffffff" />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}

      {/* 加图 */}
      <Pressable
        onPress={promptAddPhoto}
        className="flex-row items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white py-2.5 active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
      >
        <Ionicons name="camera-outline" size={18} color="#1d4ed8" />
        <Text className="text-sm font-semibold text-brand">Legg til bilde</Text>
      </Pressable>
    </View>
  );
});

export default function SingleChecklistScreen() {
  const { id, checklistId } = useLocalSearchParams<{
    id: string;
    checklistId: string;
  }>();
  const router = useRouter();
  const { detail, status, error } = useLoadActiveProject(id);
  const { update } = useUpdateChecklistItem();

  const handleUpdate = React.useCallback(
    (
      itemId: string,
      patch: Partial<
        Pick<LocalChecklistItem, 'status' | 'comment' | 'itemImageUrls'>
      >,
    ) => {
      void update(checklistId, itemId, patch);
    },
    [update, checklistId],
  );

  const checklist = detail?.checklists.find(
    (c) => c.checklistId === checklistId,
  );

  const pendingCount = React.useMemo(
    () => checklist?.checkItems.filter((i) => !i.updated).length ?? 0,
    [checklist],
  );

  if (!detail || !checklist) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6 dark:bg-neutral-950">
        {status === 'error' ? (
          <Text className="text-center text-sm text-red-600">
            {error ?? 'Kunne ikke laste sjekklisten'}
          </Text>
        ) : status === 'ready' && detail ? (
          <Text className="text-center text-sm text-neutral-500">
            Fant ikke sjekklisten
          </Text>
        ) : (
          <ActivityIndicator />
        )}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      {/* 顶栏:返回 + 清单名 + 同步状态 */}
      <View className="flex-row items-center gap-2 border-b border-neutral-200 bg-white px-2 py-3 dark:border-neutral-800 dark:bg-neutral-900">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="h-9 w-9 items-center justify-center rounded-full active:bg-neutral-100 dark:active:bg-neutral-800"
        >
          <Ionicons name="chevron-back" size={24} color="#1d4ed8" />
        </Pressable>
        <View className="flex-1">
          <Text
            className="text-lg font-bold text-neutral-900 dark:text-neutral-50"
            numberOfLines={1}
          >
            {checklist.checklistName || 'Sjekkliste'}
          </Text>
          <Text
            className="text-xs"
            style={{ color: pendingCount > 0 ? '#d97706' : '#16a34a' }}
          >
            {pendingCount > 0
              ? `${pendingCount} venter på synk`
              : 'Alt synkronisert'}
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-3 p-4 pb-16"
        keyboardShouldPersistTaps="handled"
      >
        {checklist.checkItems.map((item) => (
          <ItemCard
            key={item.checklistItemId}
            item={item}
            onUpdate={handleUpdate}
          />
        ))}
      </ScrollView>
    </View>
  );
}
