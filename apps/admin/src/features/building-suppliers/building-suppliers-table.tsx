'use client';

/**
 * BuildingSuppliers 模块编排层 —— 照抄 features/contacts/contacts-table.tsx。
 * 组合 DataTable + 表单弹窗 + 单删/批量删除。删除占用软失败的 toast 由 api hook 统一处理。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import type { BuildingSupplierDto } from '@nks/api-types';

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

import { useBuildingSuppliers, useDeleteBuildingSupplier, useBulkDeleteBuildingSuppliers } from './api';
import { getBuildingSupplierColumns } from './columns';
import { BuildingSupplierFormDialog } from './building-supplier-form-dialog';

export interface BuildingSuppliersTableProps {
  /** 页面「Ny byggevareleverandør」按钮控制的新建弹窗开关。 */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function BuildingSuppliersTable({
  createOpen,
  onCreateOpenChange,
}: BuildingSuppliersTableProps) {
  const { t } = useTranslation();
  const { data = [], isLoading } = useBuildingSuppliers();
  const deleteMutation = useDeleteBuildingSupplier();
  const bulkDeleteMutation = useBulkDeleteBuildingSuppliers();

  const [editTarget, setEditTarget] = React.useState<BuildingSupplierDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<BuildingSupplierDto | null>(null);
  const { bulkIds, setBulkIds, close: closeBulk } = useBulkIdsDialog();

  const columns = React.useMemo(
    () =>
      getBuildingSupplierColumns({
        t,
        onEdit: (buildingSupplier) => setEditTarget(buildingSupplier),
        onDelete: (buildingSupplier) => setDeleteTarget(buildingSupplier),
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
        searchPlaceholder={t('buildingSuppliers.searchPlaceholder')}
        emptyMessage={t('buildingSuppliers.empty')}
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
      <BuildingSupplierFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />

      {/* 编辑 */}
      <BuildingSupplierFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        buildingSupplier={editTarget ?? undefined}
      />

      {/* 删除确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('buildingSuppliers.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('buildingSuppliers.delete.confirmPrefix')}{' '}
              <span className="font-medium">{deleteTarget?.title}</span>
              {t('buildingSuppliers.delete.confirmSuffix')}
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
