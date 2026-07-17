/** 外部页面共用的状态展示:无效链接、加载、加载失败。 */
import { AlertTriangle, Loader2 } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/** UrlKey 缺失/无效时的友好错误页。 */
export function InvalidLinkCard() {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-destructive size-5" aria-hidden />
          <CardTitle>Ugyldig lenke</CardTitle>
        </div>
        <CardDescription>
          Lenken mangler nødvendig informasjon eller er utløpt. Åpne lenken fra
          e-posten på nytt, eller kontakt kontrolløren om problemet vedvarer.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

/** 数据加载中。 */
export function LoadingCard({ label = 'Laster …' }: { label?: string }) {
  return (
    <Card>
      <CardContent className="text-muted-foreground flex items-center gap-2 py-10">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        <span className="text-sm">{label}</span>
      </CardContent>
    </Card>
  );
}

/** 数据加载失败。 */
export function LoadErrorCard({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-destructive size-5" aria-hidden />
          <CardTitle>Kunne ikke laste data</CardTitle>
        </div>
        <CardDescription>
          Noe gikk galt. Prøv igjen senere.
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="text-foreground ml-1 underline underline-offset-2"
            >
              Prøv på nytt
            </button>
          ) : null}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
