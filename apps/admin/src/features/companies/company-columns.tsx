'use client';

/**
 * 公司列定义 —— 超级管理面板只读列表。字段取自 CompanyProfile(GetAllProfiles 返回)。
 */
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { ArrowUpDown } from 'lucide-react';

import type { CompanyProfile } from '@nks/api-types';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function getCompanyColumns(t: TFunction): ColumnDef<CompanyProfile>[] {
  return [
    {
      accessorKey: 'companyName',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('companies.columns.company')}
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => <span className="font-medium">{row.original.companyName ?? '—'}</span>,
    },
    {
      accessorKey: 'organizationalNumber',
      header: t('companies.columns.orgNumber'),
      cell: ({ row }) => row.original.organizationalNumber || '—',
    },
    {
      accessorKey: 'ownerName',
      header: t('companies.columns.owner'),
      cell: ({ row }) => row.original.ownerName || '—',
    },
    {
      accessorKey: 'emailAddress',
      header: t('companies.columns.email'),
      cell: ({ row }) => row.original.emailAddress || '—',
    },
    {
      accessorKey: 'isSystemOwner',
      header: t('companies.columns.systemOwner'),
      cell: ({ row }) =>
        row.original.isSystemOwner ? (
          <Badge variant="secondary">{t('companies.badges.systemOwner')}</Badge>
        ) : (
          <span>—</span>
        ),
    },
    {
      accessorKey: 'isActive',
      header: t('companies.columns.status'),
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="secondary">{t('companies.badges.active')}</Badge>
        ) : (
          <Badge variant="outline">{t('companies.badges.inactive')}</Badge>
        ),
    },
  ];
}
