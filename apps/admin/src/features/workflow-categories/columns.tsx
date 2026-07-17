'use client';

/**
 * WorkflowCategory 分类列定义 —— 工厂函数模式,照抄 features/contacts/columns.tsx。
 * 列:name / isDefault(badge);操作:管理步骤 / 编辑 / 删除。
 */
import type { ColumnDef } from '@tanstack/react-table';
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
  onManageSteps: (category: WorkflowCategoryDto) => void;
  onEdit: (category: WorkflowCategoryDto) => void;
  onDelete: (category: WorkflowCategoryDto) => void;
}

export function getWorkflowCategoryColumns({
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
          Navn
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
      header: 'Standard',
      cell: ({ row }) =>
        row.original.isDefault ? <Badge variant="secondary">Standard</Badge> : '—',
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Handlinger</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const category = row.original;
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
                <DropdownMenuItem onClick={() => onManageSteps(category)}>
                  <ListOrdered className="size-4" />
                  Administrer steg
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Pencil className="size-4" />
                  Rediger
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(category)}>
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
