'use client';

/** Arkiverte prosjekter (GetAllArchivedProjectList)。支持取消归档。 */
import { ProjectsList } from '@/features/projects/projects-list';

export default function ArchivedProjectsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Prosjekter</h2>
      <ProjectsList variant="archived" />
    </div>
  );
}
