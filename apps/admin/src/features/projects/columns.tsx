'use client';

/**
 * Project 列表列定义 —— 工厂函数,按列表变体(active/archived/deleted)决定行操作。
 *
 * 行数据用共同的窄类型 ProjectRow 承接:活动列表是精简 ProjectListDto(仅 id/title/dated),
 * 归档/删除列表是全量 ProjectDto。列集合对齐旧系统三处统一:Title(Name)+ Dato(Created)+ 行操作。
 * 活动列表端点不返回 address/projectStatus,故不再渲染这两列(旧系统亦如此)。
 */
import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { ArrowUpDown, MoreHorizontal, Archive, ArchiveRestore, Trash2, RotateCcw, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/** 三个列表共用的窄行类型。 */
export interface ProjectRow {
  id?: number;
  title?: string;
  dated?: string;
  address?: string;
  projectStatus?: string;
}

export type ProjectListVariant = 'active' | 'archived' | 'deleted';

export interface ProjectColumnActions {
  variant: ProjectListVariant;
  t: TFunction;
  onOpen: (row: ProjectRow) => void;
  onArchive?: (row: ProjectRow) => void;
  onUnarchive?: (row: ProjectRow) => void;
  onDelete?: (row: ProjectRow) => void;
  onRestore?: (row: ProjectRow) => void;
}

/** 挪威语短日期(容错:非法值回退 '—')。 */
function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('nb-NO', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

export function getProjectColumns(actions: ProjectColumnActions): ColumnDef<ProjectRow>[] {
  const { variant, t, onOpen, onArchive, onUnarchive, onDelete, onRestore } = actions;

  return [
    {
      accessorKey: 'title',
      header: ({ column }) => (
        <Button
          variant="ghost"
          className="-ml-3 h-8"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          {t('projects.columns.title')}
          <ArrowUpDown className="size-3.5" />
        </Button>
      ),
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => onOpen(row.original)}
          className="text-primary font-medium hover:underline"
        >
          {row.original.title || '—'}
        </button>
      ),
    },
    {
      accessorKey: 'dated',
      header: t('projects.columns.date'),
      cell: ({ row }) => formatDate(row.original.dated),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">{t('common.actions')}</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original;
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
                <DropdownMenuItem onClick={() => onOpen(item)}>
                  <ExternalLink className="size-4" />
                  {t('projects.actions.open')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {variant === 'active' && (
                  <>
                    <DropdownMenuItem onClick={() => onArchive?.(item)}>
                      <Archive className="size-4" />
                      {t('projects.actions.archive')}
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={() => onDelete?.(item)}>
                      <Trash2 className="size-4" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  </>
                )}

                {variant === 'archived' && (
                  <DropdownMenuItem onClick={() => onUnarchive?.(item)}>
                    <ArchiveRestore className="size-4" />
                    {t('projects.actions.unarchive')}
                  </DropdownMenuItem>
                )}

                {variant === 'deleted' && (
                  <DropdownMenuItem onClick={() => onRestore?.(item)}>
                    <RotateCcw className="size-4" />
                    {t('projects.actions.restore')}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
}
