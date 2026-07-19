'use client';

/**
 * Service 数据访问层 —— 照抄 features/contacts/api.ts 结构。
 *
 * 端点(来自 @nks/api-types 的 endpoints.service.*):
 *  - useServices       GET    /Service/GetAllService?PageNo=0  → 解包 res.multiService
 *  - useCreateService  POST   /Service/CreateService           → body { service }, 解包 res.service
 *  - useUpdateService  PUT    /Service/UpdateService           → body { service }, 解包 res.service
 *  - useDeleteService  DELETE /Service/DeleteService?ServiceID → RequestResponse{isSuccess,message}
 *
 * 注意:
 *  - Service 的请求/响应根键是小写 `service`(WrapperService,与 Contact 的大写 `Contact` 不同)。
 *  - GetAllService 的 PageNo=0 表示「取全部」(后端 pageNo>0 才按 10 条分页),
 *    因此列表一次拉全,搜索/分页交给 DataTable 客户端处理,与 Contact 一致。
 *  - 删除失败时后端返回 HTTP 400 + RequestResponse{message},api-client 会抛 NksApiError
 *    (message 取自响应体),交由 useApiMutation.onError 统一 toast。
 */
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import type { ServiceDto, WrapperService, RequestResponse } from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** GetAllService 的响应形状:{ multiService: ServiceDto[] }。 */
interface GetAllServiceResponse {
  multiService?: ServiceDto[];
}

/** 统一的查询 key。 */
export const serviceKeys = {
  all: ['services'] as const,
  list: () => [...serviceKeys.all, 'list'] as const,
};

/** 服务列表。PageNo=0 取全部,解包 res.multiService,空时回退 []。 */
export function useServices() {
  return useQuery({
    queryKey: serviceKeys.list(),
    queryFn: async () => {
      const res = await getApiClient().get<GetAllServiceResponse>(
        endpoints.service.getAll.path,
        { params: { PageNo: 0 } },
      );
      return res?.multiService ?? [];
    },
  });
}

/** 创建服务。body 根键小写 service;返回 res.service。 */
export function useCreateService() {
  const { t } = useTranslation();
  return useApiMutation<ServiceDto | undefined, ServiceDto>({
    mutationFn: async (service) => {
      const body: WrapperService = { service };
      const res = await getApiClient().post<WrapperService>(
        endpoints.service.create.path,
        body,
      );
      return res?.service;
    },
    invalidateKeys: [serviceKeys.list()],
    successMessage: t('services.toast.created'),
    errorMessage: t('services.toast.createError'),
  });
}

/** 更新服务。body 根键小写 service;返回 res.service。 */
export function useUpdateService() {
  const { t } = useTranslation();
  return useApiMutation<ServiceDto | undefined, ServiceDto>({
    mutationFn: async (service) => {
      const body: WrapperService = { service };
      const res = await getApiClient().put<WrapperService>(
        endpoints.service.update.path,
        body,
      );
      return res?.service;
    },
    invalidateKeys: [serviceKeys.list()],
    successMessage: t('services.toast.updated'),
    errorMessage: t('services.toast.updateError'),
  });
}

/**
 * 删除服务。query 参数 ServiceID。
 * 后端返回 RequestResponse{isSuccess,message};失败为 HTTP 400(api-client 抛错),
 * 防御性地再判断 isSuccess===false。成功用后端 message 提示。
 */
export function useDeleteService() {
  const { t } = useTranslation();
  return useApiMutation<RequestResponse, number>({
    mutationFn: async (serviceId) => {
      const res = await getApiClient().delete<RequestResponse>(
        endpoints.service.delete.path,
        { params: { ServiceID: serviceId } },
      );
      if (res?.isSuccess === false) {
        throw new Error(res.message || t('services.toast.deleteBlocked'));
      }
      return res;
    },
    invalidateKeys: [serviceKeys.list()],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(t('services.toast.deleted'));
    },
  });
}

/** 批量删除服务(逐个 DeleteService)。 */
export function useBulkDeleteServices() {
  const { t } = useTranslation();
  return useApiMutation<{ deleted: number }, number[]>({
    mutationFn: async (ids) => {
      let deleted = 0;
      for (const ServiceID of ids) {
        const res = await getApiClient().delete<RequestResponse>(
          endpoints.service.delete.path,
          { params: { ServiceID } },
        );
        if (res?.isSuccess === false) {
          throw new Error(res.message || t('services.toast.deleteBlocked'));
        }
        deleted += 1;
      }
      return { deleted };
    },
    invalidateKeys: [serviceKeys.list()],
    successMessage: false,
    errorMessage: false,
    onSuccess: (data) => {
      toast.success(t('services.toast.bulkDeleted', { count: data.deleted }));
    },
  });
}
