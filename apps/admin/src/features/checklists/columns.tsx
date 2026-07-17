'use client';

/**
 * ChecklistTemplate 模板列定义 —— 工厂函数模式,照抄 features/workflow-categories/columns.tsx。
 * 列:title(点击进入子项管理) / 子项数;操作:管理子项 / 编辑 / 删除。
 */
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { ArrowUpDown, ListChecks, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { ChecklistTemplateDto } from '@nks/api-types';

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

export interface ChecklistTemplateColumnActions {
  /** i18n 翻译函数,由表格层传入以本地化表头/行操作。 */
  t: TFunction;
  onManageItems: (template: ChecklistTemplateDto) => void;
  onEdit: (template: ChecklistTemplateDto) => void;
  onDelete: (template: ChecklistTemplateDto) => void;
}

export function getChecklistTemplateColumns({
  t,
  onManageItems,
  onEdit,
  onDelete,
}: ChecklistTemplateColumnActions): ColumnDef<ChecklistTemplateDto>[] {
  return [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('checklists.columns.title')}
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <button
          type="button"
          className="text-primary font-medium hover:underline"
          onClick={() => onManageItems(row.original)}
        >
          {row.original.title ?? '—'}
        </button>
      ),
    },
    {
      id: 'itemCount',
      header: t('checklists.columns.itemCount'),
      enableSorting: false,
      cell: ({ row }) => {
        const count = row.original.checklistItemTemplateList?.length ?? 0;
        return <Badge variant="secondary">{count}</Badge>;
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('common.actions')}</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const template = row.original;
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
                <DropdownMenuItem onClick={() => onManageItems(template)}>
                  <ListChecks className="size-4" />
                  {t('checklists.manageItems')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Pencil className="size-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(template)}>
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
