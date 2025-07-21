import { cn } from '@affine/admin/utils';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { useState, useMemo } from 'react';

import { Header } from '../header';
import { useUserList } from './use-user-list-simple';
import { DataTable } from './components/data-table';
import { useColumns } from './components/columns';
import type { UserType } from './schema';
import { useCurrentUser, isAdmin } from '../common';

function AccountPage() {
  const currentUser = useCurrentUser();
  const { 
    users, 
    pagination, 
    setPagination, 
    usersCount,
    filters,
    searchUsers,
    filterByStatus,
    clearFilters,
    refreshUsers,
    loading,
    hasNext,
    hasPrevious,
    error
  } = useUserList();
  
  // 临时记住用户信息，因为用户列表在服务端进行分页，无法一次性获取所有用户
  const [memoUsers, setMemoUsers] = useState<UserType[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set<string>());
  
  const columns = useColumns({ 
    setSelectedUserIds,
    refreshUsers
  });

  const selectedUsers = useMemo(() => {
    return memoUsers.filter(user => selectedUserIds.has(user.id));
  }, [selectedUserIds, memoUsers]);

  // 检查当前用户权限
  console.log('=== Accounts Page Debug ===');
  console.log('当前用户:', currentUser);
  console.log('是否管理员:', currentUser ? isAdmin(currentUser) : 'user is null/undefined');
  console.log('用户features:', currentUser?.features);
  console.log('localStorage token:', localStorage.getItem('affine-admin-token') ? 'exists' : 'not found');
  console.log('API错误:', error);

  if (error) {
    return (
      <div className="h-screen flex-1 flex-col flex">
        <Header title="账户管理" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-red-500 mb-4 text-lg">权限验证失败</div>
            <div className="text-gray-700 mb-4">{error}</div>
            
            <div className="bg-gray-100 p-4 rounded-lg mb-4 text-left text-sm">
              <div className="font-semibold mb-2">调试信息:</div>
              <div>当前用户: {currentUser ? currentUser.email : '未登录'}</div>
              <div>是否管理员: {currentUser ? (isAdmin(currentUser) ? '是' : '否') : '未知'}</div>
              <div>用户权限: {currentUser?.features?.join(', ') || '无'}</div>
              <div>认证令牌: {localStorage.getItem('affine-admin-token') ? '存在' : '不存在'}</div>
            </div>
            
            <div className="space-y-2">
              <button 
                onClick={refreshUsers}
                className="block w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                重试请求
              </button>
              <button 
                onClick={() => window.location.href = '/admin/auth'}
                className="block w-full px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                重新登录
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex-1 flex-col flex">
      <Header 
        title="账户管理" 
        endFix={
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              共 {usersCount} 个用户
            </span>
            {loading && (
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        }
      />
      
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-h-[calc(100vh-70px)]">
          <DataTable
            data={users}
            columns={columns}
            pagination={pagination}
            usersCount={usersCount}
            onPaginationChange={setPagination}
            selectedUsers={selectedUsers}
            setMemoUsers={setMemoUsers}
            // 搜索和筛选功能
            filters={filters}
            onSearch={searchUsers}
            onFilterByStatus={filterByStatus}
            onClearFilters={clearFilters}
            onRefresh={refreshUsers}
            loading={loading}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
          />
        </div>
      </div>
    </div>
  );
}

export { AccountPage as Component };