'use client';

/**
 * ChecklistTemplate 数据访问层 —— 照抄 features/workflow-categories/api.ts,
 * 含「模板」+「子项」两组 hooks(与 WorkflowCategory 的 分类 + 步骤 同构)。
 *
 * 模板端点(endpoints.checklistTemplate.*):
 *  - useChecklistTemplates    GET    /GetAllChecklistTemplate?pageNo=0 → 解包 res.multiChecklistTemplate
 *  - useChecklistTemplate     GET    /GetChecklistTemplate?ChecklistTemplateID → 解包 res.checklistTemplate(含子项)
 *  - useCreateChecklistTemplate POST /CreatChecklistTemplateWithItems  → body { checklistTemplate }(含子项数组), 解包 res.checklistTemplate
 *  - useUpdateChecklistTemplate PUT  /UpdateChecklistTemplate          → body { checklistTemplate }, 解包 res.checklistTemplate
 *  - useDeleteChecklistTemplate DELETE /DeleteChecklistTemplate?ChecklistTemplateID → ResponseDto { message, success }
 *
 * 子项端点:
 *  - useCreateChecklistItem POST /CreatChecklistItemTempByChecklistTempId → body { checklistItemTemplate }(用 checklistId 关联模板)
 *  - useUpdateChecklistItem PUT  /UpdateSingleChecklistItemTemp          → body { checklistItemTemplate }
 *  - useDeleteChecklistItem DELETE /DeleteSingleChecklistItemTemp?ChecklistItemId → ResponseDto { message, success }
 *
 * 注意:
 *  - 请求体根键小写(checklistTemplate / checklistItemTemplate),对齐后端 Wrapper DTO(无 @JsonProperty 覆盖)。
 *  - GetAll 用 pageNo=0 取全量,交由 DataTable 客户端搜索/分页(参考 Service 模块约定)。
 *  - GetAll 的包装键 multiChecklistTemplate 在 @nks/api-types 无对应接口,这里用本地窄类型承接,不改契约包。
 *  - 子项无独立列表端点:子项来自 GetChecklistTemplate 返回的 checklistItemTemplateList,
 *    因此子项写操作同时失效「模板详情」(重拉子项)与「模板列表」(刷新计数)。
 *  - 删除失败后端返回 HTTP 400 + { success:false, message };NksClient 抛成 NksApiError,
 *    message 取自响应体,由 useApiMutation 的 onError 统一 toast。此处再防御式判断 success===false。
 */
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  ChecklistTemplateDto,
  ChecklistItemTemplateDto,
  ChecklistTemplateWrapperDto,
  ChecklistItemTemplateWrapperDto,
  MessageSuccessResponse,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** GetAllChecklistTemplate 的响应形状:{ multiChecklistTemplate: ChecklistTemplateDto[] }。 */
interface GetAllChecklistTemplateResponse {
  multiChecklistTemplate?: ChecklistTemplateDto[];
}

/** 统一查询 key —— 模板列表 + 每个模板的详情(含子项)。 */
export const checklistTemplateKeys = {
  all: ['checklist-templates'] as const,
  list: () => [...checklistTemplateKeys.all, 'list'] as const,
  detail: (templateId: number) =>
    [...checklistTemplateKeys.all, 'detail', templateId] as const,
};

// ── 模板 ────────────────────────────────────────────────────────────────

/** 模板列表。pageNo=0 取全量;解包 res.multiChecklistTemplate,空时回退 []。 */
export function useChecklistTemplates() {
  return useQuery({
    queryKey: checklistTemplateKeys.list(),
    queryFn: async () => {
      const res = await getApiClient().get<GetAllChecklistTemplateResponse>(
        endpoints.checklistTemplate.getAll.path,
        { params: { pageNo: 0 } },
      );
      return res?.multiChecklistTemplate ?? [];
    },
  });
}

/** 单个模板详情(含 checklistItemTemplateList)。templateId 为空时禁用查询。 */
export function useChecklistTemplate(templateId: number | null) {
  return useQuery({
    queryKey: checklistTemplateKeys.detail(templateId ?? 0),
    enabled: templateId != null,
    queryFn: async () => {
      const res = await getApiClient().get<ChecklistTemplateWrapperDto>(
        endpoints.checklistTemplate.get.path,
        { params: { ChecklistTemplateID: templateId as number } },
      );
      return res?.checklistTemplate ?? null;
    },
  });
}

