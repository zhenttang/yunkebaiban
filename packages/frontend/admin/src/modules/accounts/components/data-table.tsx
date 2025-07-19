import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@affine/admin/components/ui/table';
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

import type { UserType } from '../schema';
import { DataTablePagination } from './data-table-pagination';
import { DataTableToolbar } from './data-table-toolbar';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pagination: PaginationState;
  usersCount: number;
  selectedUsers: UserType[];
  setMemoUsers: Dispatch<SetStateAction<UserType[]>>;
  onPaginationChange: Dispatch<
    SetStateAction<{
      pageIndex: number;
      pageSize: number;
    }>
  >;
  // 新增的搜索和筛选功能
  filters?: {
    search?: string;
    enabled?: boolean;
    registered?: boolean;
  };
  onSearch?: (searchTerm: string) => void;
  onFilterByStatus?: (enabled?: boolean, registered?: boolean) => void;
  onClearFilters?: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
  pagination,
  usersCount,
  selectedUsers,
  setMemoUsers,
  onPaginationChange,
  // 新增的props
  filters,
  onSearch,
  onFilterByStatus,
  onClearFilters,
  onRefresh,
  loading = false,
  hasNext = false,
  hasPrevious = false,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({});
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [tableData, setTableData] = useState(data);
  const [rowCount, setRowCount] = useState(usersCount);
  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: row => row.id,
    manualPagination: true,
    rowCount: rowCount,
    enableFilters: true,
    onPaginationChange: onPaginationChange,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    state: {
      pagination,
      rowSelection,
      columnFilters,
    },
  });

  useEffect(() => {
    setTableData(data);
  }, [data]);

  useEffect(() => {
    setRowCount(usersCount);
  }, [usersCount]);

  return (
    <div className="flex flex-col gap-4 h-full overflow-hidden px-4 sm:px-6 py-4 sm:py-6 animate-fade-in">
      <DataTableToolbar
        setDataTable={setTableData}
        data={data}
        usersCount={usersCount}
        table={table}
        selectedUsers={selectedUsers}
        setRowCount={setRowCount}
        setMemoUsers={setMemoUsers}
        // 传递新的搜索和筛选功能
        filters={filters}
        onSearch={onSearch}
        onFilterByStatus={onFilterByStatus}
        onClearFilters={onClearFilters}
        onRefresh={onRefresh}
        loading={loading}
      />
      <div className="rounded-xl border border-slate-200/70 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex-1 flex flex-col overflow-hidden bg-white/60 backdrop-blur-xl relative colorful-container">
        <div className="absolute inset-0 animate-gradient-shift bg-gradient-to-br from-blue-500/[0.02] via-purple-500/[0.015] to-green-500/[0.02] pointer-events-none"></div>
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-blue-300/10 via-purple-300/20 to-green-300/10"></div>
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          <Table>
            <TableHeader className="bg-gradient-to-r from-slate-50/80 via-white/50 to-slate-50/80 backdrop-blur-sm border-b border-slate-200/70">
              {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id} className="flex items-center hover:bg-transparent">
                  {headerGroup.headers.map(header => {
                    let columnClassName = '';
                    if (header.id === 'select') {
                      columnClassName = 'w-[40px] flex-shrink-0';
                    } else if (header.id === 'info') {
                      columnClassName = 'flex-1';
                    } else if (header.id === 'property') {
                      columnClassName = 'flex-1';
                    } else if (header.id === 'actions') {
                      columnClassName =
                        'w-[40px] flex-shrink-0 justify-center mr-6';
                    }

                    return (
                      <TableHead
                        key={header.id}
                        colSpan={header.colSpan}
                        className={`${columnClassName} py-4 text-xs font-medium flex items-center h-11 text-slate-600`}
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
          </Table>

          <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-slate-300/60 scrollbar-track-transparent scrollbar-thumb-rounded max-h-[calc(100vh-220px)]">
            <Table>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row, index) => (
                    <TableRow 
                      key={row.id} 
                      className={`flex items-center border-b last:border-0 transition-all hover:bg-gradient-to-r hover:from-slate-50/70 hover:to-white/70 group animate-fade-in ${row.getIsSelected() ? 'bg-blue-50/50' : ''}`}
                      style={{ 
                        animationDelay: `${index * 50}ms`, 
                        opacity: 0, // 初始状态不可见，由动画控制显示
                      }}
                    >
                      {row.getVisibleCells().map(cell => {
                        let columnClassName = '';
                        if (cell.column.id === 'select') {
                          columnClassName = 'w-[40px] flex-shrink-0';
                        } else if (cell.column.id === 'info') {
                          columnClassName = 'flex-1';
                        } else if (cell.column.id === 'property') {
                          columnClassName = 'flex-1';
                        } else if (cell.column.id === 'actions') {
                          columnClassName =
                            'w-[40px] flex-shrink-0 justify-center mr-6';
                        }

                        return (
                          <TableCell
                            key={cell.id}
                            className={`${columnClassName} flex items-center py-3.5 group-hover:text-primary/90 transition-colors duration-200`}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="animate-fade-in">
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center opacity-0 animate-fade-in"
                      style={{ animationDelay: '100ms' }}
                    >
                      没有找到数据.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="mt-auto">
        <DataTablePagination table={table} onRefresh={onRefresh} />
      </div>
    </div>
  );
}
