'use client';

/**
 * Service 列定义 —— 工厂函数模式,照抄 features/contacts/columns.tsx。
 * 列:name / description / rate + 行操作。
 */
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
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
  /** i18n 翻译函数,由表格层传入以本地化表头/行操作。 */
  t: TFunction;
  onEdit: (service: ServiceDto) => void;
  onDelete: (service: ServiceDto) => void;
}

export function getServiceColumns({
  t,
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
          {t('services.columns.name')}
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.name ?? '—'}</span>,
    },
    {
      accessorKey: 'description',
      header: t('services.columns.description'),
      cell: ({ row }) => (
        <span className="text-muted-foreground line-clamp-1 max-w-md">
          {row.original.description || '—'}
        </span>
      ),
    },
    {
      accessorKey: 'rate',
      header: t('services.columns.rate'),
      cell: ({ row }) => row.original.rate || '—',
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('common.actions')}</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const service = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(service)}>
                  <Pencil className="size-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(service)}
                >
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
