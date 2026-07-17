/**
 * Info 屏（Tab「Info」）—— 参考旧 ProjectInfo.tsx。
 *  - 项目名
 *  - 检验日期(可改:DateTimePicker → ProjectUpdate)
 *  - 地址(Kart:复制 / Google Maps / Apple Maps,用 Linking + Clipboard)
 *  - 联系人电话(Prosjektleder / UTF Våtrom,tel: 拨号)
 *  - 可编辑描述(Lagre → ProjectUpdate)
 * 所有写走离线层(useSyncProjectUpdate),离线先本地、联网补传。
 */
import * as React from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import {
  useLoadActiveProject,
  useSyncProjectUpdate,
} from '@/features/active-project/hooks';

/** 检验日期展示:可解析则 dd.mm.yyyy,否则原样。 */
function formatDate(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value || '—';
  const p = (n: number) => `${n < 10 ? '0' : ''}${n}`;
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}

function Divider() {
  return <View className="my-1 h-px bg-neutral-200 dark:bg-neutral-800" />;
}

function Row({
  icon,
  label,
  text,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label?: string;
  text: string;
  action: React.ReactNode;
}) {
  return (
    <View className="flex-row items-center justify-between py-2">
      <View className="flex-1 flex-row items-center gap-3 pr-2">
        <Ionicons name={icon} size={22} color="#1d4ed8" />
        <View className="flex-1">
          {label ? (
            <Text className="text-xs text-neutral-400">{label}</Text>
          ) : null}
          <Text className="text-base text-neutral-900 dark:text-neutral-100">
            {text || '—'}
          </Text>
        </View>
      </View>
      {action}
    </View>
  );
}

function LinkButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="rounded-lg px-3 py-2 active:bg-brand/10">
      <Text className="text-sm font-semibold text-brand">{label}</Text>
    </Pressable>
  );
}

function MenuItem({
  label,
  onPress,
  muted,
}: {
  label: string;
  onPress: () => void;
  muted?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl px-4 py-3 active:bg-neutral-100 dark:active:bg-neutral-800"
    >
      <Text
        className={
          muted
            ? 'text-center text-base text-neutral-400'
            : 'text-center text-base text-brand'
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function ProjectInfoTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, status, error, online } = useLoadActiveProject(id);
  const { updateProject } = useSyncProjectUpdate();

  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showMapMenu, setShowMapMenu] = React.useState(false);
  const [descDraft, setDescDraft] = React.useState('');

  // 载入/切项目时同步描述草稿
  React.useEffect(() => {
    setDescDraft(detail?.description ?? '');
  }, [detail?.projectID, detail?.description]);

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

  const address = detail.address;
  const canMap = address.trim().length > 0;

  const onPickDate = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Android 选完即关
    if (event.type === 'set' && date) {
      if (Platform.OS !== 'ios') setShowDatePicker(false);
      void updateProject({ inspectionDate: date.toISOString() });
    } else if (event.type === 'dismissed') {
      setShowDatePicker(false);
    }
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(address);
    setShowMapMenu(false);
  };
  const openUrl = (url: string) => {
    setShowMapMenu(false);
    void Linking.openURL(url);
  };
  const call = (number: string) => {
    if (number) void Linking.openURL(`tel:${number}`);
  };

  const dateValue = (() => {
    const d = new Date(detail.inspectionDate);
    return Number.isNaN(d.getTime()) ? new Date() : d;
  })();

  return (
    <ScrollView
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      contentContainerClassName="p-4 gap-4"
    >
      {!online ? (
        <View className="rounded-xl bg-amber-100 px-3 py-2 dark:bg-amber-900/40">
          <Text className="text-sm text-amber-800 dark:text-amber-200">
            Offline – endringer lagres lokalt og sendes når du er tilkoblet
          </Text>
        </View>
      ) : detail.projectDirty ? (
        <View className="rounded-xl bg-blue-50 px-3 py-2 dark:bg-blue-900/30">
          <Text className="text-sm text-blue-700 dark:text-blue-300">
            Synkroniserer endringer…
          </Text>
        </View>
      ) : null}

      <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
        {detail.projectName}
      </Text>

      <View className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
        <Row
          icon="calendar-outline"
          text={formatDate(detail.inspectionDate)}
          action={<LinkButton label="Rediger" onPress={() => setShowDatePicker(true)} />}
        />
        <Divider />
        <Row
          icon="location-outline"
          text={address}
          action={
            canMap ? (
              <LinkButton label="Kart" onPress={() => setShowMapMenu(true)} />
            ) : null
          }
        />
        <Divider />
        <Row
          icon="call-outline"
          label="Prosjektleder"
          text={detail.projectLeader.name}
          action={
            detail.projectLeader.number ? (
              <LinkButton label="Ring" onPress={() => call(detail.projectLeader.number)} />
            ) : null
          }
        />
        <Divider />
        <Row
          icon="call-outline"
          label="UTF Våtrom"
          text={detail.flisLegger.name}
          action={
            detail.flisLegger.number ? (
              <LinkButton label="Ring" onPress={() => call(detail.flisLegger.number)} />
            ) : null
          }
        />
      </View>

      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs font-medium text-neutral-400">Beskrivelse</Text>
          <LinkButton
            label="Lagre"
            onPress={() => {
              if (descDraft !== detail.description) {
                void updateProject({ description: descDraft });
              }
            }}
          />
        </View>
        <TextInput
          multiline
          numberOfLines={4}
          value={descDraft}
          onChangeText={setDescDraft}
          placeholder="Legg til beskrivelse…"
          placeholderTextColor="#a3a3a3"
          className="min-h-24 rounded-xl border border-neutral-300 bg-white p-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          textAlignVertical="top"
        />
      </View>

      {showDatePicker ? (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onPickDate}
        />
      ) : null}

      <Modal
        visible={showMapMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMapMenu(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setShowMapMenu(false)}
        >
          <View className="rounded-t-2xl bg-white p-2 dark:bg-neutral-900">
            <MenuItem label="Kopier adresse" onPress={copyAddress} />
            <MenuItem
              label="Åpne i Google Maps"
              onPress={() =>
                openUrl(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
                )
              }
            />
            <MenuItem
              label="Åpne i Kart"
              onPress={() => openUrl(`http://maps.apple.com/?q=${encodeURIComponent(address)}`)}
            />
            <MenuItem label="Avbryt" onPress={() => setShowMapMenu(false)} muted />
          </View>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
