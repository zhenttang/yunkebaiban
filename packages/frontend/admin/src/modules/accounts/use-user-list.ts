import { useQuery } from '@affine/admin/use-query';

// REST API查询定义
const listUsersQuery = {
  id: 'listUsers',
  endpoint: '/api/admin/users',
  method: 'GET' as const,
  __type: {} as {
    users: Array<{
      id: string;
      name: string;
      email: string;
      features: string[];
    }>;
    total: number;
  },
};

import { useState } from 'react';

export const useUserList = () => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  
  const {
    data,
    error
  } = useQuery({
    query: listUsersQuery,
    variables: {
      page: pagination.pageIndex,
      size: pagination.pageSize,
    },
  }, {
    suspense: false, // 防止错误导致整个组件崩溃
    shouldRetryOnError: false,
  });

  // 如果有错误，返回空数据而不是让组件崩溃
  if (error) {
    console.warn('无法加载用户列表:', error);
    return {
      users: [] as Array<{
        id: string;
        name: string;
        email: string;
        features: string[];
      }>,
      pagination,
      setPagination,
      usersCount: 0,
    };
  }

  return {
    users: (data?.users || []).map(user => ({
      ...user,
      features: user.features || [] // 确保 features 始终是数组
    })),
    pagination,
    setPagination,
    usersCount: data?.totalElements || data?.total || 0,
  };
};
