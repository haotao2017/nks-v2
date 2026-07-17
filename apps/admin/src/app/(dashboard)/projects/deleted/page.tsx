'use client';

/** Slettede prosjekter (GetAllDeletedProjectList)。支持恢复。 */
import { ProjectsList } from '@/features/projects/projects-list';

export default function DeletedProjectsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold tracking-tight">Prosjekter</h2>
      <ProjectsList variant="deleted" />
    </div>
  );
}
