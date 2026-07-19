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
import { Trans, useTranslation } from 'react-i18next';
import { Archive, ArchiveRestore, RotateCcw, Trash2 } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { cn } from '@/lib/utils';

import {
  useActiveProjects,
  useArchivedProjects,
  useDeletedProjects,
  useProjectsCount,
  useArchiveProject,
  useDeleteProject,
  useBulkArchiveProjects,
  useBulkDeleteProjects,
} from './api';
import { getProjectColumns, type ProjectListVariant, type ProjectRow } from './columns';

const SUBNAV: { variant: ProjectListVariant; labelKey: string; href: string }[] = [
  { variant: 'active', labelKey: 'projects.subnav.active', href: '/projects' },
  { variant: 'archived', labelKey: 'projects.subnav.archived', href: '/projects/archived' },
  { variant: 'deleted', labelKey: 'projects.subnav.deleted', href: '/projects/deleted' },
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
  const { t } = useTranslation();
  const router = useRouter();
  const query = useProjectsByVariant(variant);
  const { data: count } = useProjectsCount();
  const archiveMutation = useArchiveProject();
  const deleteMutation = useDeleteProject();
  const bulkArchiveMutation = useBulkArchiveProjects();
  const bulkDeleteMutation = useBulkDeleteProjects();

  // 待确认目标(仅 active 变体使用确认弹窗)。
  const [archiveTarget, setArchiveTarget] = React.useState<ProjectRow | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectRow | null>(null);

  // 批量确认目标:archive(归档)/ delete(软删),携带选中 ids 与清空选择回调。
  const [bulkConfirm, setBulkConfirm] = React.useState<{
    kind: 'archive' | 'delete';
    ids: number[];
    clear: () => void;
  } | null>(null);

  const openWorkplace = (row: ProjectRow) => {
    if (row.id) router.push(`/projects/${row.id}`);
  };

  const columns = React.useMemo(
    () =>
      getProjectColumns({
        variant,
        t,
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
    // openWorkplace / mutations 稳定引用足够;变体切换或语言切换时重建。
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [variant, t],
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

  const rowIds = (rows: ProjectRow[]) =>
    rows.map((r) => r.id).filter((id): id is number => typeof id === 'number');

  const bulkPending = bulkArchiveMutation.isPending || bulkDeleteMutation.isPending;

  const confirmBulk = () => {
    if (!bulkConfirm) return;
    const { kind, ids, clear } = bulkConfirm;
    const onDone = {
      onSuccess: () => {
        clear();
        setBulkConfirm(null);
      },
    };
    if (kind === 'archive') {
      bulkArchiveMutation.mutate({ projectIds: ids, isArchive: true }, onDone);
    } else {
      bulkDeleteMutation.mutate({ projectIds: ids, isDelete: true }, onDone);
    }
  };

  // 批量操作工具条:按变体决定动作。归档/软删走确认弹窗;取消归档/恢复为直接操作(与行操作一致)。
  const renderBulkActions = (rows: ProjectRow[], clear: () => void) => {
    const ids = rowIds(rows);
    if (ids.length === 0) return null;
    return (
      <>
        <span className="text-sm font-medium">
          {t('projects.bulk.selected', { count: ids.length })}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {variant === 'active' && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkPending}
                onClick={() => setBulkConfirm({ kind: 'archive', ids, clear })}
              >
                <Archive className="size-4" />
                {t('projects.actions.archive')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkPending}
                onClick={() => setBulkConfirm({ kind: 'delete', ids, clear })}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                {t('common.delete')}
              </Button>
            </>
          )}

          {variant === 'archived' && (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkPending}
                onClick={() =>
                  bulkArchiveMutation.mutate(
                    { projectIds: ids, isArchive: false },
                    { onSuccess: clear },
                  )
                }
              >
                <ArchiveRestore className="size-4" />
                {t('projects.actions.unarchive')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulkPending}
                onClick={() => setBulkConfirm({ kind: 'delete', ids, clear })}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="size-4" />
                {t('common.delete')}
              </Button>
            </>
          )}

          {variant === 'deleted' && (
            <Button
              variant="outline"
              size="sm"
              disabled={bulkPending}
              onClick={() =>
                bulkDeleteMutation.mutate(
                  { projectIds: ids, isDelete: false },
                  { onSuccess: clear },
                )
              }
            >
              <RotateCcw className="size-4" />
              {t('projects.actions.restore')}
            </Button>
          )}

          <Button variant="ghost" size="sm" onClick={clear} disabled={bulkPending}>
            {t('projects.bulk.clear')}
          </Button>
        </div>
      </>
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
              {t(tab.labelKey)}
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
        searchPlaceholder={t('projects.searchPlaceholder')}
        enableRowSelection
        getRowId={(row, index) => (row.id != null ? String(row.id) : `row-${index}`)}
        selectAllAriaLabel={t('projects.bulk.selectAll')}
        selectRowAriaLabel={t('projects.bulk.selectRow')}
        renderBulkActions={renderBulkActions}
        emptyMessage={
          variant === 'active'
            ? t('projects.empty.active')
            : variant === 'archived'
              ? t('projects.empty.archived')
              : t('projects.empty.deleted')
        }
      />

      {/* 归档确认(active) */}
      <AlertDialog
        open={archiveTarget !== null}
        onOpenChange={(open) => !open && setArchiveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projects.archiveDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="projects.archiveDialog.description"
                values={{ title: archiveTarget?.title }}
                components={{ strong: <span className="font-medium" /> }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={archiveMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmArchive();
              }}
              disabled={archiveMutation.isPending}
            >
              {t('projects.actions.archive')}
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
            <AlertDialogTitle>{t('projects.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="projects.deleteDialog.description"
                values={{ title: deleteTarget?.title }}
                components={{ strong: <span className="font-medium" /> }}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量归档 / 软删确认 */}
      <AlertDialog open={bulkConfirm !== null} onOpenChange={(open) => !open && setBulkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkConfirm?.kind === 'archive'
                ? t('projects.bulkArchiveDialog.title', { count: bulkConfirm?.ids.length ?? 0 })
                : t('projects.bulkDeleteDialog.title', { count: bulkConfirm?.ids.length ?? 0 })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkConfirm?.kind === 'archive'
                ? t('projects.bulkArchiveDialog.description', {
                    count: bulkConfirm?.ids.length ?? 0,
                  })
                : t('projects.bulkDeleteDialog.description', {
                    count: bulkConfirm?.ids.length ?? 0,
                  })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkPending}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmBulk();
              }}
              disabled={bulkPending}
              className={
                bulkConfirm?.kind === 'delete'
                  ? 'bg-destructive text-white hover:bg-destructive/90'
                  : undefined
              }
            >
              {bulkConfirm?.kind === 'archive'
                ? t('projects.actions.archive')
                : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
