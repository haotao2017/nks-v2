'use client';

import * as React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { I18nextProvider } from 'react-i18next';

import { Toaster } from '@/components/ui/sonner';
import i18n, { STORAGE_KEY } from '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  // 首屏统一用默认 `no` 渲染(SSR 与首个 client render 一致,避免 hydration 报错);
  // mount 后再按 localStorage 里的偏好切换。
  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored !== i18n.language && i18n.options.supportedLngs) {
      if ((i18n.options.supportedLngs as readonly string[]).includes(stored)) {
        void i18n.changeLanguage(stored);
      }
    }
  }, []);

  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Short stale window; list mutations invalidate + refetch actively.
            // Combined with api-client cache:'no-store' to avoid browser HTTP cache.
            staleTime: 5_000,
            retry: 1,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
