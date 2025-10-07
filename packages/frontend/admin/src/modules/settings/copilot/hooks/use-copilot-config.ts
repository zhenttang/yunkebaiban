import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { cloneDeep, merge, set as lodashSet } from 'lodash-es';

import { httpClient } from '../../../../../../../common/request/src';

export interface CopilotProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  enabled?: boolean;
}

export interface CopilotConfig {
  enabled: boolean;
  providers: Record<string, CopilotProviderConfig>;
  unsplash?: { key?: string } | null;
  exa?: { apiKey?: string } | null;
  storage: {
    provider: string;
    bucket: string;
    config: Record<string, unknown>;
  };
}

const DEFAULT_CONFIG: CopilotConfig = {
  enabled: false,
  providers: {
    openai: {},
    deepseek: {},
    gemini: {},
    perplexity: {},
    anthropic: {},
    fal: {},
  },
  unsplash: { key: '' },
  exa: { apiKey: '' },
  storage: {
    provider: 'fs',
    bucket: '',
    config: {},
  },
};

const PROVIDER_TITLES: Record<string, { name: string; docs?: string }> = {
  openai: { name: 'OpenAI', docs: 'https://platform.openai.com/' },
  deepseek: { name: 'DeepSeek', docs: 'https://platform.deepseek.com/' },
  gemini: { name: 'Google Gemini', docs: 'https://ai.google.dev/' },
  perplexity: { name: 'Perplexity', docs: 'https://www.perplexity.ai/' },
  anthropic: { name: 'Anthropic Claude', docs: 'https://console.anthropic.com/' },
  fal: { name: 'Fal.AI', docs: 'https://fal.ai/' },
};

export function useCopilotConfig() {
  const [config, setConfig] = useState<CopilotConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get('/api/admin/config');
      const data = response?.copilot ?? response?.appConfig?.copilot ?? DEFAULT_CONFIG;
      setConfig(prev => merge(cloneDeep(prev), DEFAULT_CONFIG, data));
    } catch (err: any) {
      console.error('Failed to fetch copilot config:', err);
      setError('无法加载 Copilot 设置');
      setConfig(DEFAULT_CONFIG);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const applyLocalUpdate = useCallback((path: string, value: unknown) => {
    setConfig(prev => {
      const next = cloneDeep(prev);
      lodashSet(next, path, value);
      return next;
    });
  }, []);

  const updateRemoteConfig = useCallback(
    async (key: string, value: unknown, successMessage?: string) => {
      setSaving(true);
      try {
        await httpClient.post('/api/admin/config', {
          module: 'copilot',
          key,
          value,
        });
        if (successMessage) {
          toast.success(successMessage);
        }
      } catch (err: any) {
        console.error(`Failed to update copilot config for ${key}:`, err);
        toast.error('保存失败，请稍后重试');
        await fetchConfig();
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchConfig]
  );

  const setEnabled = useCallback(
    async (enabled: boolean) => {
      applyLocalUpdate('enabled', enabled);
      await updateRemoteConfig('enabled', enabled, enabled ? 'Copilot 已启用' : 'Copilot 已关闭');
    },
    [applyLocalUpdate, updateRemoteConfig]
  );

  const updateProvider = useCallback(
    async (provider: string, payload: CopilotProviderConfig) => {
      applyLocalUpdate(`providers.${provider}`, payload);
      await updateRemoteConfig(
        `providers.${provider}`,
        payload,
        `${PROVIDER_TITLES[provider]?.name ?? provider} 配置已保存`
      );
    },
    [applyLocalUpdate, updateRemoteConfig]
  );

  const updateUnsplash = useCallback(
    async (key: string) => {
      applyLocalUpdate('unsplash.key', key);
      await updateRemoteConfig('unsplash', { key }, 'Unsplash 密钥已保存');
    },
    [applyLocalUpdate, updateRemoteConfig]
  );

  const updateExa = useCallback(
    async (apiKey: string) => {
      applyLocalUpdate('exa.apiKey', apiKey);
      await updateRemoteConfig('exa', { apiKey }, 'Exa 密钥已保存');
    },
    [applyLocalUpdate, updateRemoteConfig]
  );

  const updateStorage = useCallback(
    async (storage: CopilotConfig['storage']) => {
      applyLocalUpdate('storage', storage);
      await updateRemoteConfig('storage', storage, '存储配置已保存');
    },
    [applyLocalUpdate, updateRemoteConfig]
  );

  const providerList = useMemo(() => {
    return Object.keys(PROVIDER_TITLES).map(id => ({
      id,
      name: PROVIDER_TITLES[id].name,
      docs: PROVIDER_TITLES[id].docs,
      config: config.providers[id] ?? {},
    }));
  }, [config.providers]);

  return {
    config,
    loading,
    error,
    saving,
    providerList,
    setEnabled,
    updateProvider,
    updateUnsplash,
    updateExa,
    updateStorage,
    refresh: fetchConfig,
  };
}
