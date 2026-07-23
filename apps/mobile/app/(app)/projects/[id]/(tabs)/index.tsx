/**
 * Info 屏（Tab「Info」）—— 参考旧 ProjectInfo.tsx。
 *  - 项目名
 *  - 检验日期(可改:弹窗日历确认后 → ProjectUpdate)
 *  - 地址(Kart:复制 / Google Maps / Apple Maps,用 Linking + Clipboard)
 *  - 联系人电话(Prosjektleder / UTF Våtrom,tel: 拨号)
 *  - 可编辑描述(Lagre → ProjectUpdate)
 * 所有写走离线层(useSyncProjectUpdate),离线先本地、联网补传。
 */
import * as React from 'react';
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

import { ProjectLoadGate } from '@/components/screen-states';
import {
  useLoadActiveProject,
  useSyncProjectUpdate,
} from '@/features/active-project/hooks';
import { useProjectRouteId } from '@/lib/use-project-route-id';

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

function parseInspectionDate(value: string): Date {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default function ProjectInfoTab() {
  const id = useProjectRouteId();
  const { detail, status, error, online, reload } = useLoadActiveProject(id);
  const { updateProject } = useSyncProjectUpdate();
  const { width: windowWidth } = useWindowDimensions();

  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [draftDate, setDraftDate] = React.useState(() => new Date());
  const [showMapMenu, setShowMapMenu] = React.useState(false);
  const [descDraft, setDescDraft] = React.useState('');

  // 载入/切项目时同步描述草稿
  React.useEffect(() => {
    setDescDraft(detail?.description ?? '');
  }, [detail?.projectID, detail?.description]);

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

  const address = detail.address;
  const canMap = address.trim().length > 0;

  const openDatePicker = () => {
    setDraftDate(parseInspectionDate(detail.inspectionDate));
    setShowDatePicker(true);
  };

  const closeDatePicker = () => setShowDatePicker(false);

  const onDraftDateChange = (_event: DateTimePickerEvent, date?: Date) => {
    if (date) setDraftDate(date);
  };

  const confirmDate = () => {
    void updateProject({ inspectionDate: draftDate.toISOString() });
    setShowDatePicker(false);
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

  // 日历在弹窗内居中;宽度略小于屏宽,避免 inline 日历挤偏。
  const pickerWidth = Math.min(340, windowWidth - 48);

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
          action={<LinkButton label="Rediger" onPress={openDatePicker} />}
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

      <Modal
        visible={showDatePicker}
        transparent
        animationType="fade"
        onRequestClose={closeDatePicker}
      >
        <View className="flex-1 items-center justify-center bg-black/45 px-4">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lukk"
            className="absolute inset-0"
            onPress={closeDatePicker}
          />
          <View className="w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-neutral-900">
            <View className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <Text className="text-center text-base font-semibold text-neutral-900 dark:text-neutral-50">
                Velg kontrolldato
              </Text>
            </View>
            <View className="items-center px-2 py-3">
              <View style={{ width: pickerWidth, alignItems: 'center' }}>
                <DateTimePicker
                  value={draftDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                  onChange={onDraftDateChange}
                  style={
                    Platform.OS === 'ios'
                      ? { width: pickerWidth, alignSelf: 'center' }
                      : undefined
                  }
                />
              </View>
            </View>
            <View className="flex-row gap-2 border-t border-neutral-200 p-3 dark:border-neutral-800">
              <Pressable
                onPress={closeDatePicker}
                className="flex-1 items-center rounded-xl bg-neutral-100 py-3 active:bg-neutral-200 dark:bg-neutral-800 dark:active:bg-neutral-700"
              >
                <Text className="text-base font-medium text-neutral-600 dark:text-neutral-300">
                  Avbryt
                </Text>
              </Pressable>
              <Pressable
                onPress={confirmDate}
                className="flex-1 items-center rounded-xl bg-brand py-3 active:bg-brand/90"
              >
                <Text className="text-base font-semibold text-white">Bekreft</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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
