'use client';

/**
 * DocType 列定义 —— 照抄 features/contacts/columns.tsx 的工厂函数模式。
 * 列表列:docName / isRequired。
 */
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { DocType } from '@nks/api-types';

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

export interface DocTypeColumnActions {
  onEdit: (docType: DocType) => void;
  onDelete: (docType: DocType) => void;
}

export function getDocTypeColumns({
  onEdit,
  onDelete,
}: DocTypeColumnActions): ColumnDef<DocType>[] {
  return [
    {
      accessorKey: 'docName',
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
      cell: ({ row }) => <span className="font-medium">{row.original.docName ?? '—'}</span>,
    },
    {
      accessorKey: 'isRequired',
      header: 'Påkrevd',
      cell: ({ row }) =>
        row.original.isRequired ? (
          <Badge variant="default">Ja</Badge>
        ) : (
          <Badge variant="secondary">Nei</Badge>
        ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Handlinger</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const docType = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(docType)}>
                  <Pencil className="size-4" />
                  Rediger
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(docType)}>
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
