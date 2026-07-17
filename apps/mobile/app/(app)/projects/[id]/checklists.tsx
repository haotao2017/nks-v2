/**
 * Sjekklister 目录屏（Tab「Sjekklister」）—— 参考旧 AllCheckLists.tsx。
 *  - 用离线层已加载的 detail.checklists 渲染清单卡片列表。
 *  - 每卡片显示清单名 + 完成进度(已填项/总项,按各项 status 是否已填算)
 *    + 未同步角标(任一 item.updated===false)。
 *  - 点卡片进入单清单填写 [id]/checklist/[checklistId]。
 * 只读展示,不触发写;数据源为 useLoadActiveProject(离线优先)。
 */
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Link, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useLoadActiveProject } from '@/features/active-project/hooks';
import type { LocalChecklist } from '@/store/active-project-slice';

/** 已填项数(status 非空即视为已填,照旧客户端)。 */
function filledCount(cl: LocalChecklist): number {
  return cl.checkItems.filter((i) => i.status !== null && i.status !== undefined)
    .length;
}

/** 是否有未同步改动(任一 item.updated===false)。 */
function hasPending(cl: LocalChecklist): boolean {
  return cl.checkItems.some((i) => !i.updated);
}

function ChecklistCard({
  projectId,
  checklist,
}: {
  projectId: string;
  checklist: LocalChecklist;
}) {
  const total = checklist.checkItems.length;
  const filled = filledCount(checklist);
  const complete = total > 0 && filled === total;
  const pending = hasPending(checklist);

  return (
    <Link
      href={`/(app)/projects/${projectId}/checklist/${checklist.checklistId}`}
      asChild
    >
      <Pressable className="rounded-2xl border border-neutral-200 bg-white p-4 active:bg-neutral-100 dark:border-neutral-800 dark:bg-neutral-900 dark:active:bg-neutral-800">
        <View className="flex-row items-center gap-3">
          <Ionicons
            name={complete ? 'checkbox' : 'square-outline'}
            size={22}
            color={complete ? '#16a34a' : '#737373'}
          />
          <View className="flex-1">
            <Text
              className="text-base font-semibold text-neutral-900 dark:text-neutral-100"
              numberOfLines={2}
            >
              {checklist.checklistName || 'Sjekkliste'}
            </Text>
            <Text className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">
              {filled}/{total} utfylt
              {pending ? ' · venter på synk' : ''}
            </Text>
          </View>
          {pending ? (
            <View className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          ) : null}
          <Ionicons name="chevron-forward" size={20} color="#a3a3a3" />
        </View>
      </Pressable>
    </Link>
  );
}

export default function ChecklistsTab() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, status, error } = useLoadActiveProject(id);

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

  return (
    <FlatList
      className="flex-1 bg-neutral-50 dark:bg-neutral-950"
      data={detail.checklists}
      keyExtractor={(c) => c.checklistId}
      renderItem={({ item }) => (
        <ChecklistCard projectId={id} checklist={item} />
      )}
      contentContainerClassName="gap-3 p-4 pb-8"
      ListEmptyComponent={
        <View className="items-center justify-center py-20">
          <Text className="text-neutral-400">Ingen sjekklister</Text>
        </View>
      }
    />
  );
}
