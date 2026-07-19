'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  /** Show skeleton rows while the underlying query is loading. */
  isLoading?: boolean;
  /** Column id used by the built-in search box. Omit to hide the search box. */
  searchColumn?: string;
  searchPlaceholder?: string;
  /** Message shown when there is no data (and not loading). */
  emptyMessage?: string;
  /** Rows per page. Set to 0 to disable client pagination. */
  pageSize?: number;
  /** Enable a leading checkbox column + select-all header for bulk actions. */
  enableRowSelection?: boolean;
  /** Stable row id used to preserve selection across sort/filter. */
  getRowId?: (originalRow: TData, index: number) => string;
  /** aria-label for the select-all header checkbox (i18n comes from the caller). */
  selectAllAriaLabel?: string;
  /** aria-label for the per-row checkbox. */
  selectRowAriaLabel?: string;
  /**
   * Renders the bulk-actions toolbar when at least one row is selected.
   * Receives the selected rows' original data and a `clearSelection` callback.
   */
  renderBulkActions?: (selectedRows: TData[], clearSelection: () => void) => React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchColumn,
  searchPlaceholder,
  emptyMessage,
  pageSize = 10,
  enableRowSelection = false,
  getRowId,
  selectAllAriaLabel,
  selectRowAriaLabel,
  renderBulkActions,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation();
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const paginated = pageSize > 0;

  // Prepend a checkbox column when selection is enabled. Memoized so the table
  // isn't handed a fresh column array on every render.
  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableRowSelection) return columns;
    const selectColumn: ColumnDef<TData, TValue> = {
      id: 'select',
      enableSorting: false,
      header: ({ table: t2 }) => (
        <Checkbox
          checked={
            t2.getIsAllPageRowsSelected()
              ? true
              : t2.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => t2.toggleAllPageRowsSelected(value)}
          aria-label={selectAllAriaLabel}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value)}
          aria-label={selectRowAriaLabel}
        />
      ),
    };
    return [selectColumn, ...columns];
  }, [columns, enableRowSelection, selectAllAriaLabel, selectRowAriaLabel]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, globalFilter, rowSelection },
    enableRowSelection,
    getRowId,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: paginated ? getPaginationRowModel() : undefined,
    initialState: paginated ? { pagination: { pageSize } } : undefined,
    // Global filter that only inspects the configured search column.
    globalFilterFn: searchColumn
      ? (row, _columnId, value) => {
          const cell = row.getValue(searchColumn);
          return String(cell ?? '')
            .toLowerCase()
            .includes(String(value).toLowerCase());
        }
      : 'includesString',
  });

  const colCount = tableColumns.length;

  const selectedRows = enableRowSelection
    ? table.getSelectedRowModel().rows.map((r) => r.original)
    : [];

  return (
    <div className="space-y-4">
      {enableRowSelection && renderBulkActions && selectedRows.length > 0 && (
        <div className="bg-muted/50 flex items-center gap-2 rounded-md border px-3 py-2">
          {renderBulkActions(selectedRows, () => table.resetRowSelection())}
        </div>
      )}

      {searchColumn && (
        <div className="relative max-w-sm">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder={searchPlaceholder ?? t('dataTable.searchPlaceholder')}
            className="pl-8"
          />
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: Math.min(pageSize || 5, 5) }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {Array.from({ length: colCount }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colCount} className="text-muted-foreground h-24 text-center">
                  {emptyMessage ?? t('common.noData')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {paginated && table.getPageCount() > 1 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-muted-foreground text-sm">
            {t('common.page')} {table.getState().pagination.pageIndex + 1} {t('common.of')}{' '}
            {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label={t('dataTable.prevPage')}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label={t('dataTable.nextPage')}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
