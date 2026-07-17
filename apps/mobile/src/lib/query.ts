/**
 * TanStack Query 配置 + 错误信息辅助。
 *
 * QueryClient 在 providers 里实例化(每个 app 实例一份)。这里只导出默认选项与
 * 从任意错误取可读信息的工具(优先后端 ApiError.message)。
 */
import { QueryClient } from '@tanstack/react-query';

import { NksApiError } from '@nks/api-client';

/** 从任意错误里取可读信息(挪威语兜底)。 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof NksApiError) return err.message;
  if (err instanceof Error) return err.message;
  return 'Ukjent feil';
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
