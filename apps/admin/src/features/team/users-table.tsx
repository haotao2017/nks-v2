'use client';

/**
 * Brukere(用户)编排层 —— 组合 DataTable + 用户表单弹窗 + 单删/批量删除。
 * 照抄 features/contacts/contacts-table.tsx;新建时的 companyId 取自当前登录用户(useAuth)。
 */
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import type { UserProfileDto } from '@nks/api-types';

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
import { useAuth } from '@/hooks/use-auth';

import { useUsers, useDeleteUser, useBulkDeleteUsers } from './api';
import { getUserColumns } from './user-columns';
import { UserFormDialog } from './user-form-dialog';

export interface UsersTableProps {
  /** 页面「Ny bruker」按钮控制的新建弹窗开关。 */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function UsersTable({ createOpen, onCreateOpenChange }: UsersTableProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data = [], isLoading } = useUsers();
  const deleteMutation = useDeleteUser();
  const bulkDeleteMutation = useBulkDeleteUsers();

  const [editTarget, setEditTarget] = React.useState<UserProfileDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<UserProfileDto | null>(null);
  const { bulkIds, setBulkIds, close: closeBulk } = useBulkIdsDialog();

  const columns = React.useMemo(
    () =>
      getUserColumns({
        onEdit: (u) => setEditTarget(u),
        onDelete: (u) => setDeleteTarget(u),
        t,
      }),
    [t],
  );

  const confirmDelete = () => {
    if (deleteTarget?.id == null) return;
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
        searchColumn="fullName"
        searchPlaceholder={t('team.users.searchPlaceholder')}
        emptyMessage={t('team.users.empty')}
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

      {/* 新建(附带当前用户公司 id) */}
      <UserFormDialog
        open={createOpen}
        onOpenChange={onCreateOpenChange}
        companyId={user?.companyID}
      />

      {/* 编辑 */}
      <UserFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        user={editTarget ?? undefined}
      />

      {/* 删除确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('team.users.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              <Trans
                i18nKey="team.users.deleteConfirm"
                values={{ name: deleteTarget?.fullName ?? '' }}
                components={[<span className="font-medium" key="0" />]}
              />
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
