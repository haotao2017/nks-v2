'use client';

/** 外部页面共用的状态展示:无效链接、加载、加载失败。 */
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** UrlKey 缺失/无效时的友好错误页。 */
export function InvalidLinkCard() {
  const { t } = useTranslation();
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-destructive size-5" aria-hidden />
          <CardTitle>{t('external.invalidLinkTitle')}</CardTitle>
        </div>
        <CardDescription>{t('external.invalidLinkDesc')}</CardDescription>
      </CardHeader>
    </Card>
  );
}

/** 数据加载中。 */
export function LoadingCard({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="text-muted-foreground flex items-center gap-2 py-10">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        <span className="text-sm">{label ?? t('external.loading')}</span>
      </CardContent>
    </Card>
  );
}

/** 数据加载失败。 */
export function LoadErrorCard({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-destructive size-5" aria-hidden />
          <CardTitle>{t('external.loadErrorTitle')}</CardTitle>
        </div>
        <CardDescription>
          {t('external.loadErrorDesc')}
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-foreground ml-1 underline underline-offset-2"
            >
              {t('external.retry')}
            </button>
          ) : null}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
