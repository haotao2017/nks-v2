/**
 * 项目列表。GetProjectList → 卡片列表(项目名 / 详情 / 检查日期)。
 * 头部含登出。点击卡片进入项目详情 Tabs。
 */
import * as React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { Link, useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui';
import {
  ScreenEmpty,
  ScreenError,
  ScreenLoading,
} from '@/components/screen-states';
import { getErrorMessage } from '@/lib/query';
import { deleteToken } from '@/lib/secure-token';
import {
  clearProjectListCache,
  useProjectList,
  type MobileProjectListItem,
} from '@/features/projects/api';
import { setUnauthenticated } from '@/store/auth-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

function ProjectCard({ item }: { item: MobileProjectListItem }) {
  const id = item.projectID ?? '';
  if (!id) return null;
  return (
    <Link
      href={{
        pathname: '/(app)/projects/[id]/(tabs)',
        params: { id },
      }}
      asChild
    >
      <Pressable>
        <Card>
          <Text className="text-base font-semibold text-neutral-900">
            {item.projectName ?? 'Uten navn'}
          </Text>
          {item.projectDetail ? (
            <Text className="mt-1 text-sm text-neutral-600">{item.projectDetail}</Text>
          ) : null}
          {item.inspectionDate ? (
            <Text className="mt-2 text-xs text-neutral-400">
              Kontrolldato: {item.inspectionDate}
            </Text>
          ) : null}
        </Card>
      </Pressable>
    </Link>
  );
}

export default function ProjectsScreen() {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const status = useAppSelector((s) => s.auth.status);
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError, error, refetch, isRefetching } = useProjectList();

  // 从后台切回 App / 再次进入列表时强制拉最新(后台可能刚指派检验员)。
  useFocusEffect(
    React.useCallback(() => {
      if (status !== 'authenticated') return;
      void refetch();
    }, [refetch, status]),
  );

  const onLogout = React.useCallback(async () => {
    await deleteToken();
    clearProjectListCache(queryClient);
    dispatch(setUnauthenticated());
  }, [dispatch, queryClient]);

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={['top', 'left', 'right']}>
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <View>
          <Text className="text-2xl font-bold text-neutral-900">Prosjekter</Text>
          {user?.fullName ? (
            <Text className="text-sm text-neutral-500">{user.fullName}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={onLogout}
          className="flex-row items-center gap-1 rounded-lg px-3 py-2 active:bg-neutral-200"
        >
          <Ionicons name="log-out-outline" size={20} color="#404040" />
          <Text className="text-sm font-medium text-neutral-700">Logg ut</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ScreenLoading embedded label="Laster prosjekter…" />
      ) : isError ? (
        <ScreenError
          embedded
          message={getErrorMessage(error)}
          onRetry={() => void refetch()}
        />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => String(item.projectID ?? i)}
          renderItem={({ item }) => <ProjectCard item={item} />}
          contentContainerClassName={
            data && data.length > 0 ? 'gap-3 px-4 pb-8' : 'flex-grow px-4'
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <ScreenEmpty
              embedded
              icon="briefcase-outline"
              title="Ingen prosjekter"
              hint="Prosjekter vises her når de er tildelt deg i admin (WF10)."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
