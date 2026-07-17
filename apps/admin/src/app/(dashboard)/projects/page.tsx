'use client';

/**
 * Prosjekter —— aktive prosjekter (GetAllProjectListNotArchivedOrDeleted)。
 * 顶部:标题 + 活动计数(GetProjectsCount)+「Nytt prosjekt」按钮(打开向导 Dialog)。
 * 子导航(Aktive / Arkiverte / Slettede)由 ProjectsList 内部渲染,走子路由。
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProjectsList } from '@/features/projects/projects-list';
import { useProjectsCount } from '@/features/projects/api';
import { ProjectWizard } from '@/features/projects/wizard/project-wizard';

export default function ProjectsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [createOpen, setCreateOpen] = React.useState(false);
  const { data: count } = useProjectsCount();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">{t('projects.title')}</h2>
          {typeof count?.notArchivedOrDeleted === 'number' && (
            <Badge variant="secondary" className="h-6 min-w-6 justify-center px-1.5">
              {count.notArchivedOrDeleted}
            </Badge>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          {t('projects.newProject')}
        </Button>
      </div>

      <ProjectsList variant="active" />

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('projects.newProject')}</DialogTitle>
            <DialogDescription>{t('projects.createDescription')}</DialogDescription>
          </DialogHeader>
          <ProjectWizard
            onCancel={() => setCreateOpen(false)}
            onDone={(project) => {
              setCreateOpen(false);
              if (project?.id) router.push(`/projects/${project.id}`);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
