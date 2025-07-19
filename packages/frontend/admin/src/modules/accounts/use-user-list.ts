import { useQuery } from '@affine/admin/use-query';
import { useState, useCallback, useEffect } from 'react';

// REST API查询定义
const listUsersQuery = {
  id: 'listUsers-accounts-page', // 修改为更独特的id
  endpoint: '/api/admin/users',
  method: 'GET' as const,
  __type: {} as {
    users: Array<{
      id: string;
      name: string;
      email: string;
      enabled: boolean;
      registered: boolean;
      features: string[];
      createdAt?: string;
      updatedAt?: string;
      avatarUrl?: string;
    }>;
    totalElements: number;
    totalPages: number;
    currentPage: number;
    size: number;
    hasNext: boolean;
    hasPrevious: boolean;
  },
};

// 用户搜索和筛选参数接口
interface UserFilters {
  search?: string;
  enabled?: boolean;
  registered?: boolean;
}

export const useUserList = () => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  
  const [filters, setFilters] = useState<UserFilters>({});
  
  const {
    data,
    error,
    mutate
  } = useQuery({
    query: listUsersQuery,
    variables: {
      page: pagination.pageIndex,
      size: pagination.pageSize,
      sortBy: 'createdAt',
      sortDir: 'desc',
      ...filters,
    },
  }, {
    suspense: false, // 防止错误导致整个组件崩溃
    shouldRetryOnError: false,
    revalidateOnFocus: false, // 防止焦点切换时重新请求
    revalidateOnReconnect: false, // 防止网络重连时重新请求
  });

  // SWR会自动管理缓存，不需要手动清理

  // 搜索用户
  const searchUsers = useCallback((searchTerm: string) => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm || undefined,
    }));
    // 重置到第一页
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  // 按状态筛选
  const filterByStatus = useCallback((enabled?: boolean, registered?: boolean) => {
    setFilters(prev => ({
      ...prev,
      enabled,
      registered,
    }));
    // 重置到第一页
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  // 清除筛选
  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  }, []);

  // 刷新用户列表
  const refreshUsers = useCallback(() => {
    mutate();
  }, [mutate]);

  // 如果有错误，返回空数据而不是让组件崩溃
  if (error) {
    console.warn('无法加载用户列表:', error);
    return {
      users: [] as Array<{
        id: string;
        name: string;
        email: string;
        enabled: boolean;
        registered: boolean;
        features: string[];
        createdAt?: string;
        updatedAt?: string;
        avatarUrl?: string;
      }>,
      pagination,
      setPagination,
      usersCount: 0,
      filters,
      searchUsers,
      filterByStatus,
      clearFilters,
      refreshUsers,
      loading: false,
      hasNext: false,
      hasPrevious: false,
    };
  }

  const loading = !data && !error;

  return {
    users: (data?.users || []).map(user => ({
      ...user,
      features: user.features || [], // 确保 features 始终是数组
      enabled: user.enabled ?? true, // 默认启用
      registered: user.registered ?? true, // 默认已注册
    })),
    pagination,
    setPagination,
    usersCount: data?.totalElements || 0,
    totalPages: data?.totalPages || 0,
    currentPage: data?.currentPage || 0,
    hasNext: data?.hasNext || false,
    hasPrevious: data?.hasPrevious || false,
    filters,
    searchUsers,
    filterByStatus,
    clearFilters,
    refreshUsers,
    loading,
  };
};
