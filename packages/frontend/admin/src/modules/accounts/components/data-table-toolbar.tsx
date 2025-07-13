import { Button } from '@affine/admin/components/ui/button';
import { Input } from '@affine/admin/components/ui/input';
import { useQuery } from '@affine/admin/use-query';
// import { getUserByEmailQuery } from '@affine/graphql';

// Temporary placeholder to replace @affine/graphql imports
const getUserByEmailQuery = {
  id: 'getUserByEmail',
  query: 'query GetUserByEmail($email: String!) { user(email: $email) { id name email features } }',
};

import { ExportIcon, ImportIcon, PlusIcon, SearchIcon } from '@blocksuite/icons/rc';
import { X } from 'lucide-react';
import type { Table } from '@tanstack/react-table';
import type { Dispatch, SetStateAction } from 'react';
import {
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRightPanel } from '../../panel/context';
import type { UserType } from '../schema';
import { DiscardChanges } from './discard-changes';
import { ExportUsersDialog } from './export-users-dialog';
import { ImportUsersDialog } from './import-users';
import { CreateUserForm } from './user-form';

interface DataTableToolbarProps<TData> {
  data: TData[];
  usersCount: number;
  selectedUsers: UserType[];
  setDataTable: (data: TData[]) => void;
  setRowCount: (rowCount: number) => void;
  setMemoUsers: Dispatch<SetStateAction<UserType[]>>;
  table?: Table<TData>;
}

const useSearch = () => {
  const [value, setValue] = useState('');
  const { data } = useQuery({
    query: getUserByEmailQuery,
    variables: { email: value },
  });

  const result = useMemo(() => data?.userByEmail, [data]);

  return {
    result,
    query: setValue,
  };
};

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function DataTableToolbar<TData>({
  data,
  usersCount,
  selectedUsers,
  setDataTable,
  setRowCount,
  setMemoUsers,
  table,
}: DataTableToolbarProps<TData>) {
  const [value, setValue] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const debouncedValue = useDebouncedValue(value, 1000);
  const { setPanelContent, openPanel, closePanel, isOpen } = useRightPanel();
  const { result, query } = useSearch();

  const handleConfirm = useCallback(() => {
    setPanelContent(<CreateUserForm onComplete={closePanel} />);
    if (dialogOpen) {
      setDialogOpen(false);
    }
    if (!isOpen) {
      openPanel();
    }
  }, [setPanelContent, closePanel, dialogOpen, isOpen, openPanel]);

  useEffect(() => {
    query(debouncedValue);
  }, [debouncedValue, query]);

  useEffect(() => {
    startTransition(() => {
      if (!debouncedValue) {
        setDataTable(data);
        setRowCount(usersCount);
      } else if (result) {
        setMemoUsers(prev => [...new Set([...prev, result])]);
        setDataTable([result as TData]);
        setRowCount(1);
      } else {
        setDataTable([]);
        setRowCount(0);
      }
    });
  }, [
    data,
    debouncedValue,
    result,
    setDataTable,
    setMemoUsers,
    setRowCount,
    usersCount,
  ]);

  const onValueChange = useCallback(
    (e: { currentTarget: { value: SetStateAction<string> } }) => {
      setValue(e.currentTarget.value);
    },
    []
  );

  const handleCancel = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const handleOpenConfirm = useCallback(() => {
    if (isOpen) {
      return setDialogOpen(true);
    }
    return handleConfirm();
  }, [handleConfirm, isOpen]);

  const handleExportUsers = useCallback(() => {
    if (!table) return;

    const selectedRows = table.getFilteredSelectedRowModel().rows;

    if (selectedRows.length === 0) {
      alert('请至少选择一个用户进行导出');
      return;
    }

    setExportDialogOpen(true);
  }, [table]);

  const handleImportUsers = useCallback(() => {
    setImportDialogOpen(true);
  }, []);

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-2 sm:mb-4">
      <div className="relative w-full sm:w-auto sm:flex-1">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 bg-gradient-to-br from-blue-400/60 to-blue-500/40 rounded-full p-0.5 flex items-center justify-center">
          <SearchIcon className="h-3 w-3 text-white" />
        </div>
        <Input
          placeholder="按邮箱搜索..."
          value={value}
          onChange={onValueChange}
          className="h-10 w-full pl-10 rounded-xl border-slate-200 bg-white/70 backdrop-blur-sm shadow-sm focus:border-primary/30 focus:ring-1 focus:ring-primary/20 transition-all duration-200 pr-3"
        />
        {value && (
          <button 
            onClick={() => setValue('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      
      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
        <Button
          size="sm"
          className="h-10 flex-1 sm:flex-none px-4 rounded-xl bg-gradient-to-r from-blue-500/90 to-blue-600/90 hover:from-blue-600 hover:to-blue-600 shadow-sm hover:shadow transition-all duration-200 relative group overflow-hidden btn-scale-flash"
          onClick={handleOpenConfirm}
        >
          <span className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <PlusIcon className="mr-2 h-4 w-4" />
          <span className="font-medium">添加用户</span>
        </Button>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-slate-200 bg-white/70 backdrop-blur-sm hover:bg-white hover:border-slate-300 shadow-sm transition-all duration-200 group btn-scale-flash"
            onClick={handleImportUsers}
          >
            <ImportIcon className="mr-2 h-4 w-4 sm:mr-0 text-blue-500 transition-transform group-hover:scale-110 duration-200" />
            <span className="sm:hidden font-medium">导入</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            className="h-10 rounded-xl border-slate-200 bg-white/70 backdrop-blur-sm hover:bg-white hover:border-slate-300 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group btn-scale-flash"
            onClick={handleExportUsers}
            disabled={
              !table || table.getFilteredSelectedRowModel().rows.length === 0
            }
          >
            <ExportIcon className="mr-2 h-4 w-4 sm:mr-0 text-blue-500 transition-transform group-hover:scale-110 duration-200" />
            <span className="sm:hidden font-medium">导出</span>
          </Button>
        </div>
      </div>

      {table && (
        <ExportUsersDialog
          users={selectedUsers}
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
        />
      )}

      <ImportUsersDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <DiscardChanges
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
