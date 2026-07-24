/**
 * 推送层 —— 把本地副本的未同步改动推给后端,成功后置同步标志去重。
 *
 * 均从 store 读「最新」state(而非 hook 闭包里的旧值),故可在事件回调里安全调用。
 * 离线或失败时不置同步标志,改动保留在本地(持久化),恢复联网后由 resyncPending 补传。
 */
import { store } from '@/store';
import {
  markChecklistItemSynced,
  markProjectSynced,
} from '@/store/active-project-slice';

import {
  buildChecklistUpdateForm,
  buildProjectUpdateForm,
  postChecklistUpdate,
  postProjectUpdate,
} from './api';
import { isLocalImageUri } from './image';
import { isOnlineNow } from './netinfo';

/** 后端常 HTTP 200 + { status:"100" } / { response:{ status:"100" } } 表示业务失败。 */
function assertMobileOk(res: unknown, fallback: string): void {
  if (res == null || typeof res !== 'object') return;
  const root = res as { status?: string; message?: string; response?: { status?: string; message?: string } };
  const status = root.response?.status ?? root.status;
  if (status != null && String(status) !== '200') {
    throw new Error(root.response?.message || root.message || fallback);
  }
}

/** 当前本地是否还有未推到后端的改动。 */
export function hasUnsyncedLocalChanges(): boolean {
  const detail = store.getState().activeProject.detail;
  if (!detail) return false;
  if (detail.projectDirty) return true;
  return detail.checklists.some((cl) => cl.checkItems.some((it) => !it.updated));
}

/** 推送项目级更新(描述/日期/外景图)。返回是否已推送成功。 */
export async function pushProjectUpdate(): Promise<boolean> {
  const detail = store.getState().activeProject.detail;
  if (!detail) return false;
  if (!(await isOnlineNow())) return false;

  const newImageUri =
    detail.exteriorImage && isLocalImageUri(detail.exteriorImage)
      ? detail.exteriorImage
      : null;

  const form = await buildProjectUpdateForm({
    projectID: detail.projectID,
    projectDate: detail.inspectionDate,
    projectDescription: detail.description,
    newImageUri,
  });
  const res = await postProjectUpdate(form);
  assertMobileOk(res, 'Kunne ikke lagre prosjektendringer');
  store.dispatch(markProjectSynced());
  return true;
}

/** 推送单个清单项(供清单屏复用)。返回是否已推送成功。 */
export async function pushChecklistItem(
  checklistId: string,
  checklistItemId: string,
): Promise<boolean> {
  const detail = store.getState().activeProject.detail;
  if (!detail) return false;
  if (!(await isOnlineNow())) return false;

  const item = detail.checklists
    .find((c) => c.checklistId === checklistId)
    ?.checkItems.find((i) => i.checklistItemId === checklistItemId);
  if (!item) return false;

  const form = await buildChecklistUpdateForm({
    projectID: detail.projectID,
    checklistId,
    checklistItemId,
    status: item.status,
    comment: item.comment,
    imageUris: item.itemImageUrls,
  });
  const res = await postChecklistUpdate(form);
  assertMobileOk(res, 'Kunne ikke lagre sjekklistepunkt');
  store.dispatch(markChecklistItemSynced({ checklistId, checklistItemId }));
  return true;
}

/** 恢复联网后补传:所有未同步的项目级改动 + 清单项。逐项吞错,尽力而为。 */
export async function resyncPending(): Promise<void> {
  const detail = store.getState().activeProject.detail;
  if (!detail) return;
  if (!(await isOnlineNow())) return;

  if (detail.projectDirty) {
    try {
      await pushProjectUpdate();
    } catch {
      /* 保留 dirty,下次再传 */
    }
  }
  for (const cl of detail.checklists) {
    for (const it of cl.checkItems) {
      if (it.updated) continue;
      try {
        await pushChecklistItem(cl.checklistId, it.checklistItemId);
      } catch {
        /* 保留 updated=false,下次再传 */
      }
    }
  }
}
