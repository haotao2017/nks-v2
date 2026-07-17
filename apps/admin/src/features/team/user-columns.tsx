'use client';

/**
 * Bruker(用户)列定义 —— 工厂函数模式,照抄 features/contacts/columns.tsx。
 * 字段取自 UserProfileDto(GetAllUserProfile 返回)。
 */
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { ArrowUpDown, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import type { UserProfileDto } from '@nks/api-types';

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

export interface UserColumnActions {
  onEdit: (user: UserProfileDto) => void;
  onDelete: (user: UserProfileDto) => void;
  t: TFunction;
}

export function getUserColumns({
  onEdit,
  onDelete,
  t,
}: UserColumnActions): ColumnDef<UserProfileDto>[] {
  return [
    {
      accessorKey: 'fullName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('team.users.columns.name')}
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.fullName ?? '—'}</span>,
    },
    {
      accessorKey: 'userName',
      header: t('team.users.columns.userName'),
      cell: ({ row }) => row.original.userName || '—',
    },
    {
      accessorKey: 'designation',
      header: t('team.users.columns.designation'),
      cell: ({ row }) => row.original.designation || '—',
    },
    {
      accessorKey: 'userTypeId',
      header: t('team.users.columns.userType'),
      cell: ({ row }) =>
        t(`team.userTypes.${row.original.userTypeId}`, {
          defaultValue: t('team.userTypes.unknown'),
        }),
    },
    {
      accessorKey: 'isAdmin',
      header: t('team.users.columns.admin'),
      cell: ({ row }) =>
        row.original.isAdmin ? (
          <Badge variant="secondary">{t('team.users.badges.admin')}</Badge>
        ) : (
          <span>—</span>
        ),
    },
    {
      accessorKey: 'isActive',
      header: t('team.users.columns.status'),
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="secondary">{t('team.users.badges.active')}</Badge>
        ) : (
          <Badge variant="outline">{t('team.users.badges.inactive')}</Badge>
        ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('common.actions')}</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Pencil className="size-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(user)}>
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
