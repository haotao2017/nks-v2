'use client';

/**
 * PartyTypes 模块编排层 —— DataTable + 表单弹窗 + 单删/批量删除。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import type { PartyTypeDto } from '@nks/api-types';

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

import { usePartyTypes, useDeletePartyType, useBulkDeletePartyTypes, useWorkflowCategoryOptions } from './api';
import { getPartyTypeColumns } from './columns';
import { PartyTypeFormDialog } from './party-type-form-dialog';

export interface PartyTypesTableProps {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function PartyTypesTable({ createOpen, onCreateOpenChange }: PartyTypesTableProps) {
  const { t } = useTranslation();
  const { data = [], isLoading } = usePartyTypes();
  const { data: categories = [] } = useWorkflowCategoryOptions();
  const deleteMutation = useDeletePartyType();
  const bulkDeleteMutation = useBulkDeletePartyTypes();

  const [editTarget, setEditTarget] = React.useState<PartyTypeDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PartyTypeDto | null>(null);
  const { bulkIds, setBulkIds, close: closeBulk } = useBulkIdsDialog();

  const workflowName = React.useCallback(
    (id: number | null | undefined) =>
      id == null ? '' : (categories.find((c) => c.id === id)?.name ?? ''),
    [categories],
  );

  const columns = React.useMemo(
    () =>
      getPartyTypeColumns({
        t,
        workflowName,
        onEdit: (partyType) => setEditTarget(partyType),
        onDelete: (partyType) => setDeleteTarget(partyType),
      }),
    [t, workflowName],
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
        searchColumn="name"
        searchPlaceholder={t('partyTypes.searchPlaceholder')}
        emptyMessage={t('partyTypes.empty')}
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

      <PartyTypeFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />
      <PartyTypeFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        partyType={editTarget ?? undefined}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('partyTypes.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('partyTypes.delete.confirmPrefix')}{' '}
              <span className="font-medium">{deleteTarget?.name}</span>
              {t('partyTypes.delete.confirmSuffix')}
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
