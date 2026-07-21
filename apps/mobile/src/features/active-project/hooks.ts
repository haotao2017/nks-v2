/**
 * activeProject 对外 hooks（Info / Exterior / 后续 Sjekklister / Submit 复用）。
 *
 *  - useActiveProject()            读当前本地副本 + 状态。
 *  - useLoadActiveProject(id)      挂载即加载并组装(离线且有本地副本则直接用)。
 *  - useSyncProjectUpdate()        项目级「本地写 + 尝试同步」(Info/Exterior 用)。
 *  - useUpdateChecklistItem()      清单项级「本地写 + 尝试同步」(通用封装)。
 *  - useOnlineResync()             订阅恢复联网 → 补传未同步改动(挂在项目壳布局)。
 */
import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getErrorMessage } from '@/lib/query';
import { normalizeRouteParam, type RouteParam } from '@/lib/route-params';
import { store } from '@/store';
import {
  projectKeys,
  type MobileProjectListItem,
} from '@/features/projects/api';
import {
  beginLoad,
  loadFailed,
  loadSucceeded,
  patchChecklistItem,
  patchProjectFields,
  type PatchChecklistItemPayload,
  type PatchProjectFieldsPayload,
} from '@/store/active-project-slice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { assembleActiveProject } from './api';
import { isOnlineNow, subscribeToOnline, useIsOnline } from './netinfo';
import { pushChecklistItem, pushProjectUpdate, resyncPending } from './sync';

/** 同一项目并发加载去重(多 Tab 同时 mount 时只发一次请求)。 */
const inflightLoads = new Map<string, Promise<void>>();

/** 读当前打开项目的本地副本 + 加载状态。 */
export function useActiveProject() {
  return useAppSelector((s) => s.activeProject);
}

/** 挂载即加载并组装项目;返回 state + online + reload。 */
export function useLoadActiveProject(routeId: RouteParam) {
  const projectId = normalizeRouteParam(routeId);
  const dispatch = useAppDispatch();
  const qc = useQueryClient();
  const online = useIsOnline();
  const state = useAppSelector((s) => s.activeProject);

  const load = useCallback(async () => {
    if (!projectId) {
      dispatch(loadFailed('Mangler prosjekt-ID'));
      return;
    }

    // 读「最新」state(避免 useCallback 闭包旧值;多个 Tab 都会调用本 load)。
    const current = store.getState().activeProject;
    const hasLocal = current.detail?.projectID === projectId;

    // 已有同一项目本地副本:直接复用(persist 回灌后 status 可能是 idle)。
    if (hasLocal && current.detail) {
      if (current.status !== 'ready') {
        dispatch(loadSucceeded(current.detail));
      }
      return;
    }

    const existing = inflightLoads.get(projectId);
    if (existing) {
      await existing;
      return;
    }

    const task = (async () => {
      const latest = store.getState().activeProject;
      const local = latest.detail?.projectID === projectId;

      const hasUnsynced =
        local &&
        Boolean(
          latest.detail?.projectDirty ||
            latest.detail?.checklists.some((cl) =>
              cl.checkItems.some((it) => it.updated === false),
            ),
        );

      // 冷启动后 status=idle 但 persist 有本地脏数据:先恢复 ready，勿用服务端覆盖。
      if (hasUnsynced && latest.detail) {
        dispatch(loadSucceeded(latest.detail));
        if (await isOnlineNow()) {
          try {
            await resyncPending();
          } catch {
            /* 补传失败保留本地 */
          }
        }
        return;
      }

      if (!(await isOnlineNow())) {
        if (local && latest.detail) {
          dispatch(loadSucceeded(latest.detail));
        } else {
          dispatch(beginLoad(projectId));
          dispatch(loadFailed('Ingen nettverkstilkobling'));
        }
        return;
      }

      dispatch(beginLoad(projectId));
      try {
        const list = qc.getQueryData<MobileProjectListItem[]>(projectKeys.list());
        const seed = list?.find((p) => String(p.projectID) === projectId);
        const detail = await assembleActiveProject(projectId, seed);
        dispatch(loadSucceeded(detail));
      } catch (e) {
        const after = store.getState().activeProject;
        if (after.detail?.projectID !== projectId) {
          dispatch(loadFailed(getErrorMessage(e)));
        }
      }
    })();

    inflightLoads.set(projectId, task);
    try {
      await task;
    } finally {
      if (inflightLoads.get(projectId) === task) {
        inflightLoads.delete(projectId);
      }
    }
  }, [dispatch, qc, projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { ...state, online, reload: load, projectId };
}

/** 项目级「本地写 + 尝试同步」。离线/失败保留 dirty,联网后由补传兜底。 */
export function useSyncProjectUpdate() {
  const dispatch = useAppDispatch();

  const updateProject = useCallback(
    async (patch: PatchProjectFieldsPayload) => {
      dispatch(patchProjectFields(patch)); // 先本地写 + 持久化 + 置 dirty
      try {
        await pushProjectUpdate();
      } catch {
        /* 离线/失败:改动已在本地,联网后补传 */
      }
    },
    [dispatch],
  );

  return { updateProject };
}

/** 清单项级「本地写 + 尝试同步」(通用封装,供 Sjekklister 屏复用)。 */
export function useUpdateChecklistItem() {
  const dispatch = useAppDispatch();

  const update = useCallback(
    async (
      checklistId: string,
      checklistItemId: string,
      patch: PatchChecklistItemPayload['patch'],
    ) => {
      dispatch(patchChecklistItem({ checklistId, checklistItemId, patch }));
      try {
        await pushChecklistItem(checklistId, checklistItemId);
      } catch {
        /* 离线/失败:改动已在本地,联网后补传 */
      }
    },
    [dispatch],
  );

  return { update };
}

/** 订阅恢复联网 → 自动补传未同步改动。挂在项目详情壳布局。 */
export function useOnlineResync() {
  useEffect(() => {
    const unsub = subscribeToOnline(() => {
      void resyncPending();
    });
    return () => unsub();
  }, []);
}
