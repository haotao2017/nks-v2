'use client';

/**
 * DocType 数据访问层 —— 照抄 features/contacts/api.ts 的结构。
 *
 * 端点(来自 @nks/api-types 的 endpoints.docType.*):
 *  - useDocTypes       GET    /DocType/GetAllDocType     → 解包 res.multiDocTypes
 *  - useCreateDocType  POST   /DocType/CreatDocType      → body { docType }, 解包 res.docType
 *  - useUpdateDocType  PUT    /DocType/UpdateDocType     → body { docType }, 解包 res.docType
 *  - useDeleteDocType  DELETE /DocType/DeleteDocType?DocTypeID → RequestResponse
 *
 * 注意:
 *  - 后端包装/接收的是 entity `DocType`(字段 id/partyTypeId/docName/isRequired),
 *    请求体根键小写 `docType`(WrapperDocType.getDocType)。
 *  - 删除失败时后端返回 HTTP 400,body 为 RequestResponse(含顶层 message),
 *    api-client 会据此抛出 NksApiError(message = 后端 message),
 *    交由 useApiMutation.onError 统一 toast。
 *  - query 参数名为 PascalCase `DocTypeID`(对齐后端 @RequestParam)。
 */
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  DocType,
  WrapperDocType,
  WrapperMultiDocTypes,
  RequestResponse,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** 统一的查询 key —— 复用于失效重拉。 */
export const docTypeKeys = {
  all: ['doc-types'] as const,
  list: () => [...docTypeKeys.all, 'list'] as const,
};

/** 文档类型列表。解包 res.multiDocTypes,空时回退 []。 */
export function useDocTypes() {
  return useQuery({
    queryKey: docTypeKeys.list(),
    queryFn: async () => {
      const res = await getApiClient().get<WrapperMultiDocTypes>(
        endpoints.docType.getAll.path,
      );
      return res?.multiDocTypes ?? [];
    },
  });
}

/** 创建文档类型。body 根键小写 docType;返回 res.docType。 */
export function useCreateDocType() {
  return useApiMutation<DocType | undefined, DocType>({
    mutationFn: async (docType) => {
      const body: WrapperDocType = { docType };
      const res = await getApiClient().post<WrapperDocType>(
        endpoints.docType.create.path,
        body,
      );
      return res?.docType;
    },
    invalidateKeys: [docTypeKeys.list()],
    successMessage: 'Dokumenttype opprettet',
    errorMessage: 'Kunne ikke opprette dokumenttype',
  });
}

/** 更新文档类型。body 根键小写 docType;返回 res.docType。 */
export function useUpdateDocType() {
  return useApiMutation<DocType | undefined, DocType>({
    mutationFn: async (docType) => {
      const body: WrapperDocType = { docType };
      const res = await getApiClient().put<WrapperDocType>(
        endpoints.docType.update.path,
        body,
      );
      return res?.docType;
    },
    invalidateKeys: [docTypeKeys.list()],
    successMessage: 'Dokumenttype oppdatert',
    errorMessage: 'Kunne ikke oppdatere dokumenttype',
  });
}

/**
 * 删除文档类型。query 参数 DocTypeID。
 * 后端成功返回 RequestResponse(HTTP 200),失败返回 HTTP 400 + RequestResponse。
 * 失败由 api-client 抛 NksApiError(带后端 message),onError 统一提示(errorMessage 不关闭)。
 */
export function useDeleteDocType() {
  return useApiMutation<RequestResponse, number>({
    mutationFn: async (docTypeId) => {
      return getApiClient().delete<RequestResponse>(
        endpoints.docType.delete.path,
        { params: { DocTypeID: docTypeId } },
      );
    },
    invalidateKeys: [docTypeKeys.list()],
    successMessage: false, // 用后端返回的 message 提示
    onSuccess: (data) => {
      toast.success(data?.message || 'Dokumenttype slettet');
    },
  });
}
