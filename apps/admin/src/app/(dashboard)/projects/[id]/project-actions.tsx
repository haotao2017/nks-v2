'use client';

/**
 * Prosjekt-detalj handlinger —— 详情页头部操作区(原系统 ProjectWorkplaceHeader 的 Edit/Archive/Delete)。
 *
 * - Rediger:Dialog 复用 <ProjectWizard project={...} />(编辑模式,内部走 UpdateProject);
 *           onDone 关闭 Dialog,更新 mutation 已 invalidate projectKeys.all(含 detail + 列表)。
 * - Arkiver:AlertDialog 确认 → useArchiveProject(isArchive=true),成功跳回 /projects。
 * - Slett:  AlertDialog 确认 → useDeleteProject(isDelete=true),成功跳回 /projects。
 *
 * 归档/删除为后端软失败模式,失败 message 由 api hook 抛错并 toast。
 */
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Trans, useTranslation } from 'react-i18next';
import { MoreHorizontal, Pencil, Archive, Trash2 } from 'lucide-react';

import type { ProjectDto } from '@nks/api-types';

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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProjectWizard } from '@/features/projects/wizard/project-wizard';

import { useArchiveProject, useDeleteProject } from '@/features/projects/api';

export function ProjectActions({ project }: { project: ProjectDto }) {
  const { t } = useTranslation();
  const router = useRouter();

  const [editOpen, setEditOpen] = React.useState(false);
  const [archiveOpen, setArchiveOpen] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);

  const archiveMutation = useArchiveProject();
  const deleteMutation = useDeleteProject();

  const projectId = project.id;

  const confirmArchive = () => {
    if (!projectId) return;
    archiveMutation.mutate(
      { projectId, isArchive: true },
      {
        onSuccess: () => {
          setArchiveOpen(false);
          router.push('/projects');
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!projectId) return;
    deleteMutation.mutate(
      { projectId, isDelete: true },
      {
        onSuccess: () => {
          setDeleteOpen(false);
          router.push('/projects');
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Pencil className="size-4" />
        {t('projects.actions.edit')}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label={t('projects.actions.more')}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setArchiveOpen(true)}>
            <Archive className="size-4" />
            {t('projects.actions.archive')}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            {t('projects.actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rediger —— 复用向导编辑模式 */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('projects.editDialog.title')}</DialogTitle>
            <DialogDescription>{t('projects.editDialog.description')}</DialogDescription>
          </DialogHeader>
          {editOpen && (
            <ProjectWizard
              project={project}
              onCancel={() => setEditOpen(false)}
              onDone={() => setEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Arkiver —— 确认 */}
      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projects.archiveDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="projects.archiveDialog.description"
                values={{ title: project.title }}
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

      {/* Slett —— 确认 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('projects.deleteDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="projects.deleteDialog.description"
                values={{ title: project.title }}
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
              className="bg-destructive hover:bg-destructive/90 text-white"
            >
              {t('projects.actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
