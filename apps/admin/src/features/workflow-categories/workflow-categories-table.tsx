'use client';

/**
 * WorkflowCategory 模块编排层 —— 照抄 contacts-table:
 * DataTable + 分类表单弹窗 + 步骤子管理弹窗 + 删除确认。
 */
import * as React from 'react';

import type { WorkflowCategoryDto } from '@nks/api-types';

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
import { DataTable } from '@/components/data-table';

import { useWorkflowCategories, useDeleteWorkflowCategory } from './api';
import { getWorkflowCategoryColumns } from './columns';
import { WorkflowCategoryFormDialog } from './workflow-category-form-dialog';
import { WorkflowCategoryStepsDialog } from './workflow-category-steps-dialog';

export interface WorkflowCategoriesTableProps {
  /** 页面「Ny arbeidsflyt」按钮控制的新建弹窗开关。 */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function WorkflowCategoriesTable({
  createOpen,
  onCreateOpenChange,
}: WorkflowCategoriesTableProps) {
  const { data = [], isLoading } = useWorkflowCategories();
  const deleteMutation = useDeleteWorkflowCategory();

  const [editTarget, setEditTarget] = React.useState<WorkflowCategoryDto | null>(null);
  const [stepsTarget, setStepsTarget] = React.useState<WorkflowCategoryDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<WorkflowCategoryDto | null>(null);

  const columns = React.useMemo(
    () =>
      getWorkflowCategoryColumns({
        onManageSteps: (c) => setStepsTarget(c),
        onEdit: (c) => setEditTarget(c),
        onDelete: (c) => setDeleteTarget(c),
      }),
    [],
  );

  const confirmDelete = () => {
    if (!deleteTarget?.id) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchColumn="name"
        searchPlaceholder="Søk etter navn…"
        emptyMessage="Ingen arbeidsflyter enda."
      />

      {/* 新建 */}
      <WorkflowCategoryFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />

      {/* 编辑 */}
      <WorkflowCategoryFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        category={editTarget ?? undefined}
      />

      {/* 步骤子管理 */}
      <WorkflowCategoryStepsDialog
        open={stepsTarget !== null}
        onOpenChange={(open) => !open && setStepsTarget(null)}
        category={stepsTarget}
      />

      {/* 删除确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette arbeidsflyt?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette{' '}
              <span className="font-medium">{deleteTarget?.name}</span>? Denne handlingen kan ikke
              angres.
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
    </>
  );
}
