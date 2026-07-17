'use client';

/**
 * Projects 列表编排层 —— 三个变体(active/archived/deleted)共用。
 * 组合:子导航(活动/归档/删除,带计数)+ DataTable + 行操作 + 确认弹窗。
 *
 * - active:  归档(确认)/ 软删(确认)/ 打开工作台
 * - archived:取消归档(直接)/ 打开工作台
 * - deleted: 恢复(直接)/ 打开工作台
 */
import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table';
import { cn } from '@/lib/utils';

import {
  useActiveProjects,
  useArchivedProjects,
  useDeletedProjects,
  useProjectsCount,
  useArchiveProject,
  useDeleteProject,
} from './api';
import { getProjectColumns, type ProjectListVariant, type ProjectRow } from './columns';

const SUBNAV: { variant: ProjectListVariant; label: string; href: string }[] = [
  { variant: 'active', label: 'Aktive', href: '/projects' },
  { variant: 'archived', label: 'Arkiverte', href: '/projects/archived' },
  { variant: 'deleted', label: 'Slettede', href: '/projects/deleted' },
];

function useProjectsByVariant(variant: ProjectListVariant) {
  const active = useActiveProjects();
  const archived = useArchivedProjects();
  const deleted = useDeletedProjects();
  if (variant === 'archived') return archived;
  if (variant === 'deleted') return deleted;
  return active;
}

export interface ProjectsListProps {
  variant: ProjectListVariant;
}

export function ProjectsList({ variant }: ProjectsListProps) {
  const router = useRouter();
  const query = useProjectsByVariant(variant);
  const { data: count } = useProjectsCount();
  const archiveMutation = useArchiveProject();
  const deleteMutation = useDeleteProject();

  // 待确认目标(仅 active 变体使用确认弹窗)。
  const [archiveTarget, setArchiveTarget] = React.useState<ProjectRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectRow | null>(null);

  const openWorkplace = (row: ProjectRow) => {
    if (row.id) router.push(`/projects/${row.id}`);
  };

  const columns = React.useMemo(
    () =>
      getProjectColumns({
        variant,
        onOpen: openWorkplace,
        onArchive: (row) => setArchiveTarget(row),
        onDelete: (row) => setDeleteTarget(row),
        onUnarchive: (row) => {
          if (row.id) archiveMutation.mutate({ projectId: row.id, isArchive: false });
        },
        onRestore: (row) => {
          if (row.id) deleteMutation.mutate({ projectId: row.id, isDelete: false });
        },
      }),
    // openWorkplace / mutations 稳定引用足够;变体切换时重建。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variant],
  );

  const countMap: Record<ProjectListVariant, number | undefined> = {
    active: count?.notArchivedOrDeleted,
    archived: count?.archived,
    deleted: count?.deleted,
  };

  const confirmArchive = () => {
    if (!archiveTarget?.id) return;
    archiveMutation.mutate(
      { projectId: archiveTarget.id, isArchive: true },
      { onSuccess: () => setArchiveTarget(null) },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget?.id) return;
    deleteMutation.mutate(
      { projectId: deleteTarget.id, isDelete: true },
      { onSuccess: () => setDeleteTarget(null) },
    );
  };

  return (
    <div className="space-y-4">
      {/* 子导航:活动 / 归档 / 删除 */}
      <div className="flex gap-1 border-b">
        {SUBNAV.map((tab) => {
          const activeTab = tab.variant === variant;
          const c = countMap[tab.variant];
          return (
            <Link
              key={tab.variant}
              href={tab.href}
              className={cn(
                'flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                activeTab
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              {tab.label}
              {typeof c === 'number' && (
                <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1">
                  {c}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>

      <DataTable
        columns={columns}
        data={(query.data ?? []) as ProjectRow[]}
        isLoading={query.isLoading}
        searchColumn="title"
        searchPlaceholder="Søk etter tittel…"
        emptyMessage={
          variant === 'active'
            ? 'Ingen aktive prosjekter enda.'
            : variant === 'archived'
              ? 'Ingen arkiverte prosjekter.'
              : 'Ingen slettede prosjekter.'
        }
      />

      {/* 归档确认(active) */}
      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Arkivere prosjekt?</AlertDialogTitle>
            <AlertDialogDescription>
              Vil du arkivere{' '}
              <span className="font-medium">{archiveTarget?.title}</span>? Du kan gjenopprette det
              fra arkivet senere.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveMutation.isPending}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmArchive();
              }}
              disabled={archiveMutation.isPending}
            >
              Arkiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 软删确认(active) */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette prosjekt?</AlertDialogTitle>
            <AlertDialogDescription>
              Vil du slette{' '}
              <span className="font-medium">{deleteTarget?.title}</span>? Prosjektet flyttes til
              slettede og kan gjenopprettes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Slett
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
