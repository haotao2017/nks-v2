'use client';

/**
 * WorkflowCategory 分类列定义 —— 工厂函数模式,照抄 features/contacts/columns.tsx。
 * 列:name / isDefault(badge);操作:管理步骤 / 编辑 / 删除。
 */
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { ArrowUpDown, ListOrdered, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { WorkflowCategoryDto } from '@nks/api-types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface WorkflowCategoryColumnActions {
  /** i18n 翻译函数,由表格层传入以本地化表头/行操作。 */
  t: TFunction;
  onManageSteps: (category: WorkflowCategoryDto) => void;
  onEdit: (category: WorkflowCategoryDto) => void;
  onDelete: (category: WorkflowCategoryDto) => void;
}

export function getWorkflowCategoryColumns({
  t,
  onManageSteps,
  onEdit,
  onDelete,
}: WorkflowCategoryColumnActions): ColumnDef<WorkflowCategoryDto>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('workflowCategories.columns.name')}
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-primary font-medium hover:underline"
          onClick={() => onManageSteps(row.original)}
        >
          {row.original.name ?? '—'}
        </button>
      ),
    },
    {
      accessorKey: 'isDefault',
      header: t('workflowCategories.columns.isDefault'),
      cell: ({ row }) =>
        row.original.isDefault ? (
          <Badge variant="secondary">{t('workflowCategories.defaultBadge')}</Badge>
        ) : (
          '—'
        ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('common.actions')}</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">{t('common.openMenu')}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onManageSteps(category)}>
                  <ListOrdered className="size-4" />
                  {t('workflowCategories.manageSteps')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Pencil className="size-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(category)}>
                  <Trash2 className="size-4" />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
