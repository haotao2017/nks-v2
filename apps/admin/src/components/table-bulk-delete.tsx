'use client';

/**
 * 主数据表批量删除的共用 UI 片段（选中条 + 确认框）。
 * 各模块自己的 api useBulkDelete* 与 i18n key 前缀由调用方传入。
 */
import * as React from 'react';
import { Trash2 } from 'lucide-react';

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

export type BulkIdsState = { ids: number[]; clear: () => void } | null;

export function collectNumericIds<T extends { id?: number | null }>(rows: T[]): number[] {
  return rows.map((r) => r.id).filter((id): id is number => typeof id === 'number');
}

export function BulkDeleteToolbar({
  count,
  pending,
  onRequestDelete,
  onClear,
  selectedLabel,
  clearLabel,
  deleteLabel,
}: {
  count: number;
  pending: boolean;
  onRequestDelete: () => void;
  onClear: () => void;
  selectedLabel: string;
  clearLabel: string;
  deleteLabel: string;
}) {
  if (count === 0) return null;
  return (
    <>
      <span className="text-sm font-medium">{selectedLabel}</span>
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={onRequestDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="size-4" />
          {deleteLabel}
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={pending}>
          {clearLabel}
        </Button>
      </div>
    </>
  );
}

export function BulkDeleteConfirmDialog({
  bulkIds,
  onOpenChange,
  onConfirm,
  pending,
  title,
  description,
  cancelLabel,
  deleteLabel,
}: {
  bulkIds: BulkIdsState;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  pending: boolean;
  title: string;
  description: string;
  cancelLabel: string;
  deleteLabel: string;
}) {
  return (
    <AlertDialog open={bulkIds !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={pending}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {deleteLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** 精简 state + 确认回调模式，减少各 table 重复样板。 */
export function useBulkIdsDialog() {
  const [bulkIds, setBulkIds] = React.useState<BulkIdsState>(null);
  const close = React.useCallback(() => setBulkIds(null), []);
  return { bulkIds, setBulkIds, close };
}
