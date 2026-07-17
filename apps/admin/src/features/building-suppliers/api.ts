'use client';

/**
 * BuildingSupplier 数据访问层 —— 照抄 features/contacts/api.ts 的结构。
 *
 * 端点(来自 @nks/api-types 的 endpoints.buildingSupplier.*):
 *  - useBuildingSuppliers      GET    /BuildingSupplier/GetAllBuildingSupplier → 解包 res.multiBuildingSuppliers
 *  - useCreateBuildingSupplier POST   /BuildingSupplier/CreatBuildingSupplier  → body { buildingSupplier }, 解包 res.buildingSupplier
 *  - useUpdateBuildingSupplier PUT    /BuildingSupplier/UpdateBuildingSupplier → body { buildingSupplier }, 解包 res.buildingSupplier
 *  - useDeleteBuildingSupplier DELETE /BuildingSupplier/DeleteBuildingSupplier?BuildingSupplierID → ResponseBuildingSupplier
 *
 * 注意:
 *  - 请求体根键小写 `buildingSupplier`(WrapperBuildingSupplier.getBuildingSupplier)。
 *  - query 参数名 PascalCase `BuildingSupplierID`(对齐后端 @RequestParam)。
 *  - 删除占用软失败:后端在被项目占用时返回 HTTP 400,body 为 ResponseBuildingSupplier,
 *    真正的原因在 `requestResponse.message`(顶层无 message,api-client 无法自动取到),
 *    因此在 mutationFn 里捕获 NksApiError、抽取 requestResponse.message 后重新抛出,
 *    交由 useApiMutation.onError 统一 toast(参考 Contact 的删除软失败模式)。
 *  - sortOrder:实体上标注 @JsonIgnore,线上响应不含该字段,BuildingSupplierDto 类型也没有它。
 *    表单里仍提供 sortOrder 输入(任务要求),用本地扩展类型 BuildingSupplierPayload 承接、
 *    随请求体一并发送;若后端确实忽略则无副作用(见页面末尾存疑点)。
 */
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import type {
  BuildingSupplierDto,
  WrapperBuildingSupplier,
  WrapperMultiBuildingSuppliers,
  ResponseBuildingSupplier,
} from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';
import { NksApiError } from '@nks/api-client';

import { getApiClient } from '@/lib/api';
import { useApiMutation } from '@/lib/query';

/** 本地扩展:携带线上契约未声明的 sortOrder(不改动 @nks/api-types 包)。 */
export type BuildingSupplierPayload = BuildingSupplierDto & { sortOrder?: number };

/** 统一的查询 key —— 复用于失效重拉。 */
export const buildingSupplierKeys = {
  all: ['building-suppliers'] as const,
  list: () => [...buildingSupplierKeys.all, 'list'] as const,
};

/** 建材供应商列表。解包 res.multiBuildingSuppliers,空时回退 []。 */
export function useBuildingSuppliers() {
  return useQuery({
    queryKey: buildingSupplierKeys.list(),
    queryFn: async () => {
      const res = await getApiClient().get<WrapperMultiBuildingSuppliers>(
        endpoints.buildingSupplier.getAll.path,
      );
      return res?.multiBuildingSuppliers ?? [];
    },
  });
}

/** 创建建材供应商。body 根键小写 buildingSupplier;返回 res.buildingSupplier。 */
export function useCreateBuildingSupplier() {
  return useApiMutation<BuildingSupplierDto | undefined, BuildingSupplierPayload>({
    mutationFn: async (buildingSupplier) => {
      const body: WrapperBuildingSupplier = { buildingSupplier };
      const res = await getApiClient().post<WrapperBuildingSupplier>(
        endpoints.buildingSupplier.create.path,
        body,
      );
      return res?.buildingSupplier;
    },
    invalidateKeys: [buildingSupplierKeys.list()],
    successMessage: 'Byggevareleverandør opprettet',
    errorMessage: 'Kunne ikke opprette byggevareleverandør',
  });
}

/** 更新建材供应商。body 根键小写 buildingSupplier;返回 res.buildingSupplier。 */
export function useUpdateBuildingSupplier() {
  return useApiMutation<BuildingSupplierDto | undefined, BuildingSupplierPayload>({
    mutationFn: async (buildingSupplier) => {
      const body: WrapperBuildingSupplier = { buildingSupplier };
      const res = await getApiClient().put<WrapperBuildingSupplier>(
        endpoints.buildingSupplier.update.path,
        body,
      );
      return res?.buildingSupplier;
    },
    invalidateKeys: [buildingSupplierKeys.list()],
    successMessage: 'Byggevareleverandør oppdatert',
    errorMessage: 'Kunne ikke oppdatere byggevareleverandør',
  });
}

/**
 * 删除建材供应商。query 参数 BuildingSupplierID。
 * 成功(HTTP 200)返回 ResponseBuildingSupplier,提示 requestResponse.message。
 * 被项目占用(HTTP 400)时,message 藏在 body.requestResponse.message —— 在这里抽出并重抛,
 * 由 onError 统一 toast(展示后端 message)。
 */
export function useDeleteBuildingSupplier() {
  return useApiMutation<ResponseBuildingSupplier, number>({
    mutationFn: async (buildingSupplierId) => {
      try {
        return await getApiClient().delete<ResponseBuildingSupplier>(
          endpoints.buildingSupplier.delete.path,
          { params: { BuildingSupplierID: buildingSupplierId } },
        );
      } catch (err) {
        if (err instanceof NksApiError && err.body && typeof err.body === 'object') {
          const nested = (err.body as unknown as ResponseBuildingSupplier).requestResponse
            ?.message;
          if (nested) throw new Error(nested);
        }
        throw err;
      }
    },
    invalidateKeys: [buildingSupplierKeys.list()],
    successMessage: false, // 用后端返回的 message 提示
    onSuccess: (data) => {
      toast.success(data?.requestResponse?.message || 'Byggevareleverandør slettet');
    },
  });
}
