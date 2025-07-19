import { useState, useCallback, useEffect } from 'react';
import { httpClient } from '../../../../../common/request/src';

// 用户搜索和筛选参数接口
interface UserFilters {
  search?: string;
  enabled?: boolean;
  registered?: boolean;
}

interface UserType {
  id: string;
  name: string;
  email: string;
  enabled: boolean;
  registered: boolean;
  features: string[];
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string;
}

export const useUserList = () => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });
  
  const [filters, setFilters] = useState<UserFilters>({});
  const [users, setUsers] = useState<UserType[]>([]);
  const [usersCount, setUsersCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取用户数据
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: pagination.pageIndex.toString(),
        size: pagination.pageSize.toString(),
        sortBy: 'createdAt',
        sortDir: 'desc',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== undefined)
        ),
      });

      const response = await httpClient.get(`/api/admin/users?${params.toString()}`);
      
      const userData = response.users || [];
      setUsers(userData.map((user: any) => ({
        ...user,
        features: user.features || [],
        enabled: user.enabled ?? true,
        registered: user.registered ?? true,
      })));
      
      setUsersCount(response.totalElements || 0);
      setTotalPages(response.totalPages || 0);
      setCurrentPage(response.currentPage || 0);
      setHasNext(response.hasNext || false);
      setHasPrevious(response.hasPrevious || false);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setError('无法加载用户列表');
      setUsers([]);
      setUsersCount(0);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, filters]);

  // 初始加载和依赖变化时重新获取
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    pagination,
    setPagination,
    usersCount,
    totalPages,
    currentPage,
    hasNext,
    hasPrevious,
    filters,
    searchUsers,
    filterByStatus,
    clearFilters,
    refreshUsers,
    loading,
    error,
  };
};