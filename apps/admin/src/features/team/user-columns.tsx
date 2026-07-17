'use client';

/**
 * Bruker(用户)列定义 —— 工厂函数模式,照抄 features/contacts/columns.tsx。
 * 字段取自 UserProfileDto(GetAllUserProfile 返回)。
 */
import type { ColumnDef } from '@tanstack/react-table';
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

import { userTypeLabel } from './api';

export interface UserColumnActions {
  onEdit: (user: UserProfileDto) => void;
  onDelete: (user: UserProfileDto) => void;
}

export function getUserColumns({ onEdit, onDelete }: UserColumnActions): ColumnDef<UserProfileDto>[] {
  return [
    {
      accessorKey: 'fullName',
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
      cell: ({ row }) => <span className="font-medium">{row.original.fullName ?? '—'}</span>,
    },
    {
      accessorKey: 'userName',
      header: 'Brukernavn',
      cell: ({ row }) => row.original.userName || '—',
    },
    {
      accessorKey: 'designation',
      header: 'Tittel',
      cell: ({ row }) => row.original.designation || '—',
    },
    {
      accessorKey: 'userTypeId',
      header: 'Brukertype',
      cell: ({ row }) => userTypeLabel(row.original.userTypeId),
    },
    {
      accessorKey: 'isAdmin',
      header: 'Admin',
      cell: ({ row }) =>
        row.original.isAdmin ? <Badge variant="secondary">Admin</Badge> : <span>—</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="secondary">Aktiv</Badge>
        ) : (
          <Badge variant="outline">Inaktiv</Badge>
        ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Handlinger</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const user = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Pencil className="size-4" />
                  Rediger
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(user)}>
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
