'use client';

/**
 * ChecklistTemplate 模块编排层 —— 照抄 workflow-categories-table:
 * DataTable + 模板表单弹窗 + 子项管理弹窗 + 删除确认。
 */
import * as React from 'react';

import type { ChecklistTemplateDto } from '@nks/api-types';

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

import { useChecklistTemplates, useDeleteChecklistTemplate } from './api';
import { getChecklistTemplateColumns } from './columns';
import { ChecklistTemplateFormDialog } from './checklist-template-form-dialog';
import { ChecklistTemplateItemsDialog } from './checklist-template-items-dialog';

export interface ChecklistTemplatesTableProps {
  /** 页面「Ny sjekkliste」按钮控制的新建弹窗开关。 */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function ChecklistTemplatesTable({
  createOpen,
  onCreateOpenChange,
}: ChecklistTemplatesTableProps) {
  const { data = [], isLoading } = useChecklistTemplates();
  const deleteMutation = useDeleteChecklistTemplate();

  const [editTarget, setEditTarget] = React.useState<ChecklistTemplateDto | null>(null);
  const [itemsTarget, setItemsTarget] = React.useState<ChecklistTemplateDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ChecklistTemplateDto | null>(null);

  const columns = React.useMemo(
    () =>
      getChecklistTemplateColumns({
        onManageItems: (t) => setItemsTarget(t),
        onEdit: (t) => setEditTarget(t),
        onDelete: (t) => setDeleteTarget(t),
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
        searchColumn="title"
        searchPlaceholder="Søk etter tittel…"
        emptyMessage="Ingen sjekklister enda."
      />

      {/* 新建 */}
      <ChecklistTemplateFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />

      {/* 编辑 */}
      <ChecklistTemplateFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        template={editTarget ?? undefined}
      />

      {/* 子项管理 */}
      <ChecklistTemplateItemsDialog
        open={itemsTarget !== null}
        onOpenChange={(open) => !open && setItemsTarget(null)}
        template={itemsTarget}
      />

      {/* 删除确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette sjekkliste?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette{' '}
              <span className="font-medium">{deleteTarget?.title}</span>? Denne handlingen kan ikke
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
