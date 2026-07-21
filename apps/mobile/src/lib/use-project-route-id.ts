/**
 * 解析当前项目详情路由的 [id]。
 * Tabs 子屏上 useLocalSearchParams 偶发拿不到父级动态段,需合并 global + 本地 activeProject。
 */
import { useGlobalSearchParams, useLocalSearchParams } from 'expo-router';

import { normalizeRouteParam } from '@/lib/route-params';
import { useAppSelector } from '@/store/hooks';

export function useProjectRouteId(): string | undefined {
  const local = useLocalSearchParams<{ id?: string | string[] }>();
  const global = useGlobalSearchParams<{ id?: string | string[] }>();
  const storedId = useAppSelector((s) => s.activeProject.projectId);
  const detailId = useAppSelector((s) => s.activeProject.detail?.projectID);

  return (
    normalizeRouteParam(local.id) ??
    normalizeRouteParam(global.id) ??
    (typeof storedId === 'string' && storedId.trim() ? storedId.trim() : undefined) ??
    (typeof detailId === 'string' && detailId.trim() ? detailId.trim() : undefined)
  );
}
