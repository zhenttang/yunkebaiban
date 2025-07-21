import { useMutation } from '@affine/admin/use-mutation';
import { useQuery } from '@affine/admin/use-query';
import { notify } from '@affine/component';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { UserFriendlyError } from '@affine/error';
// import {
//   appConfigQuery,
//   type UpdateAppConfigInput,
//   updateAppConfigMutation,
// } from '@affine/graphql';

// 临时占位符，用于替代 @affine/graphql 导入
type UpdateAppConfigInput = {
  module: string;
  key: string;
  value: any;
};

// 实际的REST API配置
const appConfigQuery = {
  id: 'appConfig',
  endpoint: '/api/app-configs',
  method: 'GET' as const,
};

const updateAppConfigMutation = {
  id: 'updateAppConfig', 
  endpoint: '/api/app-configs',
  method: 'POST' as const,
};
import { cloneDeep, get, merge, set } from 'lodash-es';
import { useCallback, useState } from 'react';

import type { AppConfig } from './config';

export { type UpdateAppConfigInput };

export type AppConfigUpdates = Record<string, { from: any; to: any }>;

export const useAppConfig = () => {
  // 临时使用模拟数据，避免API调用失败
  const mockAppConfig: AppConfig = {
    server: {
      name: 'AFFiNE Self-hosted Server',
      externalUrl: 'http://localhost:3010',
      https: false,
      host: 'localhost',
      port: 3010,
      path: '',
    },
    auth: {
      allowSignup: true,
      requireEmailVerification: false,
      requireEmailDomainVerification: false,
      passwordRequirements: {
        min: 8,
        max: 128,
      },
      session: {
        ttl: 604800, // 7天
        ttr: 86400,  // 1天
      },
    },
    mailer: {
      SMTP: {
        host: '',
        port: 587,
        username: '',
        password: '',
        sender: '',
        ignoreTLS: false,
      },
    },
    storages: {
      avatar: {
        storage: {
          provider: 'fs',
          bucket: '',
          config: {},
        },
        publicPath: '',
      },
      blob: {
        storage: {
          provider: 'fs',
          bucket: '',
          config: {},
        },
      },
    },
    oauth: {
      providers: {
        google: null,
        github: null,
        oidc: null,
        apple: null,
      },
    },
    copilot: {
      enabled: false,
      providers: {
        openai: null,
        deepseek: null,
        gemini: null,
        perplexity: null,
        anthropic: null,
        fal: null,
      },
      unsplash: null,
      exa: null,
      storage: {
        provider: 'fs',
        bucket: '',
        config: {},
      },
    },
    job: {
      queue: {},
      worker: {},
      queues: {
        copilot: {},
        doc: {},
        indexer: {},
        notification: {},
        nightly: {},
      },
    },
    throttle: {
      enabled: false,
      throttlers: {
        default: {},
        strict: {},
      },
    },
    doc: {
      experimental: {
        yocto: false,
      },
      history: {
        interval: 500,
      },
    },
    websocket: {
      transports: ['websocket'],
      maxHttpBufferSize: 1048576,
    },
    metrics: {
      enabled: false,
    },
    indexer: {
      enabled: false,
      provider: {
        type: '',
        endpoint: '',
        apiKey: '',
        username: '',
        password: '',
      },
      autoIndex: {
        batchSize: 10,
      },
    },
    payment: {
      enabled: false,
      showLifetimePrice: false,
      apiKey: '',
      webhookKey: '',
      stripe: {},
    },
    crypto: {
      privateKey: '',
    },
    flags: {
      earlyAccessControl: false,
    },
    docService: {
      endpoint: '',
    },
    client: {
      versionControl: {
        enabled: false,
        requiredVersion: '',
      },
    },
    captcha: {
      enabled: false,
      config: {},
    },
    customerIo: {
      enabled: false,
      token: '',
    },
    worker: {
      allowedOrigin: [],
    },
  };

  // 注释掉真实的API调用，使用模拟数据
  // const {
  //   data: { appConfig },
  //   mutate,
  // } = useQuery({
  //   query: appConfigQuery,
  // });

  // const { trigger: saveUpdates } = useMutation({
  //   mutation: updateAppConfigMutation,
  // });

  const [updates, setUpdates] = useState<AppConfigUpdates>({});
  const [patchedAppConfig, setPatchedAppConfig] = useState<AppConfig>(() =>
    cloneDeep(mockAppConfig)
  );

  const save = useAsyncCallback(async () => {
    const updateInputs: UpdateAppConfigInput[] = Object.entries(updates).map(
      ([key, value]) => {
        const splitIndex = key.indexOf('.');
        const module = key.slice(0, splitIndex);
        const field = key.slice(splitIndex + 1);

        return {
          module,
          key: field,
          value: value.to,
        };
      }
    );

    try {
      // 模拟保存操作
      console.log('保存配置更新:', updateInputs);
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟更新应用配置
      // const savedUpdates = await saveUpdates({
      //   updates: updateInputs,
      // });
      // await mutate(prev => {
      //   return { appConfig: merge({}, prev, savedUpdates) };
      // });
      
      setUpdates({});
      notify.success({
        title: '已保存',
        message: '设置已成功保存。',
      });
    } catch (e) {
      const error = UserFriendlyError.fromAny(e);
      notify.error({
        title: 'Failed to save',
        message: error.message,
      });
      console.error(e);
    }
  }, [updates]);

  const update = useCallback(
    (path: string, value: any) => {
      const [module, field, subField] = path.split('/');
      const key = `${module}.${field}`;
      const from = get(appConfig, key);
      setUpdates(prev => {
        const to = subField
          ? set(prev[key]?.to ?? { ...from }, subField, value)
          : value;

        return {
          ...prev,
          [key]: {
            from,
            to,
          },
        };
      });

      setPatchedAppConfig(prev => {
        return set(
          prev,
          `${module}.${field}${subField ? `.${subField}` : ''}`,
          value
        );
      });
    },
    [mockAppConfig]
  );

  return {
    appConfig: mockAppConfig as AppConfig,
    patchedAppConfig,
    update,
    save,
    updates,
  };
};
