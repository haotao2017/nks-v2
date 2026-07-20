'use client';

/**
 * Miscellaneous 数据访问层 —— 杂项主数据 hooks。
 *
 * 端点(来自 @nks/api-types 的 endpoints.miscellaneous.*):
 *  - usePostCodes  GET /Miscellaneous/GetPostCodes → 解包 res.postCodes(PostCodeDto[])
 *
 * 注意:
 *  - 旧系统 ProjectInfo.js 用 GetPostCodes 一次取全表,输入 4 位邮编后本地匹配
 *    `postnummer === value` 回填 poststed/kommunenavn。这里保持同样策略(本地匹配),
 *    避免为每次输入打一次 GetPostCodeByNumber。
 */
import { useQuery } from '@tanstack/react-query';

import type { PostCodeDto, WrapperPostCodeDto } from '@nks/api-types';
import { endpoints } from '@nks/api-types/endpoints';

import { getApiClient } from '@/lib/api';

/** 统一的查询 key。 */
export const miscKeys = {
  all: ['misc'] as const,
  postCodes: () => [...miscKeys.all, 'post-codes'] as const,
};

/** 邮编全表。解包 res.postCodes,空时回退 []。
 * 列表较大;默认仅在调用方 enabled 时请求(向导在 Prosjektinfo 步再拉)。
 * staleTime 1h:避免 Infinity 导致空结果永久占缓存、再也看不到请求。
 */
export function usePostCodes(options?: { enabled?: boolean }) {
  return useQuery<PostCodeDto[]>({
    queryKey: miscKeys.postCodes(),
    enabled: options?.enabled ?? true,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperPostCodeDto>(
        endpoints.miscellaneous.getPostCodes.path,
      );
      return res?.postCodes ?? [];
    },
  });
}
