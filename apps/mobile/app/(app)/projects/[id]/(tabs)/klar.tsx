/**
 * Klar 屏（Tab「Klar」）—— 最终提交,参考旧 Screens/Submit.tsx。
 *
 *  - 复核所有清单完成度(用 detail 里各检查项 status 统计),未完成高亮。
 *  - Stepper 强制引导:外景照(Utvendig)未拍 → 阻止;清单未 100% → 阻止;
 *    前置不满足时禁用提交按钮 + 提示。
 *  - 总评/检验员备注输入。
 *  - 必填签名:react-native-signature-canvas(WebView 版,Expo 兼容)采集手写 → base64;
 *    未签名不允许提交。
 *  - 提交流程:先补传所有未 updated 的检查项(复用离线层 resyncPending)→ 调 ProjectSubmit
 *    (带签名/总评/时间)→ 成功后清该项目本地缓存(clearActiveProject + 失效列表缓存)
 *    → 返回项目列表并 toast。带提交中进度态。
 *  - 进页显示 Log 上次提交时间。
 */
import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import SignatureScreen, {
  type SignatureViewRef,
} from 'react-native-signature-canvas';

import {
  FullscreenModal,
  ProjectLoadGate,
} from '@/components/screen-states';
import { useLoadActiveProject } from '@/features/active-project/hooks';
import { fetchLastSubmitted, postProjectSubmit } from '@/features/active-project/api';
import { hasUnsyncedLocalChanges, resyncPending } from '@/features/active-project/sync';
import { projectKeys } from '@/features/projects/api';
import { useProjectRouteId } from '@/lib/use-project-route-id';
import { clearActiveProject } from '@/store/active-project-slice';
import { useAppDispatch } from '@/store/hooks';

/** Signature WebView 必须占满父级高度;NativeWind className 对 WebView 无效。 */
const SIGNATURE_WEB_STYLE = `
  .m-signature-pad { box-shadow: none; margin: 0; border: none; width: 100%; height: 100%; }
  .m-signature-pad--body { border: none; height: 100%; }
  .m-signature-pad--footer { display: none; margin: 0; }
  body,html { width: 100%; height: 100%; margin: 0; padding: 0; }
  .m-signature-pad--body canvas { width: 100% !important; height: 100% !important; }
`;

function toast(message: string) {
  if (Platform.OS === 'android') {
    ToastAndroid.show(message, ToastAndroid.LONG);
  } else {
    Alert.alert('', message);
  }
}

