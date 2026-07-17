'use client';

/**
 * EmailTemplate 列定义 —— 工厂函数模式,照抄 features/contacts/columns.tsx。
 * 列:title;操作:预览 / 编辑 / 删除。
 */
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { EmailTemplateDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface EmailTemplateColumnActions {
  onPreview: (template: EmailTemplateDto) => void;
  onEdit: (template: EmailTemplateDto) => void;
  onDelete: (template: EmailTemplateDto) => void;
}

export function getEmailTemplateColumns({
  onPreview,
  onEdit,
  onDelete,
}: EmailTemplateColumnActions): ColumnDef<EmailTemplateDto>[] {
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
      cell: ({ row }) => <span className="font-medium">{row.original.title ?? '—'}</span>,
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
                <DropdownMenuItem onClick={() => onPreview(template)}>
                  <Eye className="size-4" />
                  Forhåndsvis
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
