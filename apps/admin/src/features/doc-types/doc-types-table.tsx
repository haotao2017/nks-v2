'use client';

/**
 * DocTypes 模块编排层 —— 照抄 features/contacts/contacts-table.tsx。
 * 组合 DataTable + 表单弹窗 + 删除确认。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import type { DocType } from '@nks/api-types';

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
import { usePartyTypes } from '@/features/party-types/api';

import { useDocTypes, useDeleteDocType } from './api';
import { getDocTypeColumns } from './columns';
import { DocTypeFormDialog } from './doc-type-form-dialog';

export interface DocTypesTableProps {
  /** 页面「Ny dokumenttype」按钮控制的新建弹窗开关。 */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function DocTypesTable({ createOpen, onCreateOpenChange }: DocTypesTableProps) {
  const { t } = useTranslation();
  const { data = [], isLoading } = useDocTypes();
  const { data: partyTypes = [] } = usePartyTypes();
  const deleteMutation = useDeleteDocType();

  const [editTarget, setEditTarget] = React.useState<DocType | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DocType | null>(null);

  const partyTypeName = React.useCallback(
    (id: number | null | undefined) =>
      id == null ? '' : (partyTypes.find((p) => p.id === id)?.name ?? ''),
    [partyTypes],
  );

  const columns = React.useMemo(
    () =>
      getDocTypeColumns({
        t,
        partyTypeName,
        onEdit: (docType) => setEditTarget(docType),
        onDelete: (docType) => setDeleteTarget(docType),
      }),
    [t, partyTypeName],
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
        searchColumn="docName"
        searchPlaceholder={t('docTypes.searchPlaceholder')}
        emptyMessage={t('docTypes.empty')}
      />

      {/* 新建 */}
      <DocTypeFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />

      {/* 编辑 */}
      <DocTypeFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        docType={editTarget ?? undefined}
      />

      {/* 删除确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('docTypes.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('docTypes.delete.confirmPrefix')}{' '}
              <span className="font-medium">{deleteTarget?.docName}</span>
              {t('docTypes.delete.confirmSuffix')}
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
