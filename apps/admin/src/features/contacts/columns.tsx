'use client';

/**
 * Contact 列定义 —— 工厂函数模式:接收行操作回调,返回 ColumnDef[]。
 * 其它模块照抄:改字段 + 改回调即可。
 */
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { ContactDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ContactColumnActions {
  onEdit: (contact: ContactDto) => void;
  onDelete: (contact: ContactDto) => void;
}

export function getContactColumns({
  onEdit,
  onDelete,
}: ContactColumnActions): ColumnDef<ContactDto>[] {
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
      cell: ({ row }) => <span className="font-medium">{row.original.name ?? '—'}</span>,
    },
    {
      accessorKey: 'contactNo',
      header: 'Telefon',
      cell: ({ row }) => row.original.contactNo || '—',
    },
    {
      accessorKey: 'email',
      header: 'E-post',
      cell: ({ row }) =>
        row.original.email ? (
          <a
            href={`mailto:${row.original.email}`}
            className="text-primary hover:underline"
          >
            {row.original.email}
          </a>
        ) : (
          '—'
        ),
    },
    {
      accessorKey: 'companyName',
      header: 'Firma',
      cell: ({ row }) => row.original.companyName || '—',
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Handlinger</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const contact = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(contact)}>
                  <Pencil className="size-4" />
                  Rediger
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(contact)}
                >
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
