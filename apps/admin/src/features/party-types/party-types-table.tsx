'use client';

/**
 * PartyTypes 模块编排层 —— 照抄 features/contacts/contacts-table.tsx。
 * 组合 DataTable + 表单弹窗 + 删除确认。
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

import { usePartyTypes, useDeletePartyType, useWorkflowCategoryOptions } from './api';
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

  const [editTarget, setEditTarget] = React.useState<PartyTypeDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<PartyTypeDto | null>(null);

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

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchColumn="name"
        searchPlaceholder={t('partyTypes.searchPlaceholder')}
        emptyMessage={t('partyTypes.empty')}
      />

      {/* 新建 */}
      <PartyTypeFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />

      {/* 编辑 */}
      <PartyTypeFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        partyType={editTarget ?? undefined}
      />

      {/* 删除确认 */}
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
    </>
  );
}
