'use client';

/**
 * 子项管理弹窗 —— 某个模板下的检查项增删改,照抄 workflow-category-steps-dialog。
 *
 * - 子项来自 GetChecklistTemplate 返回的 checklistItemTemplateList(见 useChecklistTemplate)。
 * - 顶部「Nytt sjekkpunkt」新建;每行下拉菜单编辑 / 删除。
 * - 新建/编辑复用 ChecklistItemFormDialog;删除走 AlertDialog 确认。
 * - sortOrder 为后端 @JsonIgnore 不出现,故仅按返回顺序展示,序号用行号。
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

import type { ChecklistTemplateDto, ChecklistItemTemplateDto } from '@nks/api-types';

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useChecklistTemplate, useDeleteChecklistItem } from './api';
import { ChecklistItemFormDialog } from './checklist-item-form-dialog';

export interface ChecklistTemplateItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 当前正在管理子项的模板;为空时不查询。 */
  template: ChecklistTemplateDto | null;
}

export function ChecklistTemplateItemsDialog({
  open,
  onOpenChange,
  template,
}: ChecklistTemplateItemsDialogProps) {
  const { t } = useTranslation();
  const templateId = template?.id ?? null;
  const { data: detail, isLoading } = useChecklistTemplate(open ? templateId : null);
  const deleteMutation = useDeleteChecklistItem(templateId ?? 0);

  const items = detail?.checklistItemTemplateList ?? [];

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ChecklistItemTemplateDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ChecklistItemTemplateDto | null>(null);

  const confirmDelete = () => {
    if (!deleteTarget?.id) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('checklists.items.dialogTitle', { name: template?.title ?? '' })}
            </DialogTitle>
            <DialogDescription>{t('checklists.items.dialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreateOpen(true)} disabled={templateId == null}>
              <Plus className="size-4" />
              {t('checklists.items.newButton')}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">{t('checklists.items.columns.sequence')}</TableHead>
                  <TableHead>{t('checklists.items.columns.title')}</TableHead>
                  <TableHead>
                    <span className="sr-only">{t('common.actions')}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {Array.from({ length: 3 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length ? (
                  items.map((item, index) => (
                    <TableRow key={item.id ?? index}>
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.title ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">{t('common.openMenu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditTarget(item)}>
                              <Pencil className="size-4" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(item)}
                            >
                              <Trash2 className="size-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                      {t('checklists.items.empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新建子项 */}
      {templateId != null && (
        <ChecklistItemFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          templateId={templateId}
        />
      )}

      {/* 编辑子项 */}
      {templateId != null && (
        <ChecklistItemFormDialog
          open={editTarget !== null}
          onOpenChange={(o) => !o && setEditTarget(null)}
          templateId={templateId}
          item={editTarget ?? undefined}
        />
      )}

      {/* 删除确认 */}
      <AlertDialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('checklists.items.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('checklists.items.delete.confirmPrefix')}{' '}
              <span className="font-medium">{deleteTarget?.title}</span>
              {t('checklists.items.delete.confirmSuffix')}
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
