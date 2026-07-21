/**
 * Exterior 屏（Tab「Utvendig」）—— 参考旧 ProjectExterior.tsx + NBKCamera。
 *  - 后置相机拍外景照 / 从相册选(expo-image-picker)。
 *  - 选中图经离线层走 ProjectUpdate multipart 上传(image 部件),压缩/HEIC→JPEG 在
 *    上传时由 uriToFormDataPart 处理。
 *  - 显示当前外景照(远程或本地),可删除(清本地 + 再次 ProjectUpdate)。
 */
import * as React from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { ProjectLoadGate } from '@/components/screen-states';
import {
  useLoadActiveProject,
  useSyncProjectUpdate,
} from '@/features/active-project/hooks';
import { useProjectRouteId } from '@/lib/use-project-route-id';

function ActionButton({
  icon,
  label,
  onPress,
  tone = 'brand',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'brand' | 'danger';
}) {
  const color = tone === 'danger' ? '#dc2626' : '#1d4ed8';
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800"
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text
        className="text-sm font-semibold"
        style={{ color }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProjectExteriorTab() {
  const id = useProjectRouteId();
  const { detail, status, error, online, reload } = useLoadActiveProject(id);
  const { updateProject } = useSyncProjectUpdate();

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

  const ensureCameraPermission = async (): Promise<boolean> => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync();
    if (!granted) {
      Alert.alert('Kameratilgang', 'Gi appen tilgang til kameraet for å ta bilde.');
    }
    return granted;
  };

  const takePhoto = async () => {
    if (!(await ensureCameraPermission())) return;
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
      cameraType: ImagePicker.CameraType.back,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      void updateProject({ exteriorImage: res.assets[0].uri });
    }
  };

  const pickFromLibrary = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    if (!res.canceled && res.assets[0]?.uri) {
      void updateProject({ exteriorImage: res.assets[0].uri });
    }
  };

  const removePhoto = () => {
    Alert.alert('Slette bilde', 'Vil du fjerne det utvendige bildet?', [
      { text: 'Avbryt', style: 'cancel' },
      {
        text: 'Slett',
        style: 'destructive',
        onPress: () => void updateProject({ exteriorImage: null }),
      },
    ]);
  };

  const hasImage = Boolean(detail.exteriorImage);

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      contentContainerClassName="p-4 gap-4"
    >
      {!online ? (
        <View className="rounded-xl bg-amber-100 px-3 py-2 dark:bg-amber-900/40">
          <Text className="text-sm text-amber-800 dark:text-amber-200">
            Offline – bildet lagres lokalt og lastes opp når du er tilkoblet
          </Text>
        </View>
      ) : detail.projectDirty ? (
        <View className="rounded-xl bg-blue-50 px-3 py-2 dark:bg-blue-900/30">
          <Text className="text-sm text-blue-700 dark:text-blue-300">
            Laster opp…
          </Text>
        </View>
      ) : null}

      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        Utvendig bilde
      </Text>

      <View className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {hasImage ? (
          <Image
            source={{ uri: detail.exteriorImage! }}
            className="aspect-[4/3] w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="aspect-[4/3] w-full items-center justify-center gap-2 bg-neutral-100 dark:bg-neutral-800">
            <Ionicons name="image-outline" size={48} color="#a3a3a3" />
            <Text className="text-sm text-neutral-400">Ingen bilde ennå</Text>
          </View>
        )}
      </View>

      <View className="flex-row gap-3">
        <ActionButton icon="camera-outline" label="Ta bilde" onPress={takePhoto} />
        <ActionButton icon="images-outline" label="Galleri" onPress={pickFromLibrary} />
      </View>

      {hasImage ? (
        <ActionButton
          icon="trash-outline"
          label="Slett bilde"
          onPress={removePhoto}
          tone="danger"
        />
      ) : null}
    </ScrollView>
  );
}
