'use client';

/**
 * Contacts 模块编排层 —— 组合 DataTable + 表单弹窗 + 删除确认(+ 批量删除)。
 * 由页面通过 ref 暴露的 openCreate 触发新建(或页面自持 open 状态)。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';

import { useBulkDeleteContacts, useContacts, useDeleteContact } from './api';
import { getContactColumns } from './columns';
import { ContactFormDialog } from './contact-form-dialog';

export interface ContactsTableProps {
  /** 页面「Ny kontakt」按钮控制的新建弹窗开关。 */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function ContactsTable({ createOpen, onCreateOpenChange }: ContactsTableProps) {
  const { t } = useTranslation();
  const { data = [], isLoading } = useContacts();
  const deleteMutation = useDeleteContact();
  const bulkDeleteMutation = useBulkDeleteContacts();

  const [editTarget, setEditTarget] = React.useState<ContactDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ContactDto | null>(null);
  const [bulkIds, setBulkIds] = React.useState<{ ids: number[]; clear: () => void } | null>(
    null,
  );

  const columns = React.useMemo(
    () =>
      getContactColumns({
        t,
        onEdit: (contact) => setEditTarget(contact),
        onDelete: (contact) => setDeleteTarget(contact),
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
        setBulkIds(null);
      },
    });
  };

  const renderBulkActions = (rows: ContactDto[], clear: () => void) => {
    const ids = rows.map((r) => r.id).filter((id): id is number => typeof id === 'number');
    if (ids.length === 0) return null;
    return (
      <>
        <span className="text-sm font-medium">
          {t('contacts.bulk.selected', { count: ids.length })}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={bulkDeleteMutation.isPending}
            onClick={() => setBulkIds({ ids, clear })}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            {t('common.delete')}
          </Button>
          <Button variant="ghost" size="sm" onClick={clear} disabled={bulkDeleteMutation.isPending}>
            {t('contacts.bulk.clear')}
          </Button>
        </div>
      </>
    );
  };

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        isLoading={isLoading}
        searchColumn="name"
        searchPlaceholder={t('contacts.searchPlaceholder')}
        emptyMessage={t('contacts.empty')}
        enableRowSelection
        getRowId={(row, index) => String(row.id ?? index)}
        selectAllAriaLabel={t('contacts.bulk.selectAll')}
        selectRowAriaLabel={t('contacts.bulk.selectRow')}
        renderBulkActions={renderBulkActions}
      />

      {/* 新建 */}
      <ContactFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />

      {/* 编辑 */}
      <ContactFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        contact={editTarget ?? undefined}
      />

      {/* 单行删除确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('contacts.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('contacts.delete.confirmPrefix')}{' '}
              <span className="font-medium">{deleteTarget?.name}</span>
              {t('contacts.delete.confirmSuffix')}
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

      {/* 批量删除确认 */}
      <AlertDialog open={bulkIds !== null} onOpenChange={(open) => !open && setBulkIds(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('contacts.bulkDeleteDialog.title', { count: bulkIds?.ids.length ?? 0 })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('contacts.bulkDeleteDialog.description', {
                count: bulkIds?.ids.length ?? 0,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkDeleteMutation.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmBulkDelete();
              }}
              disabled={bulkDeleteMutation.isPending}
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
