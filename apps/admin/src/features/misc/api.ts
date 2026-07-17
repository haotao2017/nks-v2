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

/** 邮编全表。解包 res.postCodes,空时回退 []。列表较大但为静态主数据,长时间缓存。 */
export function usePostCodes() {
  return useQuery<PostCodeDto[]>({
    queryKey: miscKeys.postCodes(),
    staleTime: Infinity,
    gcTime: Infinity,
    queryFn: async () => {
      const res = await getApiClient().get<WrapperPostCodeDto>(
        endpoints.miscellaneous.getPostCodes.path,
      );
      return res?.postCodes ?? [];
    },
  });
}
