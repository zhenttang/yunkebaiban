/**
 * 统一的认证React Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { authStateManager, AuthState, User } from './auth-state-manager';
import { httpClient } from './http-client';

/**
 * 使用认证状态的Hook
 */
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>(authStateManager.getState());

  useEffect(() => {
    const handleAuthStateChange = (newState: AuthState) => {
      setAuthState(newState);
    };

    authStateManager.addListener(handleAuthStateChange);

    return () => {
      authStateManager.removeListener(handleAuthStateChange);
    };
  }, []);

  const login = useCallback(async (credentials: {
    email: string;
    password?: string;
    code?: string;
    type: 'password' | 'code' | 'magic-link';
  }) => {
    return authStateManager.login(credentials);
  }, []);

  const logout = useCallback(async () => {
    return authStateManager.logout();
  }, []);

  const refreshToken = useCallback(async () => {
    return authStateManager.refreshToken();
  }, []);

  return {
    ...authState,
    login,
    logout,
    refreshToken
  };
}

/**
 * 使用用户信息的Hook
 */
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

/**
 * 使用认证状态的Hook
 */
export function useAuthState(): {
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
} {
  const { isAuthenticated, loading, error } = useAuth();
  return { isAuthenticated, loading, error };
}

/**
 * 使用HTTP客户端的Hook
 */
export function useHttpClient() {
  return httpClient;
}

/**
 * 使用API请求的Hook
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      return result;
    } catch (err: any) {
      setError(err.message || '请求失败');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    request,
    loading,
    error,
    clearError: () => setError(null)
  };
}

/**
 * 使用认证请求的Hook
 */
export function useAuthenticatedRequest() {
  const { isAuthenticated } = useAuth();
  const { request, loading, error, clearError } = useApi();

  const authenticatedRequest = useCallback(async <T>(
    apiCall: () => Promise<T>
  ): Promise<T | null> => {
    if (!isAuthenticated) {
      setError('用户未认证，请先登录');
      return null;
    }

    return request(apiCall);
  }, [isAuthenticated, request]);

  return {
    request: authenticatedRequest,
    loading,
    error,
    clearError
  };
}