'use client';

/**
 * Contacts 模块编排层 —— 组合 DataTable + 表单弹窗 + 删除确认。
 * 由页面通过 ref 暴露的 openCreate 触发新建(或页面自持 open 状态)。
 */
import * as React from 'react';

import type { ContactDto } from '@nks/api-types';

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

import { useContacts, useDeleteContact } from './api';
import { getContactColumns } from './columns';
import { ContactFormDialog } from './contact-form-dialog';

export interface ContactsTableProps {
  /** 页面「Ny kontakt」按钮控制的新建弹窗开关。 */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function ContactsTable({ createOpen, onCreateOpenChange }: ContactsTableProps) {
  const { data = [], isLoading } = useContacts();
  const deleteMutation = useDeleteContact();

  const [editTarget, setEditTarget] = React.useState<ContactDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ContactDto | null>(null);

  const columns = React.useMemo(
    () =>
      getContactColumns({
        onEdit: (contact) => setEditTarget(contact),
        onDelete: (contact) => setDeleteTarget(contact),
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
        emptyMessage="Ingen kontakter enda."
      />

      {/* 新建 */}
      <ContactFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />

      {/* 编辑 */}
      <ContactFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        contact={editTarget ?? undefined}
      />

      {/* 删除确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette kontakt?</AlertDialogTitle>
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
