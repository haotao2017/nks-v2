'use client';

import { useTranslation } from 'react-i18next';
import { FolderKanban, Users, ClipboardCheck } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useContacts } from '@/features/contacts/api';
import { useChecklistTemplates } from '@/features/checklists/api';
import { useProjectsCount } from '@/features/projects/api';

export default function DashboardPage() {
  const { t } = useTranslation();
  const projectsCount = useProjectsCount();
  const contacts = useContacts();
  const checklists = useChecklistTemplates();

  const stats = [
    {
      label: t('dashboard.activeProjects'),
      value: projectsCount.data?.notArchivedOrDeleted,
      pending: projectsCount.isPending,
      icon: FolderKanban,
    },
    {
      label: t('dashboard.contacts'),
      value: contacts.data?.length,
      pending: contacts.isPending,
      icon: Users,
    },
    {
      label: t('dashboard.checklists'),
      value: checklists.data?.length,
      pending: checklists.isPending,
      icon: ClipboardCheck,
    },
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
              {stat.pending ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold">
                  {stat.value === undefined ? '—' : stat.value}
                </div>
              )}
              <CardDescription>{t('dashboard.liveCounts')}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
