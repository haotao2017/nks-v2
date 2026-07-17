'use client';

/**
 * 步骤子管理弹窗 —— 某个分类下的步骤增删改。
 *
 * - 列出该分类的步骤(按 stepSequence 排序):stepName / stepSequence / isActive / isTransferable。
 * - 顶部「Nytt steg」新建;每行下拉菜单编辑 / 删除。
 * - 新建/编辑复用 StepFormDialog;删除走 AlertDialog 确认。
 * - 步骤查询以 category.id 为 enabled 条件(见 useWorkflowCategorySteps)。
 */
import * as React from 'react';
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

import type { WorkflowCategoryDto, WorkflowCategoryStepDto } from '@nks/api-types';

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
import { Badge } from '@/components/ui/badge';
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

import { useWorkflowCategorySteps, useDeleteWorkflowCategoryStep } from './api';
import { StepFormDialog } from './step-form-dialog';

export interface WorkflowCategoryStepsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 当前正在管理步骤的分类;为空时不查询。 */
  category: WorkflowCategoryDto | null;
}

export function WorkflowCategoryStepsDialog({
  open,
  onOpenChange,
  category,
}: WorkflowCategoryStepsDialogProps) {
  const categoryId = category?.id ?? null;
  const { data: steps = [], isLoading } = useWorkflowCategorySteps(open ? categoryId : null);
  const deleteMutation = useDeleteWorkflowCategoryStep(categoryId ?? 0);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<WorkflowCategoryStepDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<WorkflowCategoryStepDto | null>(null);

  // 按 stepSequence 升序展示。
  const sortedSteps = React.useMemo(
    () => [...steps].sort((a, b) => (a.stepSequence ?? 0) - (b.stepSequence ?? 0)),
    [steps],
  );

  const nextSequence =
    sortedSteps.reduce((max, s) => Math.max(max, s.stepSequence ?? 0), 0) + 1;

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
            <DialogTitle>Steg — {category?.name}</DialogTitle>
            <DialogDescription>Administrer stegene i denne arbeidsflyten.</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button size="sm" onClick={() => setCreateOpen(true)} disabled={categoryId == null}>
              <Plus className="size-4" />
              Nytt steg
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Nr.</TableHead>
                  <TableHead>Stegnavn</TableHead>
                  <TableHead>Aktiv</TableHead>
                  <TableHead>Overførbar</TableHead>
                  <TableHead>
                    <span className="sr-only">Handlinger</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {Array.from({ length: 5 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : sortedSteps.length ? (
                  sortedSteps.map((step) => (
                    <TableRow key={step.id}>
                      <TableCell className="text-muted-foreground">{step.stepSequence ?? '—'}</TableCell>
                      <TableCell className="font-medium">{step.stepName ?? '—'}</TableCell>
                      <TableCell>
                        {step.isActive ? (
                          <Badge variant="secondary">Aktiv</Badge>
                        ) : (
                          <Badge variant="outline">Inaktiv</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {step.isTransferable ? (
                          <Badge variant="secondary">Ja</Badge>
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                              <span className="sr-only">Åpne meny</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setEditTarget(step)}>
                              <Pencil className="size-4" />
                              Rediger
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(step)}
                            >
                              <Trash2 className="size-4" />
                              Slett
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                      Ingen steg enda.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新建步骤 */}
      {categoryId != null && (
        <StepFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          categoryId={categoryId}
          defaultSequence={nextSequence}
        />
      )}

      {/* 编辑步骤 */}
      {categoryId != null && (
        <StepFormDialog
          open={editTarget !== null}
          onOpenChange={(o) => !o && setEditTarget(null)}
          categoryId={categoryId}
          step={editTarget ?? undefined}
        />
      )}

      {/* 删除确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slette steg?</AlertDialogTitle>
            <AlertDialogDescription>
              Er du sikker på at du vil slette{' '}
              <span className="font-medium">{deleteTarget?.stepName}</span>? Denne handlingen kan
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
