import { useState, useCallback, useEffect } from 'react';
import { httpClient } from '@affine/request';
import type { AuthConfigDto, PasswordPolicyDto } from '../types';

export function useAuthConfig() {
  const [config, setConfig] = useState<AuthConfigDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/security-config');
      setConfig(response);
    } catch (err: any) {
      console.error('Failed to fetch auth config:', err);
      setError(err.message || '获取认证配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (newConfig: AuthConfigDto) => {
    try {
      setSaving(true);
      setError(null);
      const response = await httpClient.put('/api/admin/security-config', newConfig);
      if (response.success) {
        setConfig(newConfig);
        return { success: true, message: response.message };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      console.error('Failed to update auth config:', err);
      return { success: false, error: err.message || '更新认证配置失败' };
    } finally {
      setSaving(false);
    }
  }, []);

  const testLoginProtection = useCallback(async () => {
    try {
      const response = await httpClient.post('/api/admin/security-config/test-login-protection');
      return response;
    } catch (err: any) {
      throw new Error(err.message || '登录保护测试失败');
    }
  }, []);

  const resetFailedAttempts = useCallback(async (userId: string) => {
    try {
      const response = await httpClient.post(`/api/admin/security-config/reset-failed-attempts?userId=${userId}`);
      return response;
    } catch (err: any) {
      throw new Error(err.message || '重置失败计数失败');
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    saving,
    refetch: fetchConfig,
    updateConfig,
    testLoginProtection,
    resetFailedAttempts,
  };
}

export function usePasswordPolicy() {
  const [policy, setPolicy] = useState<PasswordPolicyDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPolicy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/security-config/password-policy');
      setPolicy(response);
    } catch (err: any) {
      console.error('Failed to fetch password policy:', err);
      setError(err.message || '获取密码策略失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePolicy = useCallback(async (newPolicy: PasswordPolicyDto) => {
    try {
      setSaving(true);
      setError(null);
      const response = await httpClient.put('/api/admin/security-config/password-policy', newPolicy);
      if (response.success) {
        setPolicy(newPolicy);
        return { success: true, message: response.message };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      console.error('Failed to update password policy:', err);
      return { success: false, error: err.message || '更新密码策略失败' };
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  return {
    policy,
    loading,
    error,
    saving,
    refetch: fetchPolicy,
    updatePolicy,
  };
}