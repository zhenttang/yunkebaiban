// REST API接口定义替换GraphQL
type GetCurrentUserResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    features: string[];
    hasPassword: boolean;
    emailVerified: boolean;
  };
} | null;

type ServerConfigResponse = {
  initialized: boolean;
  name?: string;
  credentialsRequirement?: {
    password: {
      minLength: number;
      maxLength: number;
    };
  };
};

enum FeatureType {
  Admin = 'admin',
}

// 定义REST API查询对象，映射到现有后端接口
const serverConfigQuery = {
  id: 'serverConfig',
  endpoint: '/api/admin/server-config', // 需要后端创建此接口或查找替代接口
  method: 'GET' as const,
  __type: {} as ServerConfigResponse,
};

const currentUserQuery = {
  id: 'currentUser', 
  endpoint: '/api/auth/me', // 使用新添加的用户信息接口
  method: 'GET' as const,
  __type: {} as GetCurrentUserResponse,
};

import { useEffect, useState } from 'react';

import { useMutateQueryResource } from '../use-mutation';
import { useQuery } from '../use-query';

export const useServerConfig = () => {
  const user = useCurrentUser();

  // 仅在“已登录”后才发起管理员配置请求（是否为管理员交由后端判定：成功=有权限，403=无权限）
  const shouldFetch = !!user; // user: undefined=加载中，null=未登录，object=已登录

  const { data, error } = useQuery(
    shouldFetch
      ? { query: serverConfigQuery }
      : undefined,
    {
      suspense: false,
      shouldRetryOnError: false,
    }
  );

  // 未登录：返回安全的默认配置，避免触发管理端接口
  if (!shouldFetch) {
    return {
      initialized: true,
      credentialsRequirement: {
        password: { minLength: 8, maxLength: 32 },
      },
    } satisfies ServerConfigResponse;
  }

  if (error) {
    // 包含 403（FORBIDDEN）等错误场景：统一返回默认配置，由页面自行提示“无权限/请登录”
    return {
      initialized: true,
      credentialsRequirement: {
        password: { minLength: 8, maxLength: 32 },
      },
    } satisfies ServerConfigResponse;
  }

  return (
    data || {
      initialized: true,
      credentialsRequirement: {
        password: { minLength: 8, maxLength: 32 },
      },
    }
  );
};

export const useRevalidateServerConfig = () => {
  const revalidate = useMutateQueryResource();

  return () => {
    return revalidate(serverConfigQuery);
  };
};

export const useRevalidateCurrentUser = () => {
  const revalidate = useMutateQueryResource();

  return () => {
    return revalidate(currentUserQuery);
  };
};

export const useCurrentUser = (): NonNullable<GetCurrentUserResponse>['user'] | null | undefined => {
  const { data, error, isLoading, mutate } = useQuery({
    query: currentUserQuery,
  }, {
    suspense: false, // 不使用suspense模式以避免错误抛出
    shouldRetryOnError: true, // 启用重试机制
    errorRetryCount: 2, // 最多重试2次
    errorRetryInterval: 1000, // 重试间隔1秒
    revalidateOnFocus: false, // 防止页面聚焦时重复请求
    dedupingInterval: 5000, // 5秒内去重复请求
  });
  
  // 区分网络错误和认证错误
  if (error) {
    console.log('获取用户信息失败:', error);
    
    // 如果是网络错误或5xx错误，返回undefined保持加载状态
    if (error.code === 'NETWORK_ERROR' || 
        error.code === 'SERVER_ERROR' ||
        (error.response?.status >= 500)) {
      console.log('网络或服务器错误，保持加载状态');
      return undefined;
    }
    
    // 如果是认证相关错误（401，403），返回null表示未认证
    if (error.code === 'AUTH_FAILED' || 
        error.code === 'AUTH_EXPIRED' ||
        error.code === 'FORBIDDEN' ||
        (error.response?.status === 401 || error.response?.status === 403)) {
      console.log('认证失败，用户未登录');
      return null;
    }
    
    // 其他错误，返回null
    return null;
  }
  
  // 如果还在加载中，返回 undefined 表示加载状态
  if (isLoading && data === undefined) {
    console.log('用户数据加载中...');
    return undefined;
  }
  
  const result = data?.user || null;
  if (result) {
    // console.log('用户已加载:', result.email, 'features:', result.features);
  }
  return result;
};

// 基于 /api/admin/access-check 成功/失败判断是否有管理权限（轻量探测）
export function useAdminAccess(): {
  checking: boolean;
  allowed: boolean | null; // null 表示未知/加载中
  error?: any;
} {
  const user = useCurrentUser();

  // ✅ 始终调用 useQuery，但通过 options 参数控制是否实际请求
  // 只有在用户已登录时才发起请求
  const shouldFetch = user !== undefined && user !== null;
  
  const accessCheckQuery = { id: 'adminAccess', endpoint: '/api/admin/access-check', method: 'GET' as const };
  const { data, error, isLoading } = useQuery(
    shouldFetch
      ? { query: accessCheckQuery as any }
      : undefined, // 传入 undefined 会让 SWR 跳过请求
    { suspense: false, shouldRetryOnError: false }
  );

  // 用户信息还在加载
  if (user === undefined) {
    return { checking: true, allowed: null };
  }
  // 未登录
  if (user === null) {
    return { checking: false, allowed: false };
  }

  // 已登录的情况
  if (isLoading) return { checking: true, allowed: null };
  if (error) return { checking: false, allowed: false, error };
  if (data) return { checking: false, allowed: true };
  return { checking: false, allowed: false };
}

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener('change', onChange);
    setValue(result.matches);

    return () => result.removeEventListener('change', onChange);
  }, [query]);

  return value;
}
