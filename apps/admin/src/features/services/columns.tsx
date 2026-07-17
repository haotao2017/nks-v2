'use client';

/**
 * Service 列定义 —— 工厂函数模式,照抄 features/contacts/columns.tsx。
 * 列:name / description / rate + 行操作。
 */
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { ServiceDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface ServiceColumnActions {
  onEdit: (service: ServiceDto) => void;
  onDelete: (service: ServiceDto) => void;
}

export function getServiceColumns({
  onEdit,
  onDelete,
}: ServiceColumnActions): ColumnDef<ServiceDto>[] {
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
      accessorKey: 'description',
      header: 'Beskrivelse',
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1 max-w-md">
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'rate',
      header: 'Sats',
      cell: ({ row }) => row.original.rate || '—',
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Handlinger</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const service = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(service)}>
                  <Pencil className="size-4" />
                  Rediger
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(service)}
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
