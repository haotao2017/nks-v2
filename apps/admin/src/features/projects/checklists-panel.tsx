'use client';

/**
 * 项目检查清单面板 —— 对应原系统 Wf1S6-opprett-sjekklister 的完整 CRUD。
 *
 * 交互:
 *  - 列出项目清单(名称 + 项数),项数来自逐条 GetSingle(useProjectChecklistDetails,共享 detail 缓存)。
 *  - 顶部从「清单模板」下拉选择后一键新建(名称取模板名,含模板全部项);另有「空清单」按钮弹窗输入名称。
 *  - 每行下拉菜单:管理清单项(弹窗)/ 编辑名称(弹窗)/ 删除(AlertDialog 确认)。
 *  - 清单项弹窗:列项、新建 / 编辑(title + sortOrder)、删除(AlertDialog 确认)。
 *
 * 说明:sortOrder 可上送但 GetSingle 详情不回带,编辑时以行号占位、仅用于控制后端排序。
 */
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { z } from 'zod';
import { Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';

import type {
  ChecklistItemSimpleDto,
  ProjectChecklistSimpleDto,
} from '@nks/api-types';

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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  useCreateProjectChecklist,
  useCreateProjectChecklistItem,
  useDeleteProjectChecklist,
  useDeleteProjectChecklistItem,
  useProjectChecklist,
  useProjectChecklistDetails,
  useProjectChecklistTemplates,
  useProjectChecklists,
  useUpdateProjectChecklist,
  useUpdateProjectChecklistItem,
} from './checklist-api';

// ── 主面板 ──────────────────────────────────────────────────────────────

