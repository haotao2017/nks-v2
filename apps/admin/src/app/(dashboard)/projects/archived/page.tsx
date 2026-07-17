'use client';

/** Arkiverte prosjekter (GetAllArchivedProjectList)。支持取消归档。 */
import { useTranslation } from 'react-i18next';

import { ProjectsList } from '@/features/projects/projects-list';

export default function ArchivedProjectsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">{t('projects.title')}</h2>
      <ProjectsList variant="archived" />
    </div>
  );
}
