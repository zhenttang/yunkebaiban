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
  endpoint: '/api/auth/me', // 使用现有的用户信息接口
  method: 'GET' as const,
  __type: {} as GetCurrentUserResponse,
};

import { useEffect, useState } from 'react';

import { useMutateQueryResource } from '../use-mutation';
import { useQuery } from '../use-query';

export const useServerConfig = () => {
  const user = useCurrentUser();
  
  // 总是调用useQuery以避免Hook规则错误
  const { data, error } = useQuery({
    query: serverConfigQuery,
  }, {
    suspense: false,
    shouldRetryOnError: false,
  });
  
  // 如果用户未登录或不是管理员，返回默认配置
  if (!user || !isAdmin(user)) {
    return {
      initialized: true, // 改为true以避免重定向到setup页面
      credentialsRequirement: {
        password: {
          minLength: 8,
          maxLength: 32
        }
      }
    };
  }
  
  if (error) {
    return {
      initialized: true,
      credentialsRequirement: {
        password: {
          minLength: 8,
          maxLength: 32
        }
      }
    };
  }
  
  return data || {
    initialized: true,
    credentialsRequirement: {
      password: {
        minLength: 8,
        maxLength: 32
      }
    }
  };
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
    console.log('用户已加载:', result.email, 'features:', result.features);
  }
  return result;
};

export function isAdmin(
  user: NonNullable<GetCurrentUserResponse>['user'] | null | undefined
) {
  const result = user?.features?.includes(FeatureType.Admin) || false;
  if (user) {
    console.log(`isAdmin检查: ${user.email} -> ${result}`);
  }
  return result;
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
