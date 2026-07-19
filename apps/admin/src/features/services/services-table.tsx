'use client';

/**
 * Services 模块编排层 —— DataTable + 表单弹窗 + 单删/批量删除。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import type { ServiceDto } from '@nks/api-types';

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

import { useServices, useDeleteService, useBulkDeleteServices } from './api';
import { getServiceColumns } from './columns';
import { ServiceFormDialog } from './service-form-dialog';

export interface ServicesTableProps {
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function ServicesTable({ createOpen, onCreateOpenChange }: ServicesTableProps) {
  const { t } = useTranslation();
  const { data = [], isLoading } = useServices();
  const deleteMutation = useDeleteService();
  const bulkDeleteMutation = useBulkDeleteServices();

  const [editTarget, setEditTarget] = React.useState<ServiceDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ServiceDto | null>(null);
  const { bulkIds, setBulkIds, close: closeBulk } = useBulkIdsDialog();

  const columns = React.useMemo(
    () =>
      getServiceColumns({
        t,
        onEdit: (service) => setEditTarget(service),
        onDelete: (service) => setDeleteTarget(service),
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
        searchColumn="name"
        searchPlaceholder={t('services.searchPlaceholder')}
        emptyMessage={t('services.empty')}
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

      <ServiceFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />
      <ServiceFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        service={editTarget ?? undefined}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('services.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('services.delete.confirmPrefix')}{' '}
              <span className="font-medium">{deleteTarget?.name}</span>
              {t('services.delete.confirmSuffix')}
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
