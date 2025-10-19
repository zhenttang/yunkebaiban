import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import type { Row, RowData, Table } from '@tanstack/react-table';
import { flexRender } from '@tanstack/react-table';
import {
  TableRow,
  TableCell
} from '@yunke/admin/components/ui/table';
import { cn } from '../../../utils';

interface DataTableRowProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
}

export function DataTableRow<TData extends Record<string, any>>({
  row,
  table,
}: DataTableRowProps<TData>): React.ReactElement {
  const router = useRouter();
  const isSelected = row.getIsSelected();

  const handleRowClick = useCallback(() => {
    if (row.getIsSelected()) {
      row.toggleSelected(false);
    } else {
      // 如果已经有大于一个选中的行，不要导航
      const selectedCount = table.getSelectedRowModel().rows.length;
      if (selectedCount > 0) {
        row.toggleSelected(true);
        return;
      }

      // 导航到详情页
      if ('id' in row.original) {
        router.push(`/accounts/detail?userId=${row.original.id}&tab=info`);
      }
    }
  }, [row, router, table]);

  return (
    <TableRow
      role="row"
      data-state={isSelected ? 'selected' : undefined}
      className={cn(
        'group relative transition-all duration-200 hover:bg-slate-50/80',
        isSelected && 'bg-slate-50/90 hover:bg-slate-100/90',
      )}
      onClick={handleRowClick}
    >
      {row.getVisibleCells().map(cell => (
        <TableCell
          key={cell.id}
          role="cell"
          className={cn(
            'py-2 sm:py-3 px-3 sm:px-4 text-sm transition-colors font-medium hover:text-slate-900 truncate',
            isSelected ? 'text-slate-900' : 'text-slate-700'
          )}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-slate-100 group-hover:bg-transparent transition-colors"></div>
    </TableRow>
  );
} 