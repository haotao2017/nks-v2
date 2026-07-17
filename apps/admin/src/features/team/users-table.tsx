'use client';

/**
 * Brukere(用户)编排层 —— 组合 DataTable + 用户表单弹窗 + 删除确认。
 * 照抄 features/contacts/contacts-table.tsx;新建时的 companyId 取自当前登录用户(useAuth)。
 */
import * as React from 'react';

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
import { useAuth } from '@/hooks/use-auth';

import { useUsers, useDeleteUser } from './api';
import { getUserColumns } from './user-columns';
import { UserFormDialog } from './user-form-dialog';

export interface UsersTableProps {
  /** 页面「Ny bruker」按钮控制的新建弹窗开关。 */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function UsersTable({ createOpen, onCreateOpenChange }: UsersTableProps) {
  const { user } = useAuth();
  const { data = [], isLoading } = useUsers();
  const deleteMutation = useDeleteUser();

  const [editTarget, setEditTarget] = React.useState<UserProfileDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<UserProfileDto | null>(null);

  const columns = React.useMemo(
    () =>
      getUserColumns({
        onEdit: (u) => setEditTarget(u),
        onDelete: (u) => setDeleteTarget(u),
      }),
    [],
  );

  const confirmDelete = () => {
    if (deleteTarget?.id == null) return;
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
        searchColumn="fullName"
        searchPlaceholder="Søk etter navn…"
        emptyMessage="Ingen brukere enda."
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
            <AlertDialogTitle>Slette bruker?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette{' '}
              <span className="font-medium">{deleteTarget?.fullName}</span>? Denne handlingen kan
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
