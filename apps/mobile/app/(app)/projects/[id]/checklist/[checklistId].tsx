/**
 * 单清单填写屏 —— 现场检验核心。参考旧 SingleCheckList.tsx + NBKCamera。
 *
 * 每个检查项:
 *  - 三态单选 Godkjent(OK) / Avvik(Dev) / I/A(NA)。wire 值为离线层 ChecklistStatus
 *    ('OK' | 'Dev' | 'NA'),与旧客户端及后端落库一致(见 buildChecklistUpdateForm)。
 *  - 选 OK/Dev 且尚无图片 → 强制拍照;有图后才写入状态(取消拍照则不落状态)。
 *  - 选 NA → 立即写入,保留已有图片(不要求拍照,也不清空图)。
 *  - 备注(失焦提交)。
 *  - 已拍图片九宫格缩略图 + 单张删除(删光 OK/Dev 图时清状态)。
 *  - 状态/备注/图片任一变化即调 useUpdateChecklistItem().update(离线优先,
 *    本地写 + 联网同步 + updated 去重);离线也能编辑,恢复联网补传。
 *  - 角标显示同步状态(updated=true 已同步 / false 待同步)。
 *
 * 图片仅存本地/远程 URI 到 item.itemImageUrls;压缩/HEIC→JPEG/URI→部件在上传时
 * 由离线层 uriToFormDataPart 处理,这里不做转换。
 */
import * as React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useGlobalSearchParams, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ProjectLoadGate,
  ScreenEmpty,
} from '@/components/screen-states';
import { useLoadActiveProject } from '@/features/active-project/hooks';
import { useUpdateChecklistItem } from '@/features/active-project/hooks';
import type { ChecklistStatus } from '@/features/active-project/status';
import {
  shouldClearStatusAfterAllImagesRemoved,
  shouldDeferStatusForPhoto,
} from '@/features/active-project/status';
import type { LocalChecklistItem } from '@/store/active-project-slice';
import { store } from '@/store';
import { normalizeRouteParam } from '@/lib/route-params';
import { useProjectRouteId } from '@/lib/use-project-route-id';

/** 从 store 读最新检查项,避免闭包里的 itemImageUrls 过期覆盖已上传图。 */
function readLatestItem(
  checklistId: string,
  checklistItemId: string,
): LocalChecklistItem | undefined {
  return store
    .getState()
    .activeProject.detail?.checklists.find((c) => c.checklistId === checklistId)
    ?.checkItems.find((i) => i.checklistItemId === checklistItemId);
}

const STATUS_OPTIONS: {
  value: ChecklistStatus;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { value: 'OK', label: 'Godkjent', icon: 'checkmark-circle-outline' },
  { value: 'Dev', label: 'Avvik', icon: 'alert-circle-outline' },
  { value: 'NA', label: 'I/A', icon: 'remove-circle-outline' },
];

/** 三态单选按钮的选中/未选中配色。 */
function statusClasses(value: ChecklistStatus, selected: boolean): string {
  if (!selected) {
    return 'border-neutral-300 bg-white dark:border-neutral-700 dark:bg-neutral-900';
  }
  switch (value) {
    case 'OK':
      return 'border-green-600 bg-green-600';
    case 'Dev':
      return 'border-red-600 bg-red-600';
    case 'NA':
      return 'border-neutral-500 bg-neutral-500';
  }
}

