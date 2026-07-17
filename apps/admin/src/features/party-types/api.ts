'use client';

/**
 * PartyType 数据访问层 —— 照抄 features/contacts/api.ts 结构。
 *
 * 端点(来自 @nks/api-types 的 endpoints.partyType.*):
 *  - usePartyTypes       GET    /PartyType/GetAllPartyType         → 解包 res.multiPartyTypes
 *  - useCreatePartyType  POST   /PartyType/CreatePartyType (201)   → body { partyType }, 解包 res.partyType
 *  - useUpdatePartyType  PUT    /PartyType/UpdatePartyType         → body { partyType }, 解包 res.partyType
 *  - useDeletePartyType  DELETE /PartyType/DeletePartyType?PartyTypeID → MessageSuccessResponse{success,message}
 *
 * 另外提供 useWorkflowCategoryOptions:拉工作流类别列表供表单下拉。
 *
 * 注意:
 *  - 请求/响应根键是小写 `partyType`(PartyTypeRequestDto / PartyTypeResponseDto)。
 *  - GetAll 包装键为 `multiPartyTypes`(注意复数 s),用本地窄类型承接。
 *  - 删除失败为 HTTP 400 + {message},api-client 抛 NksApiError(message 取自响应体)。
 */
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type {
  PartyTypeDto,
  PartyTypeRequestDto,
  PartyTypeResponseDto,
  MessageSuccessResponse,
  WorkflowCategoryDto,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** GetAllPartyType 的响应形状:{ multiPartyTypes: PartyTypeDto[] }。 */
interface GetAllPartyTypeResponse {
  multiPartyTypes?: PartyTypeDto[];
}

/** GetAllWorkflowCategory 的响应形状:{ multiWorkflowCategory: WorkflowCategoryDto[] }。 */
interface GetAllWorkflowCategoryResponse {
  multiWorkflowCategory?: WorkflowCategoryDto[];
}

/** 统一的查询 key。 */
export const partyTypeKeys = {
  all: ['party-types'] as const,
  list: () => [...partyTypeKeys.all, 'list'] as const,
};

/** 参与方类型列表。解包 res.multiPartyTypes,空时回退 []。 */
export function usePartyTypes() {
  return useQuery({
    queryKey: partyTypeKeys.list(),
    queryFn: async () => {
      const res = await getApiClient().get<GetAllPartyTypeResponse>(
        endpoints.partyType.getAll.path,
      );
      return res?.multiPartyTypes ?? [];
    },
  });
}

/** 工作流类别下拉选项(供 PartyType 表单的 workflowCategoryID 选择)。 */
export function useWorkflowCategoryOptions() {
  return useQuery({
    queryKey: ['workflow-categories', 'options'],
    queryFn: async () => {
      const res = await getApiClient().get<GetAllWorkflowCategoryResponse>(
        endpoints.workflowCategory.getAll.path,
      );
      return res?.multiWorkflowCategory ?? [];
    },
  });
}

/** 创建参与方类型。body 根键小写 partyType;返回 res.partyType。 */
export function useCreatePartyType() {
  const { t } = useTranslation();
  return useApiMutation<PartyTypeDto | undefined, PartyTypeDto>({
    mutationFn: async (partyType) => {
      const body: PartyTypeRequestDto = { partyType };
      const res = await getApiClient().post<PartyTypeResponseDto>(
        endpoints.partyType.create.path,
        body,
      );
      return res?.partyType;
    },
    invalidateKeys: [partyTypeKeys.list()],
    successMessage: t('partyTypes.toast.created'),
    errorMessage: t('partyTypes.toast.createError'),
  });
}

/** 更新参与方类型。body 根键小写 partyType;返回 res.partyType。 */
export function useUpdatePartyType() {
  const { t } = useTranslation();
  return useApiMutation<PartyTypeDto | undefined, PartyTypeDto>({
    mutationFn: async (partyType) => {
      const body: PartyTypeRequestDto = { partyType };
      const res = await getApiClient().put<PartyTypeResponseDto>(
        endpoints.partyType.update.path,
        body,
      );
      return res?.partyType;
    },
    invalidateKeys: [partyTypeKeys.list()],
    successMessage: t('partyTypes.toast.updated'),
    errorMessage: t('partyTypes.toast.updateError'),
  });
}

/**
 * 删除参与方类型。query 参数 PartyTypeID。
 * 后端返回 MessageSuccessResponse{success,message};失败为 HTTP 400(api-client 抛错),
 * 防御性地再判断 success===false。成功用后端 message 提示。
 */
export function useDeletePartyType() {
  const { t } = useTranslation();
  return useApiMutation<MessageSuccessResponse, number>({
    mutationFn: async (partyTypeId) => {
      const res = await getApiClient().delete<MessageSuccessResponse>(
        endpoints.partyType.delete.path,
        { params: { PartyTypeID: partyTypeId } },
      );
      if (res?.success === false) {
        throw new Error(res.message || t('partyTypes.toast.deleteBlocked'));
      }
      return res;
    },
    invalidateKeys: [partyTypeKeys.list()],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(data?.message || t('partyTypes.toast.deleted'));
    },
  });
}
