'use client';

import { useTranslation } from 'react-i18next';
import { FolderKanban, Users, ClipboardCheck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { t } = useTranslation();

  const stats = [
    { label: t('dashboard.activeProjects'), value: '—', icon: FolderKanban },
    { label: t('dashboard.contacts'), value: '—', icon: Users },
    { label: t('dashboard.checklists'), value: '—', icon: ClipboardCheck },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{t('dashboard.welcome')}</h2>
        <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <CardDescription>{t('dashboard.dataPending')}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
