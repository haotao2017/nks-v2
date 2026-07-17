import { Construction } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ModulePlaceholder({ title }: { title: string }) {
  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="text-muted-foreground size-5" />
          {title}
        </CardTitle>
        <CardDescription>Denne modulen er under utvikling.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">Kommer snart — implementeres i en senere fase.</p>
      </CardContent>
    </Card>
  );
}
