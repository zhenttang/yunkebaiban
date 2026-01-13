import { Button } from '@yunke/admin/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@yunke/admin/components/ui/select';
import type { Table } from '@tanstack/react-table';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  RotateCw,
} from 'lucide-react';
import { useCallback, useRef, useTransition } from 'react';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  onRefresh?: () => void;
}

export function DataTablePagination<TData>({
  table,
  onRefresh,
}: DataTablePaginationProps<TData>): React.ReactElement {
  const [isPending, startTransition] = useTransition();
  const contentRef = useRef<HTMLDivElement>(null);
  
  const onPageSizeChange = useCallback(
    (value: string) => {
      table.setPageSize(Number(value));
    },
    [table]
  );

  const handlePreviousPage = useCallback(() => {
    startTransition(() => {
      table.previousPage();
    });
  }, [table]);

  const handleNextPage = useCallback(() => {
    startTransition(() => {
      table.nextPage();
    });
  }, [table]);

  const handleFirstPage = useCallback(() => {
    startTransition(() => {
      table.setPageIndex(0);
    });
  }, [table]);

  const handleLastPage = useCallback(() => {
    startTransition(() => {
      table.setPageIndex(table.getPageCount() - 1);
    });
  }, [table]);

  const handleRefresh = useCallback(() => {
    // 使用传递的刷新函数，如果没有则降级为页面刷新
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload();
    }
  }, [onRefresh]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-slate-700">
          每页显示
        </p>
        <Select
          value={table.getState().pagination.pageSize.toString()}
          onValueChange={onPageSizeChange}
        >
          <SelectTrigger className="h-8 w-16 rounded-lg border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white transition-colors duration-200 focus:ring-1 focus:ring-primary/30">
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent
            ref={contentRef}
            className="rounded-lg border-slate-200 bg-white/90 backdrop-blur-lg shadow-lg"
          >
            {[10, 20, 30, 40, 50].map((pageSize) => (
              <SelectItem
                key={pageSize}
                value={pageSize.toString()}
                className="hover:bg-slate-100/80 focus:bg-slate-100/80 focus:text-slate-900"
              >
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-end gap-2 sm:gap-3">
        <div className="flex w-auto items-center justify-center text-sm font-medium text-slate-700">
          第 {table.getState().pagination.pageIndex + 1} 页，
          共{' '}
          {table.getPageCount() === 0
            ? 1
            : table.getPageCount()}
          页
        </div>
        <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white/80 backdrop-blur-sm shadow-sm p-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleFirstPage}
            disabled={!table.getCanPreviousPage()}
            className="h-7 w-7 rounded-md disabled:opacity-50 text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            <ChevronsLeftIcon className="h-4 w-4" />
            <span className="sr-only">首页</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handlePreviousPage}
            disabled={!table.getCanPreviousPage()}
            className="h-7 w-7 rounded-md disabled:opacity-50 text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="sr-only">上一页</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleNextPage}
            disabled={!table.getCanNextPage()}
            className="h-7 w-7 rounded-md disabled:opacity-50 text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            <ChevronRightIcon className="h-4 w-4" />
            <span className="sr-only">下一页</span>
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleLastPage}
            disabled={!table.getCanNextPage()}
            className="h-7 w-7 rounded-md disabled:opacity-50 text-slate-700 hover:bg-slate-100/80 transition-colors"
          >
            <ChevronsRightIcon className="h-4 w-4" />
            <span className="sr-only">末页</span>
          </Button>
        </div>
        <div className="flex items-center max-sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-8 rounded-lg border-slate-200 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-slate-300 shadow-sm transition-all duration-200 group"
          >
            <RotateCw className="mr-1 h-3.5 w-3.5 text-slate-600 group-hover:animate-spin" />
            <span>刷新</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
