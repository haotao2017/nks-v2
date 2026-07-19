'use client';

/**
 * 项目检查清单(Project Checklist)数据访问层 —— 对应原系统 Wf1S6-opprett-sjekklister。
 *
 * 「清单」+「清单项」两组 hooks(与 features/checklists 的 模板 + 子项 同构),
 * 复用 api-client 单例 + endpoints 目录 + useApiMutation(自动 toast + 失效重拉)。
 *
 * 清单端点(endpoints.project.*):
 *  - useProjectChecklists      GET    /GetAllProjectChecklists?ProjectID       → 解包 res.multiProjectChecklist(SimpleDto[],不含项数)
 *  - useProjectChecklist       GET    /GetSingleProjectChecklist?ChecklistID   → 解包 res.projectChecklist(DetailDto,含 projectChecklistItems)
 *  - useCreateProjectChecklist POST   /CreateSingleProjectChecklist            → body { projectChecklist:{ projectId, checklistName, projectChecklistItems:[{title}] } }
 *  - useUpdateProjectChecklist POST   /UpdateSingleProjectChecklist            → body { projectChecklist:{ id, projectId, checklistName } }(仅改名,项留空避免后端连带更新)
 *  - useDeleteProjectChecklist DELETE /DeleteSingleProjectChecklist?ChecklistId → RequestResponse { message, success }
 *
 * 清单项端点:
 *  - useCreateProjectChecklistItem POST   /CreatSingleProjectChecklistItem     → body { projectChecklistItems:{ checklistId, title, sortOrder } }
 *  - useUpdateProjectChecklistItem PUT    /UpdateSingleProjectChecklistItem    → body { projectChecklistItems:{ id, checklistId, title, sortOrder } }
 *  - useDeleteProjectChecklistItem DELETE /DeleteSingleProjectChecklistItem?ChecklistItemId → RequestResponse
 *
 * 模板(用于「从模板新建」下拉):
 *  - useProjectChecklistTemplates GET /ChecklistTemplate/GetAllChecklistTemplate?pageNo=0 → 解包 res.multiChecklistTemplate
 *
 * 注意:
 *  - 后端 Jackson 开启 ACCEPT_CASE_INSENSITIVE_PROPERTIES,请求体统一用小写 camelCase 键(对齐 DTO 字段名)。
 *  - GetAll 返回的 SimpleDto 里 projectChecklistItems 恒为 null,列表拿不到项数;
 *    项数需按每条清单单独 GetSingle(见 useProjectChecklistDetails,复用 detail 缓存,打开项弹窗即命中)。
 *  - GetSingle 返回的 projectChecklistItems 是 ChecklistItemSimpleDto(仅 id/checklistId/title,无 sortOrder);
 *    sortOrder 可随写请求上送(ChecklistItemDto 承接),但回读详情不带回,故仅用于控制后端排序,不在 UI 回显真实值。
 *  - 列表查询复用 projectKeys.checklists(projectId)(来自同域 ./api),与页面只读面板共享缓存,写操作失效即可同步刷新。
 *  - 删除软失败(HTTP 200 + success:false)时抛错,交由 onError/onSuccess 用后端 message 统一 toast。
 */
