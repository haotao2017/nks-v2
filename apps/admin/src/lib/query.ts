'use client';

/**
 * CRUD 查询封装约定 —— 供各主数据模块的 features 目录下 api.ts 复用。
 *
 * 设计目标:
 *  - 用 NksClient 单例 + endpoints 目录发起请求,响应解包留给各模块自己(因包装键各不相同)。
 *  - 变更类操作(create/update/delete)统一走 useApiMutation:成功/失败自动 toast,
 *    成功后按 invalidateKeys 失效重拉列表。
 *  - 后端「HTTP 200 但 success:false」的软失败(如联系人被项目占用),由调用方在
 *    onSuccess 里判断并抛错或自行 toast —— 见 features/contacts/api.ts 的 delete 样板。
 */
import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { toast } from 'sonner';

import { NksApiError } from '@nks/api-client';
import i18n from '@/lib/i18n';

/** 从任意错误里取可读信息(优先后端 ApiError.message)。 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof NksApiError) return err.message;
  if (err instanceof Error) return err.message;
  return i18n.t('common.unknownError');
}

export interface ApiMutationConfig<TData, TVariables>
  extends Omit<UseMutationOptions<TData, unknown, TVariables>, 'mutationFn' | 'onSuccess'> {
  mutationFn: (vars: TVariables) => Promise<TData>;
  /** 成功后要失效的 query key 列表(通常是对应列表的 key)。 */
  invalidateKeys?: QueryKey[];
  /** 成功 toast 文案(挪威语)。传 false 关闭。 */
  successMessage?: string | false;
  /** 失败 toast 文案前缀;实际错误信息会拼接其后。传 false 关闭。 */
  errorMessage?: string | false;
  /** 额外的成功回调(在 toast + invalidate 之后执行)。 */
  onSuccess?: (data: TData, vars: TVariables) => void | Promise<void>;
}

/**
 * 统一的变更 hook:自动处理 toast + 失效重拉。
 *
 * 用法见 features/contacts/api.ts。
 */
export function useApiMutation<TData, TVariables>({
  mutationFn,
  invalidateKeys,
  successMessage,
  errorMessage,
  onSuccess,
  ...rest
}: ApiMutationConfig<TData, TVariables>) {
  const queryClient = useQueryClient();

  return useMutation<TData, unknown, TVariables>({
    mutationFn,
    onSuccess: async (data, vars) => {
      if (invalidateKeys?.length) {
        await Promise.all(
          invalidateKeys.map((key) =>
            queryClient.invalidateQueries({
              queryKey: key,
              // Force refetch of mounted queries even within staleTime.
              refetchType: 'active',
            }),
          ),
        );
      }
      if (successMessage !== false && successMessage) {
        toast.success(successMessage);
      }
      await onSuccess?.(data, vars);
    },
    onError: (err) => {
      if (errorMessage !== false) {
        const prefix = errorMessage ? `${errorMessage}: ` : '';
        toast.error(`${prefix}${getErrorMessage(err)}`);
      }
    },
    ...rest,
  });
}
