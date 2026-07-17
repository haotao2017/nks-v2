/**
 * 项目列表。GetProjectList → 卡片列表(项目名 / 详情 / 检查日期)。
 * 头部含登出。点击卡片进入项目详情 Tabs。
 */
import * as React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, ErrorText } from '@/components/ui';
import { getErrorMessage } from '@/lib/query';
import { deleteToken } from '@/lib/secure-token';
import {
  useProjectList,
  type MobileProjectListItem,
} from '@/features/projects/api';
import { setUnauthenticated } from '@/store/auth-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

function ProjectCard({ item }: { item: MobileProjectListItem }) {
  const id = item.projectID ?? '';
  return (
    <Link href={`/(app)/projects/${id}`} asChild>
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
  const user = useAppSelector((s) => s.auth.user);
  const { data, isLoading, isError, error, refetch, isRefetching } = useProjectList();

  const onLogout = React.useCallback(async () => {
    await deleteToken();
    dispatch(setUnauthenticated());
  }, [dispatch]);

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
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-6">
          <ErrorText>{getErrorMessage(error)}</ErrorText>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => String(item.projectID ?? i)}
          renderItem={({ item }) => <ProjectCard item={item} />}
          contentContainerClassName="gap-3 px-4 pb-8"
          ItemSeparatorComponent={null}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Text className="text-neutral-400">Ingen prosjekter</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