export function ProjectChecklistsPanel({ projectId }: { projectId: number }) {
  const { t } = useTranslation();

  const { data: checklists = [], isLoading } = useProjectChecklists(projectId);
  const { data: templates = [] } = useProjectChecklistTemplates();
  const createMutation = useCreateProjectChecklist(projectId);
  const deleteMutation = useDeleteProjectChecklist(projectId);

  // 逐条拉详情以取项数(共享 detail 缓存,打开项弹窗即命中)。
  const detailQueries = useProjectChecklistDetails(checklists.map((c) => c.id ?? 0));
  const countById = new Map<number, number | undefined>();
  checklists.forEach((c, i) => {
    countById.set(c.id ?? 0, detailQueries[i]?.data?.projectChecklistItems?.length);
  });

  const [templateValue, setTemplateValue] = React.useState<string>('');
  const [createOpen, setCreateOpen] = React.useState(false);
  const [renameTarget, setRenameTarget] = React.useState<ProjectChecklistSimpleDto | null>(null);
  const [itemsTarget, setItemsTarget] = React.useState<ProjectChecklistSimpleDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ProjectChecklistSimpleDto | null>(null);

  const createFromTemplate = () => {
    const template = templates.find((tpl) => String(tpl.id) === templateValue);
    if (!template) return;
    createMutation.mutate(
      {
        checklistName: template.title ?? '',
        items: (template.checklistItemTemplateList ?? []).map((it) => ({ title: it.title ?? '' })),
      },
      { onSuccess: () => setTemplateValue('') },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget?.id) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('checklistPanel.title')}</CardTitle>
        <CardDescription>{t('checklistPanel.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 新建工具栏:从模板 + 空清单 */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={templateValue} onValueChange={setTemplateValue}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={t('checklistPanel.template.placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {templates.length ? (
                templates.map((tpl) => (
                  <SelectItem key={tpl.id} value={String(tpl.id)}>
                    {tpl.title ?? `#${tpl.id}`}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__none" disabled>
                  {t('checklistPanel.template.none')}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          <Button
            onClick={createFromTemplate}
            disabled={!templateValue || createMutation.isPending}
          >
            {createMutation.isPending && <Loader2 className="size-4 animate-spin" />}
            {t('checklistPanel.template.createButton')}
          </Button>
          <Button variant="outline" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            {t('checklistPanel.emptyChecklistButton')}
          </Button>
        </div>

        {/* 清单列表 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('checklistPanel.columns.name')}</TableHead>
                <TableHead className="w-32">{t('checklistPanel.columns.itemCount')}</TableHead>
                <TableHead className="w-16">
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
              ) : checklists.length ? (
                checklists.map((c) => {
                  const count = countById.get(c.id ?? 0);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.checklistName || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {count ?? '…'}
                      </TableCell>
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
                            <DropdownMenuItem onClick={() => setItemsTarget(c)}>
                              <Pencil className="size-4" />
                              {t('checklistPanel.actions.items')}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setRenameTarget(c)}>
                              <Pencil className="size-4" />
                              {t('checklistPanel.actions.rename')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(c)}
                            >
                              <Trash2 className="size-4" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground h-24 text-center">
                    {t('checklistPanel.empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* 新建空清单 */}
      <ChecklistNameDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        pending={createMutation.isPending}
        onSubmit={(name) =>
          createMutation.mutate({ checklistName: name }, { onSuccess: () => setCreateOpen(false) })
        }
      />

      {/* 编辑名称 */}
      <RenameChecklistDialog
        projectId={projectId}
        target={renameTarget}
        onClose={() => setRenameTarget(null)}
      />

      {/* 清单项管理 */}
      <ChecklistItemsDialog
        projectId={projectId}
        target={itemsTarget}
        onClose={() => setItemsTarget(null)}
      />

      {/* 删除清单确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('checklistPanel.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('checklistPanel.delete.confirmPrefix')}{' '}
              <span className="font-medium">{deleteTarget?.checklistName}</span>
              {t('checklistPanel.delete.confirmSuffix')}
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
    </Card>
  );
}

// ── 清单名称弹窗(新建空清单 / 编辑名称共用) ──────────────────────────

const makeNameSchema = (t: TFunction) =>
  z.object({
    name: z.string().trim().min(1, t('checklistPanel.validation.nameRequired')),
  });

type NameFormValues = z.infer<ReturnType<typeof makeNameSchema>>;

function ChecklistNameDialog({
  open,
  onOpenChange,
  mode,
  pending,
  defaultName = '',
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'rename';
  pending: boolean;
  defaultName?: string;
  onSubmit: (name: string) => void;
}) {
  const { t } = useTranslation();
  const schema = React.useMemo(() => makeNameSchema(t), [t]);
  const form = useForm<NameFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultName },
  });

  React.useEffect(() => {
    if (open) form.reset({ name: defaultName });
  }, [open, defaultName, form]);

  const submit = form.handleSubmit((values) => onSubmit(values.name));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'create'
              ? t('checklistPanel.create.title')
              : t('checklistPanel.rename.title')}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? t('checklistPanel.create.description')
              : t('checklistPanel.rename.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={submit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checklistPanel.create.nameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('checklistPanel.create.namePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                {mode === 'create' ? t('common.create') : t('common.save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

/** 编辑名称:承接 target,内部持有 update mutation。 */
function RenameChecklistDialog({
  projectId,
  target,
  onClose,
}: {
  projectId: number;
  target: ProjectChecklistSimpleDto | null;
  onClose: () => void;
}) {
  const updateMutation = useUpdateProjectChecklist(projectId);
  return (
    <ChecklistNameDialog
      open={target !== null}
      onOpenChange={(o) => !o && onClose()}
      mode="rename"
      pending={updateMutation.isPending}
      defaultName={target?.checklistName ?? ''}
      onSubmit={(name) => {
        if (!target?.id) return;
        updateMutation.mutate(
          { id: target.id, checklistName: name },
          { onSuccess: () => onClose() },
        );
      }}
    />
  );
}

// ── 清单项管理弹窗 ──────────────────────────────────────────────────────

function ChecklistItemsDialog({
  projectId,
  target,
  onClose,
}: {
  projectId: number;
  target: ProjectChecklistSimpleDto | null;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const open = target !== null;
  const checklistId = target?.id ?? null;
  const { data: detail, isLoading } = useProjectChecklist(open ? checklistId : null);
  const deleteMutation = useDeleteProjectChecklistItem(projectId, checklistId ?? 0);

  const items = detail?.projectChecklistItems ?? [];

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<ChecklistItemSimpleDto | null>(null);
  const [editIndex, setEditIndex] = React.useState(0);
  const [deleteTarget, setDeleteTarget] = React.useState<ChecklistItemSimpleDto | null>(null);

  const confirmDelete = () => {
    if (!deleteTarget?.id) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {t('checklistPanel.items.dialogTitle', { name: target?.checklistName ?? '' })}
            </DialogTitle>
            <DialogDescription>{t('checklistPanel.items.dialogDescription')}</DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              disabled={checklistId == null}
            >
              <Plus className="size-4" />
              {t('checklistPanel.items.newButton')}
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">{t('checklistPanel.items.columns.sequence')}</TableHead>
                  <TableHead>{t('checklistPanel.items.columns.title')}</TableHead>
                  <TableHead className="w-16">
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
                            <DropdownMenuItem
                              onClick={() => {
                                setEditTarget(item);
                                setEditIndex(index);
                              }}
                            >
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
                      {t('checklistPanel.items.empty')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新建项 */}
      {checklistId != null && (
        <ChecklistItemFormDialog
          projectId={projectId}
          checklistId={checklistId}
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultSortOrder={items.length + 1}
        />
      )}

      {/* 编辑项 */}
      {checklistId != null && (
        <ChecklistItemFormDialog
          projectId={projectId}
          checklistId={checklistId}
          open={editTarget !== null}
          onOpenChange={(o) => !o && setEditTarget(null)}
          item={editTarget ?? undefined}
          defaultSortOrder={editIndex + 1}
        />
      )}

      {/* 删除项确认 */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('checklistPanel.items.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('checklistPanel.items.delete.confirmPrefix')}{' '}
              <span className="font-medium">{deleteTarget?.title}</span>
              {t('checklistPanel.items.delete.confirmSuffix')}
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

// ── 清单项表单弹窗(新建 / 编辑) ──────────────────────────────────────

const makeItemSchema = (t: TFunction) =>
  z.object({
    title: z.string().trim().min(1, t('checklistPanel.items.validation.titleRequired')),
    // sortOrder 以字符串维护(数字输入框),提交时再解析为 number,避免 z.coerce 与 RHF resolver 泛型冲突。
    sortOrder: z.string().trim().optional(),
  });

type ItemFormValues = z.infer<ReturnType<typeof makeItemSchema>>;

function ChecklistItemFormDialog({
  projectId,
  checklistId,
  open,
  onOpenChange,
  item,
  defaultSortOrder,
}: {
  projectId: number;
  checklistId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: ChecklistItemSimpleDto;
  defaultSortOrder: number;
}) {
  const { t } = useTranslation();
  const isEdit = Boolean(item?.id);
  const createMutation = useCreateProjectChecklistItem(projectId, checklistId);
  const updateMutation = useUpdateProjectChecklistItem(projectId, checklistId);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const schema = React.useMemo(() => makeItemSchema(t), [t]);
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', sortOrder: String(defaultSortOrder) },
  });

  React.useEffect(() => {
    if (open) {
      form.reset({ title: item?.title ?? '', sortOrder: String(defaultSortOrder) });
    }
  }, [open, item, defaultSortOrder, form]);

  const onSubmit = form.handleSubmit((values) => {
    const parsed = values.sortOrder ? Number(values.sortOrder) : NaN;
    const sortOrder = Number.isFinite(parsed) ? parsed : undefined;
    if (isEdit && item?.id) {
      updateMutation.mutate(
        { id: item.id, title: values.title, sortOrder },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(
        { title: values.title, sortOrder },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t('checklistPanel.items.form.editTitle')
              : t('checklistPanel.items.form.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('checklistPanel.items.form.editDescription')
              : t('checklistPanel.items.form.createDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checklistPanel.items.form.title')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('checklistPanel.items.form.titlePlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sortOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('checklistPanel.items.form.sortOrder')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={t('checklistPanel.items.form.sortOrderPlaceholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="size-4 animate-spin" />}
                {isEdit ? t('common.save') : t('common.create')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
