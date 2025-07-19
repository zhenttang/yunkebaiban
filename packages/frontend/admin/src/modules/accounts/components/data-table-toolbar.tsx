import { Button } from '@affine/admin/components/ui/button';
import { Input } from '@affine/admin/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@affine/admin/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@affine/admin/components/ui/dropdown-menu';
import { 
  PlusIcon, 
  SearchIcon, 
  RefreshCwIcon,
  DownloadIcon,
  UploadIcon,
  MoreHorizontalIcon,
  FilterIcon,
  XIcon
} from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import type { Table } from '@tanstack/react-table';

import { UserEditDialog } from './user-edit-dialog';
import { useBatchOperation, useImportUsers } from './use-user-management';
import type { UserType } from '../schema';

interface DataTableToolbarProps<TData> {
  data: TData[];
  usersCount: number;
  selectedUsers: UserType[];
  setDataTable: (data: TData[]) => void;
  setRowCount: (rowCount: number) => void;
  setMemoUsers: React.Dispatch<React.SetStateAction<UserType[]>>;
  table?: Table<TData>;
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
}

export function DataTableToolbar<TData>({
  data,
  usersCount,
  selectedUsers,
  setDataTable,
  setRowCount,
  setMemoUsers,
  table,
  filters,
  onSearch,
  onFilterByStatus,
  onClearFilters,
  onRefresh,
  loading = false,
}: DataTableToolbarProps<TData>) {
  const [searchTerm, setSearchTerm] = useState(filters?.search || '');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [operationLoading, setOperationLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 使用新的hooks
  const executeBatchOperation = useBatchOperation();
  const handleImportUsers = useImportUsers();

  // 搜索处理
  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  }, [onSearch]);

  // 状态筛选处理
  const handleStatusFilter = useCallback((value: string) => {
    switch (value) {
      case 'enabled':
        onFilterByStatus?.(true, undefined);
        break;
      case 'disabled':
        onFilterByStatus?.(false, undefined);
        break;
      case 'registered':
        onFilterByStatus?.(undefined, true);
        break;
      case 'unregistered':
        onFilterByStatus?.(undefined, false);
        break;
      default:
        onFilterByStatus?.(undefined, undefined);
    }
  }, [onFilterByStatus]);

  // 批量操作处理
  const handleBatchOperation = async (operation: 'enable' | 'disable' | 'delete') => {
    if (selectedUsers.length === 0) {
      toast.error('请先选择要操作的用户');
      return;
    }

    const operationNames = {
      enable: '启用',
      disable: '禁用',
      delete: '删除'
    };

    if (operation === 'delete') {
      if (!confirm(`确定要删除选中的 ${selectedUsers.length} 个用户吗？此操作不可恢复。`)) {
        return;
      }
    }

    setOperationLoading(true);
    try {
      const userIds = selectedUsers.map(user => user.id);
      await executeBatchOperation(userIds, operation, () => {
        setOperationLoading(false);
        onRefresh?.();
      });
    } catch (error: any) {
      console.error('批量操作失败:', error);
      setOperationLoading(false);
    }
  };

  // CSV导入处理
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('请选择CSV格式的文件');
      return;
    }

    setOperationLoading(true);
    try {
      await handleImportUsers(file, (result) => {
        setOperationLoading(false);
        onRefresh?.();
      });
    } catch (error: any) {
      console.error('CSV导入失败:', error);
      setOperationLoading(false);
    } finally {
      // 清空文件输入
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 导出CSV模板
  const handleExportTemplate = () => {
    const csvContent = 'email,name,password\nexample@email.com,示例用户,123456\n';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'user_import_template.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const hasFilters = Boolean(filters?.search || filters?.enabled !== undefined || filters?.registered !== undefined);

  return (
    <div className="space-y-4">
      {/* 第一行：主要操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* 搜索框 */}
          <div className="relative">
            <SearchIcon className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索用户（邮箱或姓名）..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>

          {/* 状态筛选 */}
          <Select onValueChange={handleStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <FilterIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部用户</SelectItem>
              <SelectItem value="enabled">已启用</SelectItem>
              <SelectItem value="disabled">已禁用</SelectItem>
              <SelectItem value="registered">已注册</SelectItem>
              <SelectItem value="unregistered">未注册</SelectItem>
            </SelectContent>
          </Select>

          {/* 清除筛选 */}
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="h-9 px-3"
            >
              <XIcon className="h-4 w-4 mr-1" />
              清除筛选
            </Button>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 刷新按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading || operationLoading}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>

          {/* 创建用户按钮 */}
          <Button onClick={() => setShowCreateDialog(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            创建用户
          </Button>

          {/* 更多操作菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportTemplate}>
                <DownloadIcon className="h-4 w-4 mr-2" />
                下载导入模板
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                <UploadIcon className="h-4 w-4 mr-2" />
                导入用户（CSV）
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 第二行：批量操作（仅在有选中用户时显示） */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center justify-between bg-muted/50 p-3 rounded-md">
          <span className="text-sm text-muted-foreground">
            已选择 {selectedUsers.length} 个用户
          </span>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchOperation('enable')}
              disabled={operationLoading}
            >
              批量启用
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBatchOperation('disable')}
              disabled={operationLoading}
            >
              批量禁用
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBatchOperation('delete')}
              disabled={operationLoading}
            >
              批量删除
            </Button>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileImport}
        style={{ display: 'none' }}
      />

      {/* 创建用户对话框 */}
      <UserEditDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        user={null}
        onSuccess={onRefresh}
      />
    </div>
  );
}
