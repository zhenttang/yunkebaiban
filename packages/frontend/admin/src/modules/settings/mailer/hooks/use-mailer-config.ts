import { useState, useCallback, useEffect } from 'react';
import { httpClient } from '../../../../../../../common/request/src';
import type { 
  MailerConfigDto, 
  MailerProviderDto, 
  MailerTestResultDto,
  SendTestMailRequestDto,
  ValidationResultDto,
  MailerStatsDto 
} from '../types';

export function useMailerConfig() {
  const [config, setConfig] = useState<MailerConfigDto | null>(null);
  const [providers, setProviders] = useState<MailerProviderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取邮件配置
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/mailer/config');
      setConfig(response);
    } catch (err: any) {
      console.error('Failed to fetch mailer config:', err);
      setError('无法加载邮件配置');
      setConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 获取邮件提供商列表
  const fetchProviders = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/mailer/providers');
      setProviders(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Failed to fetch providers:', err);
      setProviders([]);
    }
  }, []);

  // 更新邮件配置
  const updateConfig = useCallback(async (newConfig: MailerConfigDto) => {
    try {
      const response = await httpClient.put('/api/admin/mailer/config', newConfig);
      setConfig(response);
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to update mailer config:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '更新邮件配置失败' 
      };
    }
  }, []);

  // 测试连接
  const testConnection = useCallback(async (testConfig?: MailerConfigDto): Promise<MailerTestResultDto> => {
    try {
      const configToTest = testConfig || config;
      if (!configToTest) {
        throw new Error('没有可测试的配置');
      }
      
      const response = await httpClient.post('/api/admin/mailer/test-connection', configToTest);
      return response;
    } catch (err: any) {
      console.error('Failed to test connection:', err);
      return {
        success: false,
        message: err.response?.data?.message || '连接测试失败',
        details: err.message
      };
    }
  }, [config]);

  // 发送测试邮件
  const sendTestMail = useCallback(async (request: SendTestMailRequestDto): Promise<MailerTestResultDto> => {
    try {
      const response = await httpClient.post('/api/admin/mailer/send-test', request);
      return response;
    } catch (err: any) {
      console.error('Failed to send test mail:', err);
      return {
        success: false,
        message: err.response?.data?.message || '发送测试邮件失败',
        details: err.message
      };
    }
  }, []);

  // 验证配置
  const validateConfig = useCallback(async (configToValidate: MailerConfigDto): Promise<ValidationResultDto> => {
    try {
      const response = await httpClient.post('/api/admin/mailer/validate', configToValidate);
      return response;
    } catch (err: any) {
      console.error('Failed to validate config:', err);
      return {
        valid: false,
        errors: [err.response?.data?.message || '配置验证失败'],
        warnings: []
      };
    }
  }, []);

  // 获取提供商预设配置
  const getProviderPreset = useCallback(async (providerId: string): Promise<MailerProviderDto | null> => {
    try {
      const response = await httpClient.get(`/api/admin/mailer/providers/${providerId}`);
      return response;
    } catch (err: any) {
      console.error('Failed to get provider preset:', err);
      return null;
    }
  }, []);

  // 重新加载配置
  const reloadConfig = useCallback(async () => {
    try {
      await httpClient.post('/api/admin/mailer/reload');
      await fetchConfig(); // 重新获取配置
      return { success: true };
    } catch (err: any) {
      console.error('Failed to reload config:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '重新加载配置失败' 
      };
    }
  }, [fetchConfig]);

  // 初始加载
  useEffect(() => {
    fetchConfig();
    fetchProviders();
  }, [fetchConfig, fetchProviders]);

  // 获取邮件统计数据
  const getMailerStatistics = useCallback(async (dateRange?: { from: Date; to: Date }, templateId?: string) => {
    try {
      const params = new URLSearchParams();
      if (dateRange) {
        params.append('from', dateRange.from.toISOString());
        params.append('to', dateRange.to.toISOString());
      }
      if (templateId && templateId !== 'all') {
        params.append('templateId', templateId);
      }
      
      const response = await httpClient.get(`/api/admin/mailer/statistics?${params.toString()}`);
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to get mailer statistics:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '获取邮件统计失败' 
      };
    }
  }, []);

  // 获取邮件发送日志
  const getMailerLogs = useCallback(async (page = 1, size = 20, status?: string) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString()
      });
      if (status && status !== 'all') {
        params.append('status', status);
      }
      
      const response = await httpClient.get(`/api/admin/mailer/logs?${params.toString()}`);
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to get mailer logs:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '获取邮件日志失败' 
      };
    }
  }, []);

  return {
    config,
    providers,
    loading,
    error,
    refetch: fetchConfig,
    updateConfig,
    testConnection,
    sendTestMail,
    validateConfig,
    getProviderPreset,
    reloadConfig,
    getMailerStatistics,
    getMailerLogs,
  };
}

export function useMailerStats() {
  const [stats, setStats] = useState<MailerStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/mailer/stats');
      setStats(response);
    } catch (err: any) {
      console.error('Failed to fetch mailer stats:', err);
      setError('无法加载邮件统计');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}
