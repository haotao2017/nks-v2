'use client';

/**
 * DocTypes 模块编排层 —— 照抄 features/contacts/contacts-table.tsx。
 * 组合 DataTable + 表单弹窗 + 删除确认。
 */
import * as React from 'react';

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

import { useDocTypes, useDeleteDocType } from './api';
import { getDocTypeColumns } from './columns';
import { DocTypeFormDialog } from './doc-type-form-dialog';

export interface DocTypesTableProps {
  /** 页面「Ny dokumenttype」按钮控制的新建弹窗开关。 */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function DocTypesTable({ createOpen, onCreateOpenChange }: DocTypesTableProps) {
  const { data = [], isLoading } = useDocTypes();
  const deleteMutation = useDeleteDocType();

  const [editTarget, setEditTarget] = React.useState<DocType | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<DocType | null>(null);

  const columns = React.useMemo(
    () =>
      getDocTypeColumns({
        onEdit: (docType) => setEditTarget(docType),
        onDelete: (docType) => setDeleteTarget(docType),
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
        searchColumn="docName"
        searchPlaceholder="Søk etter navn…"
        emptyMessage="Ingen dokumenttyper enda."
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
            <AlertDialogTitle>Slette dokumenttype?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette{' '}
              <span className="font-medium">{deleteTarget?.docName}</span>? Denne handlingen kan
              ikke angres.
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
