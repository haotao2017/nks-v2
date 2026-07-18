'use client';

/**
 * PartyType 列定义 —— 工厂函数模式,照抄 features/contacts/columns.tsx。
 * 列:name / isDefault + 行操作。
 */
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { PartyTypeDto } from '@nks/api-types';

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

export interface PartyTypeColumnActions {
  /** i18n 翻译函数,由表格层传入以本地化表头/行操作。 */
  t: TFunction;
  /** workflowCategoryID → 类别名(Workflow 列显示名,与原系统一致)。 */
  workflowName: (id: number | null | undefined) => string;
  onEdit: (partyType: PartyTypeDto) => void;
  onDelete: (partyType: PartyTypeDto) => void;
}

export function getPartyTypeColumns({
  t,
  workflowName,
  onEdit,
  onDelete,
}: PartyTypeColumnActions): ColumnDef<PartyTypeDto>[] {
  return [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('partyTypes.columns.name')}
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.name ?? '—'}</span>,
    },
    {
      accessorKey: 'isDefault',
      header: t('partyTypes.columns.default'),
      cell: ({ row }) =>
        row.original.isDefault ? (
          <Badge>{t('common.yes')}</Badge>
        ) : (
          <Badge variant="secondary">{t('common.no')}</Badge>
        ),
    },
    {
      id: 'workflow',
      header: t('partyTypes.columns.workflow'),
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {workflowName(row.original.workflowCategoryID) || '—'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('common.actions')}</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const partyType = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(partyType)}>
                  <Pencil className="size-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDelete(partyType)}
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
