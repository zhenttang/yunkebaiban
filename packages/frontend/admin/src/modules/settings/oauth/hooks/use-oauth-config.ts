import { useState, useCallback, useEffect } from 'react';
import { httpClient } from '../../../../../../../common/request/src';
import type { OAuthProvider, OAuthStatistics, OAuthTestResult, BatchToggleRequest, BatchToggleResult } from '../types';

export function useOAuthConfig() {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [statistics, setStatistics] = useState<OAuthStatistics | null>(null);
  const [callbackUrls, setCallbackUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取所有OAuth提供商配置
  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/oauth/providers');
      setProviders(response.providers || []);
    } catch (err: any) {
      console.error('Failed to fetch OAuth providers:', err);
      setError('获取OAuth提供商配置失败');
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取OAuth统计信息
  const fetchStatistics = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/oauth/statistics');
      setStatistics(response);
    } catch (err: any) {
      console.error('Failed to fetch OAuth statistics:', err);
    }
  }, []);

  // 获取回调URL配置
  const fetchCallbackUrls = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/oauth/callback-url');
      setCallbackUrls(response);
    } catch (err: any) {
      console.error('Failed to fetch callback URLs:', err);
    }
  }, []);

  // 获取特定提供商配置
  const getProvider = useCallback(async (provider: string): Promise<OAuthProvider | null> => {
    try {
      const response = await httpClient.get(`/api/admin/oauth/providers/${provider}`);
      return response;
    } catch (err: any) {
      console.error(`Failed to fetch ${provider} config:`, err);
      return null;
    }
  }, []);

  // 更新提供商配置
  const updateProvider = useCallback(async (provider: string, config: Partial<OAuthProvider>) => {
    try {
      const response = await httpClient.put(`/api/admin/oauth/providers/${provider}`, config);
      
      // 更新本地状态
      setProviders(prev => prev.map(p => 
        p.provider === provider ? { ...p, ...response } : p
      ));
      
      return { success: true, data: response };
    } catch (err: any) {
      console.error(`Failed to update ${provider} config:`, err);
      return { success: false, error: err.message || '更新配置失败' };
    }
  }, []);

  // 测试提供商连接
  const testProvider = useCallback(async (provider: string): Promise<OAuthTestResult> => {
    try {
      const response = await httpClient.post(`/api/admin/oauth/providers/${provider}/test`);
      return response;
    } catch (err: any) {
      console.error(`Failed to test ${provider} connection:`, err);
      return {
        success: false,
        message: err.message || '连接测试失败',
        provider,
        testedAt: new Date().toISOString(),
        details: { error: err.message }
      };
    }
  }, []);

  // 批量启用/禁用提供商
  const batchToggleProviders = useCallback(async (request: BatchToggleRequest): Promise<BatchToggleResult> => {
    try {
      const response = await httpClient.post('/api/admin/oauth/providers/batch-toggle', request);
      
      // 更新本地状态
      setProviders(prev => prev.map(p => 
        request.providers.includes(p.provider) 
          ? { ...p, enabled: request.enabled }
          : p
      ));
      
      return response;
    } catch (err: any) {
      console.error('Failed to batch toggle providers:', err);
      return {
        successCount: 0,
        totalCount: request.providers.length,
        failedProviders: request.providers.map(p => `${p} (${err.message})`),
        enabled: request.enabled
      };
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    const initData = async () => {
      await Promise.all([
        fetchProviders(),
        fetchStatistics(),
        fetchCallbackUrls()
      ]);
    };
    
    initData();
  }, [fetchProviders, fetchStatistics, fetchCallbackUrls]);

  // 刷新所有数据
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchProviders(),
      fetchStatistics(),
      fetchCallbackUrls()
    ]);
  }, [fetchProviders, fetchStatistics, fetchCallbackUrls]);

  return {
    providers,
    statistics,
    callbackUrls,
    loading,
    error,
    getProvider,
    updateProvider,
    testProvider,
    batchToggleProviders,
    refreshAll,
    refetch: fetchProviders,
  };
}
