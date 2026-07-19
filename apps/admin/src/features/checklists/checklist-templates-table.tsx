'use client';

/**
 * ChecklistTemplate 模块编排层 —— 照抄 workflow-categories-table:
 * DataTable + 模板表单弹窗 + 子项管理弹窗 + 单删/批量删除。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';

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
import {
  BulkDeleteConfirmDialog,
  BulkDeleteToolbar,
  collectNumericIds,
  useBulkIdsDialog,
} from '@/components/table-bulk-delete';

import { useChecklistTemplates, useDeleteChecklistTemplate, useBulkDeleteChecklistTemplates } from './api';
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
  const { t } = useTranslation();
  const { data = [], isLoading } = useChecklistTemplates();
  const deleteMutation = useDeleteChecklistTemplate();
  const bulkDeleteMutation = useBulkDeleteChecklistTemplates();

  const [editTarget, setEditTarget] = React.useState<ChecklistTemplateDto | null>(null);
  const [itemsTarget, setItemsTarget] = React.useState<ChecklistTemplateDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ChecklistTemplateDto | null>(null);
  const { bulkIds, setBulkIds, close: closeBulk } = useBulkIdsDialog();

  const columns = React.useMemo(
    () =>
      getChecklistTemplateColumns({
        t,
        onManageItems: (template) => setItemsTarget(template),
        onEdit: (template) => setEditTarget(template),
        onDelete: (template) => setDeleteTarget(template),
      }),
    [t],
  );

  const confirmDelete = () => {
    if (!deleteTarget?.id) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  const confirmBulkDelete = () => {
    if (!bulkIds || bulkIds.ids.length === 0) return;
    bulkDeleteMutation.mutate(bulkIds.ids, {
      onSuccess: () => {
        bulkIds.clear();
        closeBulk();
      },
    });
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchColumn="title"
        searchPlaceholder={t('checklists.searchPlaceholder')}
        emptyMessage={t('checklists.empty')}
        enableRowSelection
        getRowId={(row, index) => String(row.id ?? index)}
        selectAllAriaLabel={t('bulk.selectAll')}
        selectRowAriaLabel={t('bulk.selectRow')}
        renderBulkActions={(rows, clear) => {
          const ids = collectNumericIds(rows);
          if (ids.length === 0) return null;
          return (
            <BulkDeleteToolbar
              count={ids.length}
              pending={bulkDeleteMutation.isPending}
              onRequestDelete={() => setBulkIds({ ids, clear })}
              onClear={clear}
              selectedLabel={t('bulk.selected', { count: ids.length })}
              clearLabel={t('bulk.clear')}
              deleteLabel={t('common.delete')}
            />
          );
        }}
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
            <AlertDialogTitle>{t('checklists.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('checklists.delete.confirmPrefix')}{' '}
              <span className="font-medium">{deleteTarget?.title}</span>
              {t('checklists.delete.confirmSuffix')}
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

      <BulkDeleteConfirmDialog
        bulkIds={bulkIds}
        onOpenChange={(open) => !open && closeBulk()}
        onConfirm={confirmBulkDelete}
        pending={bulkDeleteMutation.isPending}
        title={t('bulkDeleteDialog.title', { count: bulkIds?.ids.length ?? 0 })}
        description={t('bulkDeleteDialog.description', {
          count: bulkIds?.ids.length ?? 0,
        })}
        cancelLabel={t('common.cancel')}
        deleteLabel={t('common.delete')}
      />
    </>
  );
}
