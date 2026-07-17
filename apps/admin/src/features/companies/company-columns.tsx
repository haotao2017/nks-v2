'use client';

/**
 * 公司列定义 —— 超级管理面板只读列表。字段取自 CompanyProfile(GetAllProfiles 返回)。
 */
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

import type { CompanyProfile } from '@nks/api-types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function getCompanyColumns(): ColumnDef<CompanyProfile>[] {
  return [
    {
      accessorKey: 'companyName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Selskap
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.companyName ?? '—'}</span>,
    },
    {
      accessorKey: 'organizationalNumber',
      header: 'Org.nr',
      cell: ({ row }) => row.original.organizationalNumber || '—',
    },
    {
      accessorKey: 'ownerName',
      header: 'Eier',
      cell: ({ row }) => row.original.ownerName || '—',
    },
    {
      accessorKey: 'emailAddress',
      header: 'E-post',
      cell: ({ row }) => row.original.emailAddress || '—',
    },
    {
      accessorKey: 'isSystemOwner',
      header: 'Systemeier',
      cell: ({ row }) =>
        row.original.isSystemOwner ? <Badge variant="secondary">Systemeier</Badge> : <span>—</span>,
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
  ];
}
