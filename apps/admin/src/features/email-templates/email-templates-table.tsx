'use client';

/**
 * EmailTemplate 模块编排层 —— 照抄 contacts-table:DataTable + 表单弹窗 + 预览 + 删除确认。
 */
import * as React from 'react';

import type { EmailTemplateDto } from '@nks/api-types';

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

import { useEmailTemplates, useDeleteEmailTemplate } from './api';
import { getEmailTemplateColumns } from './columns';
import { EmailTemplateFormDialog } from './email-template-form-dialog';
import { EmailTemplatePreviewDialog } from './email-template-preview-dialog';

export interface EmailTemplatesTableProps {
  /** 页面「Ny e-postmal」按钮控制的新建弹窗开关。 */
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}

export function EmailTemplatesTable({ createOpen, onCreateOpenChange }: EmailTemplatesTableProps) {
  const { data = [], isLoading } = useEmailTemplates();
  const deleteMutation = useDeleteEmailTemplate();

  const [editTarget, setEditTarget] = React.useState<EmailTemplateDto | null>(null);
  const [previewTarget, setPreviewTarget] = React.useState<EmailTemplateDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<EmailTemplateDto | null>(null);

  const columns = React.useMemo(
    () =>
      getEmailTemplateColumns({
        onPreview: (t) => setPreviewTarget(t),
        onEdit: (t) => setEditTarget(t),
        onDelete: (t) => setDeleteTarget(t),
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
        searchColumn="title"
        searchPlaceholder="Søk etter tittel…"
        emptyMessage="Ingen e-postmaler enda."
      />

      {/* 新建 */}
      <EmailTemplateFormDialog open={createOpen} onOpenChange={onCreateOpenChange} />

      {/* 编辑 */}
      <EmailTemplateFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
        emailTemplate={editTarget ?? undefined}
      />

      {/* 预览 */}
      <EmailTemplatePreviewDialog
        open={previewTarget !== null}
        onOpenChange={(open) => !open && setPreviewTarget(null)}
        emailTemplate={previewTarget ?? undefined}
      />

      {/* 删除确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette e-postmal?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette{' '}
              <span className="font-medium">{deleteTarget?.title}</span>? Denne handlingen kan ikke
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
