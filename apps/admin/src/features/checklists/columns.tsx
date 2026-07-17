'use client';

/**
 * ChecklistTemplate 模板列定义 —— 工厂函数模式,照抄 features/workflow-categories/columns.tsx。
 * 列:title(点击进入子项管理) / 子项数;操作:管理子项 / 编辑 / 删除。
 */
import type { ColumnDef } from '@tanstack/react-table';
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
  onManageItems: (template: ChecklistTemplateDto) => void;
  onEdit: (template: ChecklistTemplateDto) => void;
  onDelete: (template: ChecklistTemplateDto) => void;
}

export function getChecklistTemplateColumns({
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
          Tittel
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
      header: 'Sjekkpunkter',
      enableSorting: false,
      cell: ({ row }) => {
        const count = row.original.checklistItemTemplateList?.length ?? 0;
        return <Badge variant="secondary">{count}</Badge>;
      },
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Handlinger</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const template = row.original;
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8">
                  <MoreHorizontal className="size-4" />
                  <span className="sr-only">Åpne meny</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Handlinger</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onManageItems(template)}>
                  <ListChecks className="size-4" />
                  Administrer sjekkpunkter
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(template)}>
                  <Pencil className="size-4" />
                  Rediger
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(template)}>
                  <Trash2 className="size-4" />
                  Slett
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