/** 创建模板(可含子项)。body 根键小写 checklistTemplate;返回 res.checklistTemplate。 */
export function useCreateChecklistTemplate() {
  return useApiMutation<ChecklistTemplateDto | undefined, ChecklistTemplateDto>({
    mutationFn: async (checklistTemplate) => {
      const body: ChecklistTemplateWrapperDto = { checklistTemplate };
      const res = await getApiClient().post<ChecklistTemplateWrapperDto>(
        endpoints.checklistTemplate.createWithItems.path,
        body,
      );
      return res?.checklistTemplate;
    },
    invalidateKeys: [checklistTemplateKeys.list()],
    successMessage: 'Sjekkliste opprettet',
    errorMessage: 'Kunne ikke opprette sjekkliste',
  });
}

/** 更新模板(仅 title)。body 根键小写 checklistTemplate;返回 res.checklistTemplate。 */
export function useUpdateChecklistTemplate() {
  return useApiMutation<ChecklistTemplateDto | undefined, ChecklistTemplateDto>({
    mutationFn: async (checklistTemplate) => {
      const body: ChecklistTemplateWrapperDto = { checklistTemplate };
      const res = await getApiClient().put<ChecklistTemplateWrapperDto>(
        endpoints.checklistTemplate.update.path,
        body,
      );
      return res?.checklistTemplate;
    },
    invalidateKeys: [checklistTemplateKeys.list()],
    successMessage: 'Sjekkliste oppdatert',
    errorMessage: 'Kunne ikke oppdatere sjekkliste',
  });
}

/**
 * 删除模板。query 参数 ChecklistTemplateID。
 * 后端软失败(success:false / HTTP 400)时抛错,由 onError 用后端 message 统一 toast。
 */
export function useDeleteChecklistTemplate() {
  return useApiMutation<MessageSuccessResponse, number>({
    mutationFn: async (templateId) => {
      const res = await getApiClient().delete<MessageSuccessResponse>(
        endpoints.checklistTemplate.delete.path,
        { params: { ChecklistTemplateID: templateId } },
      );
      if (res?.success === false) {
        throw new Error(res.message || 'Sjekklisten kan ikke slettes');
      }
      return res;
    },
    invalidateKeys: [checklistTemplateKeys.list()],
    successMessage: false, // 用后端返回的 message 提示
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(data?.message || 'Sjekkliste slettet');
    },
  });
}

// ── 子项 ────────────────────────────────────────────────────────────────

/** 创建子项。body 根键小写 checklistItemTemplate;checklistId 关联模板。失效模板详情 + 列表。 */
export function useCreateChecklistItem(templateId: number) {
  return useApiMutation<ChecklistItemTemplateDto | undefined, ChecklistItemTemplateDto>({
    mutationFn: async (checklistItemTemplate) => {
      const body: ChecklistItemTemplateWrapperDto = { checklistItemTemplate };
      const res = await getApiClient().post<ChecklistItemTemplateWrapperDto>(
        endpoints.checklistTemplate.createItemByTemplateId.path,
        body,
      );
      return res?.checklistItemTemplate;
    },
    invalidateKeys: [checklistTemplateKeys.detail(templateId), checklistTemplateKeys.list()],
    successMessage: 'Sjekkpunkt opprettet',
    errorMessage: 'Kunne ikke opprette sjekkpunkt',
  });
}

/** 更新子项。body 根键小写 checklistItemTemplate。 */
export function useUpdateChecklistItem(templateId: number) {
  return useApiMutation<ChecklistItemTemplateDto | undefined, ChecklistItemTemplateDto>({
    mutationFn: async (checklistItemTemplate) => {
      const body: ChecklistItemTemplateWrapperDto = { checklistItemTemplate };
      const res = await getApiClient().put<ChecklistItemTemplateWrapperDto>(
        endpoints.checklistTemplate.updateSingleItem.path,
        body,
      );
      return res?.checklistItemTemplate;
    },
    invalidateKeys: [checklistTemplateKeys.detail(templateId), checklistTemplateKeys.list()],
    successMessage: 'Sjekkpunkt oppdatert',
    errorMessage: 'Kunne ikke oppdatere sjekkpunkt',
  });
}

/** 删除子项。query 参数 ChecklistItemId。软失败同模板删除处理。 */
export function useDeleteChecklistItem(templateId: number) {
  return useApiMutation<MessageSuccessResponse, number>({
    mutationFn: async (itemId) => {
      const res = await getApiClient().delete<MessageSuccessResponse>(
        endpoints.checklistTemplate.deleteSingleItem.path,
        { params: { ChecklistItemId: itemId } },
      );
      if (res?.success === false) {
        throw new Error(res.message || 'Sjekkpunktet kan ikke slettes');
      }
      return res;
    },
    invalidateKeys: [checklistTemplateKeys.detail(templateId), checklistTemplateKeys.list()],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(data?.message || 'Sjekkpunkt slettet');
    },
  });
}
