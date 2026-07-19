'use client';

/**
 * 公司列定义 —— 超级管理面板列表。字段取自 CompanyProfile(GetAllProfiles 返回)。
 * 行操作:编辑公司 / 新建管理员 / 文件夹配置。
 */
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { ArrowUpDown, FolderCog, MoreHorizontal, Pencil, UserPlus } from 'lucide-react';

import type { CompanyProfile } from '@nks/api-types';

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

export interface CompanyColumnActions {
  onEdit: (company: CompanyProfile) => void;
  onCreateAdmin: (company: CompanyProfile) => void;
  onFolders: (company: CompanyProfile) => void;
  t: TFunction;
}

export function getCompanyColumns({
  onEdit,
  onCreateAdmin,
  onFolders,
  t,
}: CompanyColumnActions): ColumnDef<CompanyProfile>[] {
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
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('common.actions')}</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const company = row.original;
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
                <DropdownMenuItem onClick={() => onEdit(company)}>
                  <Pencil className="size-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreateAdmin(company)}>
                  <UserPlus className="size-4" />
                  {t('companies.rowActions.createAdmin')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onFolders(company)}>
                  <FolderCog className="size-4" />
                  {t('companies.rowActions.folders')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