function statusTextColor(value: ChecklistStatus, selected: boolean): string {
  if (selected) return '#ffffff';
  switch (value) {
    case 'OK':
      return '#16a34a';
    case 'Dev':
      return '#dc2626';
    case 'NA':
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
  checklistId,
  item,
  onUpdate,
}: {
  checklistId: string;
  item: LocalChecklistItem;
  onUpdate: (
    itemId: string,
    patch: Partial<
      Pick<LocalChecklistItem, 'status' | 'comment' | 'itemImageUrls'>
    >,
  ) => void;
}) {
  const [commentDraft, setCommentDraft] = React.useState(item.comment ?? '');
  /** OK/Dev 且尚无图时暂存目标状态:有图后才写入(对齐旧 SingleCheckList)。 */
  const [pendingStatus, setPendingStatus] = React.useState<ChecklistStatus | null>(
    null,
  );
  /** 防止连续点状态按钮叠出多个选图弹窗。 */
  const pickingRef = React.useRef(false);
  const commentDraftRef = React.useRef(commentDraft);
  commentDraftRef.current = commentDraft;

  // 项/内容变化时同步草稿(切项目或远端刷新)
  React.useEffect(() => {
    setCommentDraft(item.comment ?? '');
  }, [item.checklistItemId, item.comment]);

  // 换项时清暂存状态
  React.useEffect(() => {
    setPendingStatus(null);
    pickingRef.current = false;
  }, [item.checklistItemId]);

  const commitComment = React.useCallback(
    (nextText?: string) => {
      const trimmed = (nextText ?? commentDraftRef.current) ?? '';
      const latest = readLatestItem(checklistId, item.checklistItemId);
      const saved = latest?.comment ?? item.comment ?? '';
      if (trimmed !== saved) {
        onUpdate(item.checklistItemId, { comment: trimmed });
      }
    },
    [checklistId, item.checklistItemId, item.comment, onUpdate],
  );

  // 输入时防抖落盘(旧端靠 Submit;新端用防抖+失焦,避免 iOS 不触发 blur 丢字)
  React.useEffect(() => {
    const handle = setTimeout(() => {
      commitComment(commentDraft);
    }, 400);
    return () => clearTimeout(handle);
  }, [commentDraft, commitComment]);

  // 卸载时再冲一次,防止离开页时定时器被清掉
  React.useEffect(() => {
    return () => {
      commitComment();
    };
  }, [commitComment]);

  const appendImages = React.useCallback(
    (uris: string[]) => {
      if (uris.length === 0) return;
      const latest = readLatestItem(checklistId, item.checklistItemId);
      const currentUrls = latest?.itemImageUrls ?? item.itemImageUrls;
      const nextUrls = [...currentUrls, ...uris];
      // 有 pendingStatus → 与图片一并落盘(旧客户端:先拍照再写 status)
      if (pendingStatus) {
        onUpdate(item.checklistItemId, {
          status: pendingStatus,
          itemImageUrls: nextUrls,
        });
        setPendingStatus(null);
        return;
      }
      onUpdate(item.checklistItemId, {
        itemImageUrls: nextUrls,
      });
    },
    [checklistId, item.checklistItemId, item.itemImageUrls, onUpdate, pendingStatus],
  );

  const takePhoto = React.useCallback(async () => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    try {
      if (!(await ensureCameraPermission())) return;
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1,
        cameraType: ImagePicker.CameraType.back,
      });
      if (res.canceled) {
        const latest = readLatestItem(checklistId, item.checklistItemId);
        const imageCount =
          latest?.itemImageUrls.length ?? item.itemImageUrls.length;
        if (pendingStatus && imageCount === 0) {
          setPendingStatus(null);
        }
        return;
      }
      appendImages(res.assets.map((a) => a.uri));
    } finally {
      pickingRef.current = false;
    }
  }, [
    appendImages,
    checklistId,
    item.checklistItemId,
    item.itemImageUrls.length,
    pendingStatus,
  ]);

  const pickFromLibrary = React.useCallback(async () => {
    if (pickingRef.current) return;
    pickingRef.current = true;
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 1,
        allowsMultipleSelection: true,
      });
      if (res.canceled) {
        const latest = readLatestItem(checklistId, item.checklistItemId);
        const imageCount =
          latest?.itemImageUrls.length ?? item.itemImageUrls.length;
        if (pendingStatus && imageCount === 0) {
          setPendingStatus(null);
        }
        return;
      }
      appendImages(res.assets.map((a) => a.uri));
    } finally {
      pickingRef.current = false;
    }
  }, [
    appendImages,
    checklistId,
    item.checklistItemId,
    item.itemImageUrls.length,
    pendingStatus,
  ]);

  const promptAddPhoto = React.useCallback(() => {
    if (pickingRef.current) return;
    Alert.alert('Legg til bilde', undefined, [
      { text: 'Ta bilde', onPress: () => void takePhoto() },
      { text: 'Velg fra galleri', onPress: () => void pickFromLibrary() },
      {
        text: 'Avbryt',
        style: 'cancel',
        onPress: () => {
          const latest = readLatestItem(checklistId, item.checklistItemId);
          const imageCount =
            latest?.itemImageUrls.length ?? item.itemImageUrls.length;
          if (pendingStatus && imageCount === 0) {
            setPendingStatus(null);
          }
        },
      },
    ]);
  }, [
    takePhoto,
    pickFromLibrary,
    pendingStatus,
    checklistId,
    item.checklistItemId,
    item.itemImageUrls.length,
  ]);

  const onSelectStatus = React.useCallback(
    (value: ChecklistStatus) => {
      if (pickingRef.current) return;
      const latest = readLatestItem(checklistId, item.checklistItemId);
      const currentStatus = latest?.status ?? item.status;
      const imageCount =
        latest?.itemImageUrls.length ?? item.itemImageUrls.length;

      if (value === currentStatus && pendingStatus == null) return;

      if (value === 'NA') {
        // NA 不要求照片,也不清空已有图(避免切换三态时误删)。
        setPendingStatus(null);
        onUpdate(item.checklistItemId, { status: 'NA' });
        return;
      }

      // OK / Dev:已有图 → 直接写状态;无图 → 暂存并强制拍照(取消则不落状态)
      if (shouldDeferStatusForPhoto(value, imageCount)) {
        setPendingStatus(value);
        promptAddPhoto();
        return;
      }
      setPendingStatus(null);
      onUpdate(item.checklistItemId, { status: value });
    },
    [
      checklistId,
      item.status,
      item.checklistItemId,
      item.itemImageUrls.length,
      onUpdate,
      promptAddPhoto,
      pendingStatus,
    ],
  );

  const removeImage = React.useCallback(
    (index: number) => {
      const latest = readLatestItem(checklistId, item.checklistItemId);
      const urls = latest?.itemImageUrls ?? item.itemImageUrls;
      const status = latest?.status ?? item.status;
      const next = urls.filter((_, i) => i !== index);
      // 删光图片且状态为 OK/Dev → 清除状态(与强制拍照规则一致)
      if (shouldClearStatusAfterAllImagesRemoved(status, next.length)) {
        onUpdate(item.checklistItemId, {
          itemImageUrls: next,
          status: null,
        });
        return;
      }
      onUpdate(item.checklistItemId, { itemImageUrls: next });
    },
    [checklistId, item.checklistItemId, item.itemImageUrls, item.status, onUpdate],
  );

  const displayStatus = pendingStatus ?? item.status;
  const requiresPhoto =
    (displayStatus === 'OK' || displayStatus === 'Dev') &&
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
          const selected = displayStatus === opt.value;
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

      {/* 备注:防抖自动保存 + 失焦再冲一次(旧端是点 Submit 才保存) */}
      <TextInput
        multiline
        value={commentDraft}
        onChangeText={setCommentDraft}
        onEndEditing={() => commitComment()}
        onBlur={() => commitComment()}
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
  const local = useLocalSearchParams<{
    id?: string | string[];
    checklistId?: string | string[];
  }>();
  const global = useGlobalSearchParams<{
    id?: string | string[];
    checklistId?: string | string[];
  }>();
  const id = useProjectRouteId();
  const checklistId =
    normalizeRouteParam(local.checklistId) ??
    normalizeRouteParam(global.checklistId) ??
    '';
  const router = useRouter();
  const { detail, status, error, reload } = useLoadActiveProject(id);
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

  if (!checklist) {
    return (
      <SafeAreaView className="flex-1 bg-neutral-50" edges={['top', 'left', 'right']}>
        <View className="flex-row items-center gap-2 border-b border-neutral-200 bg-white px-2 py-3">
          <Pressable
            onPress={() => router.back()}
            hitSlop={8}
            className="h-9 w-9 items-center justify-center rounded-full active:bg-neutral-100"
          >
            <Ionicons name="chevron-back" size={24} color="#1d4ed8" />
          </Pressable>
          <Text className="text-lg font-bold text-neutral-900">Sjekkliste</Text>
        </View>
        <ScreenEmpty
          embedded
          title="Fant ikke sjekklisten"
          hint="Gå tilbake og åpne sjekklisten på nytt."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50 dark:bg-neutral-950" edges={['top', 'left', 'right']}>
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

      {checklist.checkItems.length === 0 ? (
        <ScreenEmpty
          embedded
          icon="list-outline"
          title="Ingen kontrollpunkter"
          hint="Denne sjekklisten har ingen punkter ennå."
        />
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerClassName="gap-3 p-4 pb-16"
          keyboardShouldPersistTaps="handled"
        >
          {checklist.checkItems.map((item) => (
            <ItemCard
              key={item.checklistItemId}
              checklistId={checklist.checklistId}
              item={item}
              onUpdate={handleUpdate}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
