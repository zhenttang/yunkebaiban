import { useState, useCallback, useEffect } from 'react';
import { httpClient } from '../../../../../../../common/request/src';
import type { MailTemplateDto } from '../types';

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<MailTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取邮件模板列表
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await httpClient.get('/api/admin/mail-templates');
      setTemplates(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Failed to fetch email templates:', err);
      setError('无法加载邮件模板');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 创建邮件模板
  const createTemplate = useCallback(async (template: Omit<MailTemplateDto, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await httpClient.post('/api/admin/mail-templates', template);
      setTemplates(prev => [...prev, response]);
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to create template:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '创建模板失败' 
      };
    }
  }, []);

  // 更新邮件模板
  const updateTemplate = useCallback(async (id: string, template: Partial<MailTemplateDto>) => {
    try {
      const response = await httpClient.put(`/api/admin/mail-templates/${id}`, template);
      setTemplates(prev => prev.map(t => t.id === id ? response : t));
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to update template:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '更新模板失败' 
      };
    }
  }, []);

  // 删除邮件模板
  const deleteTemplate = useCallback(async (id: string) => {
    try {
      await httpClient.delete(`/api/admin/mail-templates/${id}`);
      setTemplates(prev => prev.filter(t => t.id !== id));
      return { success: true };
    } catch (err: any) {
      console.error('Failed to delete template:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '删除模板失败' 
      };
    }
  }, []);

  // 预览邮件模板
  const previewTemplate = useCallback(async (id: string, variables?: Record<string, string>) => {
    try {
      const response = await httpClient.post(`/api/admin/mail-templates/${id}/preview`, {
        variables: variables || {}
      });
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to preview template:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '预览模板失败' 
      };
    }
  }, []);

  // 复制邮件模板
  const duplicateTemplate = useCallback(async (id: string) => {
    try {
      const response = await httpClient.post(`/api/admin/mail-templates/${id}/duplicate`);
      setTemplates(prev => [...prev, response]);
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to duplicate template:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '复制模板失败' 
      };
    }
  }, []);

  // 测试邮件模板
  const testTemplate = useCallback(async (id: string, toEmail: string, variables?: Record<string, string>) => {
    try {
      const response = await httpClient.post(`/api/admin/mail-templates/${id}/test`, {
        toEmail,
        variables: variables || {}
      });
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to test template:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '发送测试邮件失败' 
      };
    }
  }, []);

  // 获取模板统计信息
  const getTemplateStats = useCallback(async () => {
    try {
      const response = await httpClient.get('/api/admin/mail-templates/stats');
      return { success: true, data: response };
    } catch (err: any) {
      console.error('Failed to get template stats:', err);
      return { 
        success: false, 
        error: err.response?.data?.message || '获取模板统计失败' 
      };
    }
  }, []);

  // 初始加载
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    previewTemplate,
    duplicateTemplate,
    testTemplate,
    getTemplateStats,
  };
}
