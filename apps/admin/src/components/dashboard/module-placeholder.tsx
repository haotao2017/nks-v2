'use client';

import { useTranslation } from 'react-i18next';
import { Construction } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ModulePlaceholder({ title }: { title: string }) {
  const { t } = useTranslation();

  return (
    <Card className="mx-auto max-w-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Construction className="text-muted-foreground size-5" />
          {title}
        </CardTitle>
        <CardDescription>{t('dashboard.placeholderDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">{t('dashboard.placeholderBody')}</p>
      </CardContent>
    </Card>
  );
}
