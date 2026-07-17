'use client';

/** Slettede prosjekter (GetAllDeletedProjectList)。支持恢复。 */
import { useTranslation } from 'react-i18next';

import { ProjectsList } from '@/features/projects/projects-list';

export default function DeletedProjectsPage() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">{t('projects.title')}</h2>
      <ProjectsList variant="deleted" />
    </div>
  );
}
