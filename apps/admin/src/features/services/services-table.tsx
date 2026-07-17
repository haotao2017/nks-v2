'use client';

/**
 * Services 模块编排层 —— 照抄 features/contacts/contacts-table.tsx。
 * 组合 DataTable + 表单弹窗 + 删除确认。
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

import { useServices, useDeleteService } from './api';
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

  const [editTarget, setEditTarget] = React.useState<ServiceDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ServiceDto | null>(null);

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

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchColumn="name"
        searchPlaceholder={t('services.searchPlaceholder')}
        emptyMessage={t('services.empty')}
      />

      {/* 新建 */}
      <ServiceFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />

      {/* 编辑 */}
      <ServiceFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        service={editTarget ?? undefined}
      />

      {/* 删除确认 */}
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
    </>
  );
}