import { useQueries, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type {
  ProjectChecklistSimpleDto,
  ProjectChecklistDetailDto,
  ChecklistTemplateDto,
  ChecklistItemDto,
  RequestResponse,
  WrapperMultiProjectChecklistSimpleDto,
  WrapperProjectChecklistDetailDto,
  WrapperProjectChecklistDto,
  WrapperProjectChecklistItemDto,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

import { projectKeys } from './api';

/** GetAllChecklistTemplate 的响应形状:{ multiChecklistTemplate: ChecklistTemplateDto[] }。 */
interface GetAllChecklistTemplateResponse {
  multiChecklistTemplate?: ChecklistTemplateDto[];
}

/** 项目检查清单的查询 key。列表沿用 projectKeys.checklists,详情独立命名空间。 */
export const projectChecklistKeys = {
  detail: (checklistId: number) => ['project-checklist', 'detail', checklistId] as const,
};

/** 拉取单条清单详情(含 projectChecklistItems)。供 useProjectChecklist 与 useProjectChecklistDetails 复用。 */
async function fetchProjectChecklist(
  checklistId: number,
): Promise<ProjectChecklistDetailDto | null> {
  const res = await getApiClient().get<WrapperProjectChecklistDetailDto>(
    endpoints.project.getSingleChecklist.path,
    { params: { ChecklistID: checklistId } },
  );
  return res?.projectChecklist ?? null;
}

// ── 清单查询 ────────────────────────────────────────────────────────────

/** 项目清单列表。解包 res.multiProjectChecklist,空时回退 []。 */
export function useProjectChecklists(projectId: number) {
  return useQuery({
    queryKey: projectKeys.checklists(projectId),
    queryFn: async () => {
      const res = await getApiClient().get<WrapperMultiProjectChecklistSimpleDto>(
        endpoints.project.getAllChecklists.path,
        { params: { ProjectID: projectId } },
      );
      return res?.multiProjectChecklist ?? [];
    },
  });
}

/** 单条清单详情(含清单项)。checklistId 为空时禁用查询。 */
export function useProjectChecklist(checklistId: number | null) {
  return useQuery({
    queryKey: projectChecklistKeys.detail(checklistId ?? 0),
    enabled: checklistId != null,
    queryFn: () => fetchProjectChecklist(checklistId as number),
  });
}

/**
 * 批量拉取多条清单详情 —— 仅用于在列表展示每条清单的项数。
 * 与 useProjectChecklist 共用 detail 缓存,故打开某条清单的项弹窗时无需再请求。
 * 注:这是 N+1 GET(每条清单一次),项目内清单数通常很少,可接受。
 */
export function useProjectChecklistDetails(checklistIds: number[]) {
  return useQueries({
    queries: checklistIds.map((id) => ({
      queryKey: projectChecklistKeys.detail(id),
      queryFn: () => fetchProjectChecklist(id),
    })),
  });
}

/** 模板列表(用于「从模板新建」下拉)。pageNo=0 取全量;解包 res.multiChecklistTemplate。 */
export function useProjectChecklistTemplates() {
  return useQuery({
    queryKey: ['project-checklist', 'templates'] as const,
    queryFn: async () => {
      const res = await getApiClient().get<GetAllChecklistTemplateResponse>(
        endpoints.checklistTemplate.getAll.path,
        { params: { pageNo: 0 } },
      );
      return res?.multiChecklistTemplate ?? [];
    },
  });
}

// ── 清单写操作 ──────────────────────────────────────────────────────────

/** 创建清单(可含初始项,来自模板或空)。body 根键 projectChecklist;返回 res.projectChecklist。 */
export function useCreateProjectChecklist(projectId: number) {
  const { t } = useTranslation();
  return useApiMutation<
    ProjectChecklistDetailDto | undefined,
    { checklistName: string; items?: { title: string }[] }
  >({
    mutationFn: async ({ checklistName, items }) => {
      const body: WrapperProjectChecklistDto = {
        projectChecklist: {
          projectId,
          checklistName,
          projectChecklistItems: (items ?? []).map((i) => ({ title: i.title })),
        },
      };
      const res = await getApiClient().post<WrapperProjectChecklistDetailDto>(
        endpoints.project.createSingleChecklist.path,
        body,
      );
      return res?.projectChecklist;
    },
    invalidateKeys: [projectKeys.checklists(projectId)],
    successMessage: t('checklistPanel.toast.created'),
    errorMessage: t('checklistPanel.toast.createError'),
  });
}

/** 更新清单(仅改名)。body 只带 id/projectId/checklistName,项留空以跳过后端连带更新。 */
export function useUpdateProjectChecklist(projectId: number) {
  const { t } = useTranslation();
  return useApiMutation<
    ProjectChecklistDetailDto | undefined,
    { id: number; checklistName: string }
  >({
    mutationFn: async ({ id, checklistName }) => {
      const body: WrapperProjectChecklistDto = {
        projectChecklist: { id, projectId, checklistName },
      };
      const res = await getApiClient().post<WrapperProjectChecklistDetailDto>(
        endpoints.project.updateSingleChecklist.path,
        body,
      );
      return res?.projectChecklist;
    },
    invalidateKeys: [projectKeys.checklists(projectId)],
    successMessage: t('checklistPanel.toast.updated'),
    errorMessage: t('checklistPanel.toast.updateError'),
  });
}

/** 删除清单。query 参数 ChecklistId。软失败抛错,由 onError 统一 toast。 */
export function useDeleteProjectChecklist(projectId: number) {
  const { t } = useTranslation();
  return useApiMutation<RequestResponse, number>({
    mutationFn: async (checklistId) => {
      const res = await getApiClient().delete<RequestResponse>(
        endpoints.project.deleteSingleChecklist.path,
        { params: { ChecklistId: checklistId } },
      );
      if (res?.success === false) {
        throw new Error(res.message || t('checklistPanel.toast.deleteBlocked'));
      }
      return res;
    },
    invalidateKeys: [projectKeys.checklists(projectId)],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(t('checklistPanel.toast.deleted'));
    },
  });
}

// ── 清单项写操作 ────────────────────────────────────────────────────────

/** 创建清单项。body 根键 projectChecklistItems;失效该清单详情 + 列表(刷新项数)。 */
export function useCreateProjectChecklistItem(projectId: number, checklistId: number) {
  const { t } = useTranslation();
  return useApiMutation<
    ChecklistItemDto | undefined,
    { title: string; sortOrder?: number }
  >({
    mutationFn: async ({ title, sortOrder }) => {
      const body: WrapperProjectChecklistItemDto = {
        projectChecklistItems: { checklistId, title, sortOrder },
      };
      const res = await getApiClient().post<WrapperProjectChecklistItemDto>(
        endpoints.project.createSingleChecklistItem.path,
        body,
      );
      return res?.projectChecklistItems;
    },
    invalidateKeys: [projectChecklistKeys.detail(checklistId), projectKeys.checklists(projectId)],
    successMessage: t('checklistPanel.toast.itemCreated'),
    errorMessage: t('checklistPanel.toast.itemCreateError'),
  });
}

/** 更新清单项。body 根键 projectChecklistItems(含 id)。 */
export function useUpdateProjectChecklistItem(projectId: number, checklistId: number) {
  const { t } = useTranslation();
  return useApiMutation<
    ChecklistItemDto | undefined,
    { id: number; title: string; sortOrder?: number }
  >({
    mutationFn: async ({ id, title, sortOrder }) => {
      const body: WrapperProjectChecklistItemDto = {
        projectChecklistItems: { id, checklistId, title, sortOrder },
      };
      const res = await getApiClient().put<WrapperProjectChecklistItemDto>(
        endpoints.project.updateSingleChecklistItem.path,
        body,
      );
      return res?.projectChecklistItems;
    },
    invalidateKeys: [projectChecklistKeys.detail(checklistId), projectKeys.checklists(projectId)],
    successMessage: t('checklistPanel.toast.itemUpdated'),
    errorMessage: t('checklistPanel.toast.itemUpdateError'),
  });
}

/** 删除清单项。query 参数 ChecklistItemId。软失败同清单删除处理。 */
export function useDeleteProjectChecklistItem(projectId: number, checklistId: number) {
  const { t } = useTranslation();
  return useApiMutation<RequestResponse, number>({
    mutationFn: async (itemId) => {
      const res = await getApiClient().delete<RequestResponse>(
        endpoints.project.deleteSingleChecklistItem.path,
        { params: { ChecklistItemId: itemId } },
      );
      if (res?.success === false) {
        throw new Error(res.message || t('checklistPanel.toast.itemDeleteBlocked'));
      }
      return res;
    },
    invalidateKeys: [projectChecklistKeys.detail(checklistId), projectKeys.checklists(projectId)],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(t('checklistPanel.toast.itemDeleted'));
    },
  });
}

export type { ProjectChecklistSimpleDto, ProjectChecklistDetailDto };