export default function KlarTab() {
  const id = useProjectRouteId();
  const { detail, status, error, online, projectId, reload } =
    useLoadActiveProject(id);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const qc = useQueryClient();

  const [comment, setComment] = React.useState('');
  const [signature, setSignature] = React.useState('');
  const [showSignPad, setShowSignPad] = React.useState(false);
  /** 每次打开签名板递增,强制 remount 以便 dataURL 回填旧签名。 */
  const [signPadKey, setSignPadKey] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [lastSubmitted, setLastSubmitted] = React.useState<string | null>(null);
  const signRef = React.useRef<SignatureViewRef>(null);

  const openSignPad = React.useCallback(() => {
    setSignPadKey((k) => k + 1);
    setShowSignPad(true);
  }, []);

  // 进页拉上次提交时间(离线/失败静默)。
  React.useEffect(() => {
    if (!projectId) return;
    let alive = true;
    fetchLastSubmitted(projectId)
      .then((d) => {
        if (alive) setLastSubmitted(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [projectId]);

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

  // —— 完成度统计 ——
  const checklistStats = detail.checklists.map((cl) => {
    const total = cl.checkItems.length;
    const done = cl.checkItems.filter((it) => it.status !== null).length;
    return { id: cl.checklistId, name: cl.checklistName, done, total };
  });
  const checklistComplete = checklistStats.every((s) => s.done >= s.total);
  const exteriorDone = Boolean(detail.exteriorImage);
  const hasSignature = signature.trim() !== '';
  const canSubmit = exteriorDone && checklistComplete && hasSignature && !submitting;

  // 签名板确认:onOK 回调拿到 base64 data URL。
  const handleSignatureOK = (sig: string) => {
    setSignature(sig);
    setShowSignPad(false);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      // 1. 补传所有未 updated 的检查项 + 未同步的项目级改动。
      await resyncPending();
      // 补传仍有失败时禁止终交:否则会 clearActiveProject,再进项目只能拉到「空」服务端状态。
      if (hasUnsyncedLocalChanges()) {
        throw new Error(
          'Noen endringer ble ikke lagret på server. Sjekk nettverket og prøv igjen.',
        );
      }
      // 2. 最终提交(带签名/总评/时间)。
      await postProjectSubmit({
        projectID: detail.projectID,
        submitDate: new Date().toISOString(),
        inspectorComments: comment,
        inspectorSignature: signature,
      });
      // 3. 清该项目本地缓存 + 失效列表缓存,返回列表并 toast。
      dispatch(clearActiveProject());
      await qc.invalidateQueries({ queryKey: projectKeys.list() });
      toast('Prosjektet er sendt inn');
      router.replace('/(app)/projects');
    } catch (e) {
      setSubmitting(false);
      Alert.alert(
        'Innsending feilet',
        e instanceof Error ? e.message : 'Kunne ikke sende inn prosjektet',
      );
    }
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-neutral-50 dark:bg-neutral-950"
        contentContainerClassName="p-4 gap-4"
      >
        {!online ? (
          <View className="rounded-xl bg-amber-100 px-3 py-2 dark:bg-amber-900/40">
            <Text className="text-sm text-amber-800 dark:text-amber-200">
              Offline – du må være tilkoblet for å sende inn
            </Text>
          </View>
        ) : null}

        <Text className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
          Se gjennom og send inn
        </Text>

        {/* Utvendig / 外景照 gating */}
        <View className="flex-row items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <Ionicons
            name={exteriorDone ? 'checkmark-circle' : 'alert-circle'}
            size={22}
            color={exteriorDone ? '#16a34a' : '#dc2626'}
          />
          <Text className="flex-1 text-base text-neutral-800 dark:text-neutral-200">
            Utvendig bilde
          </Text>
          <Text
            className={`text-sm font-semibold ${
              exteriorDone ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {exteriorDone ? 'OK' : 'Mangler'}
          </Text>
        </View>

        {/* 清单完成度 */}
        <View className="gap-2 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <Text className="mb-1 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            Sjekklister
          </Text>
          {checklistStats.length === 0 ? (
            <Text className="text-sm text-neutral-400">Ingen sjekklister</Text>
          ) : (
            checklistStats.map((s) => {
              const complete = s.done >= s.total;
              return (
                <View key={s.id} className="flex-row items-center justify-between py-1">
                  <Text
                    className={`flex-1 text-sm ${
                      complete
                        ? 'text-neutral-700 dark:text-neutral-300'
                        : 'font-semibold text-red-600'
                    }`}
                  >
                    {s.name}
                  </Text>
                  <Text
                    className={`text-sm font-medium ${
                      complete ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {s.done}/{s.total}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        {/* 总评/备注 */}
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Kommentar
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Skriv en kommentar (valgfritt)"
            placeholderTextColor="#a3a3a3"
            multiline
            className="min-h-24 rounded-xl border border-neutral-300 bg-white p-3 text-base text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
            textAlignVertical="top"
          />
        </View>

        {/* 必填签名 */}
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Signatur *
          </Text>
          {hasSignature ? (
            <View className="gap-2 rounded-xl border border-green-300 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/30">
              <View className="flex-row items-center gap-3">
                <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
                <Text className="flex-1 text-sm text-green-700 dark:text-green-300">
                  Signatur registrert
                </Text>
                <Pressable onPress={openSignPad} hitSlop={8}>
                  <Text className="text-sm font-semibold text-blue-600">Endre</Text>
                </Pressable>
              </View>
              <Image
                source={{ uri: signature }}
                className="h-24 w-full rounded-lg bg-white"
                resizeMode="contain"
                accessibilityLabel="Lagret signatur"
              />
            </View>
          ) : (
            <Pressable
              onPress={openSignPad}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-400 bg-white p-4 active:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900"
            >
              <Ionicons name="create-outline" size={20} color="#1d4ed8" />
              <Text className="text-sm font-semibold text-blue-700">Signér her</Text>
            </Pressable>
          )}
        </View>

        {/* 提交按钮 + 阻止提示 */}
        {!canSubmit && !submitting ? (
          <Text className="text-sm text-red-600">
            {!exteriorDone
              ? 'Ta utvendig bilde før innsending.'
              : !checklistComplete
                ? 'Fullfør alle sjekklister før innsending.'
                : 'Signatur er påkrevd for innsending.'}
          </Text>
        ) : null}

        <Pressable
          onPress={submit}
          disabled={!canSubmit}
          className={`h-12 flex-row items-center justify-center gap-2 rounded-xl px-4 ${
            canSubmit ? 'bg-brand active:bg-brand/90' : 'bg-brand/40'
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="#ffffff" />
              <Text className="text-base font-semibold text-white">Last opp</Text>
            </>
          )}
        </Pressable>

        {lastSubmitted ? (
          <Text className="text-center text-sm italic text-neutral-500">
            Sist innsendt: {lastSubmitted}
          </Text>
        ) : null}
      </ScrollView>

      <FullscreenModal
        visible={showSignPad}
        title="Signatur"
        onClose={() => setShowSignPad(false)}
        onConfirm={() => signRef.current?.readSignature()}
        footer={
          <Pressable
            onPress={() => signRef.current?.clearSignature()}
            className="h-11 flex-row items-center justify-center gap-2 rounded-xl border border-neutral-300 active:bg-neutral-100"
          >
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
            <Text className="text-sm font-semibold text-red-600">Tøm</Text>
          </Pressable>
        }
      >
        <SignatureScreen
          key={signPadKey}
          ref={signRef}
          dataURL={signature || undefined}
          onOK={handleSignatureOK}
          onEmpty={() =>
            Alert.alert('Signatur', 'Tegn signaturen din før du lagrer.')
          }
          descriptionText="Signér i feltet under"
          webStyle={SIGNATURE_WEB_STYLE}
          style={{ flex: 1, width: '100%', height: '100%' }}
          backgroundColor="#ffffff"
          penColor="#111827"
        />
      </FullscreenModal>
    </>
  );
}
