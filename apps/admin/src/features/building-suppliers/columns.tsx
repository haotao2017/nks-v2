'use client';

/**
 * BuildingSupplier 列定义 —— 照抄 features/contacts/columns.tsx 的工厂函数模式。
 * 列表列:title。
 */
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { BuildingSupplierDto } from '@nks/api-types';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface BuildingSupplierColumnActions {
  onEdit: (buildingSupplier: BuildingSupplierDto) => void;
  onDelete: (buildingSupplier: BuildingSupplierDto) => void;
}

export function getBuildingSupplierColumns({
  onEdit,
  onDelete,
}: BuildingSupplierColumnActions): ColumnDef<BuildingSupplierDto>[] {
  return [
    {
      accessorKey: 'title',
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
      cell: ({ row }) => <span className="font-medium">{row.original.title ?? '—'}</span>,
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Handlinger</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const buildingSupplier = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(buildingSupplier)}>
                  <Pencil className="size-4" />
                  Rediger
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(buildingSupplier)}
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
