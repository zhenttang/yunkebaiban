import { upperFirst } from 'lodash-es';
import type { ComponentType } from 'react';

import CONFIG_DESCRIPTORS from '../../config.json';
import type { ConfigInputProps } from './config-input-row';
import { SendTestEmail } from './operations/send-test-email';
import { StorageConfigOperation } from './operations/storage-config';
export type ConfigType = 'String' | 'Number' | 'Boolean' | 'JSON' | 'Enum';

type ConfigDescriptor = {
  desc: string;
  type: ConfigType;
  env?: string;
  link?: string;
};

export type AppConfig = Record<string, Record<string, any>>;

type AppConfigDescriptors = typeof CONFIG_DESCRIPTORS;
type AppConfigModule = keyof AppConfigDescriptors;
type ModuleConfigDescriptors<M extends AppConfigModule> =
  AppConfigDescriptors[M];
type ConfigGroup<T extends AppConfigModule> = {
  name: string;
  module: T;
  fields: Array<
    | keyof ModuleConfigDescriptors<T>
    | ({
        key: keyof ModuleConfigDescriptors<T>;
        sub?: string;
        desc?: string;
      } & Partial<ConfigInputProps>)
  >;
  operations?: ComponentType<{
    appConfig: AppConfig;
  }>[];
};
const IGNORED_MODULES: (keyof AppConfig)[] = [];

if (globalThis.environment?.isSelfHosted) {
  IGNORED_MODULES.push('payment');
}

const ALL_CONFIGURABLE_MODULES = Object.keys(CONFIG_DESCRIPTORS).filter(
  key => !IGNORED_MODULES.includes(key as keyof AppConfig)
);

export const KNOWN_CONFIG_GROUPS = [
  {
    name: '服务器',
    module: 'server',
    fields: ['externalUrl', 'name'],
  } as ConfigGroup<'server'>,
  {
    name: '认证授权',
    module: 'auth',
    fields: [
      'allowSignup',
      // 嵌套的JSON对象
      {
        key: 'passwordRequirements',
        sub: 'min',
        type: 'Number',
        desc: '密码最小长度要求',
      },
      {
        key: 'passwordRequirements',
        sub: 'max',
        type: 'Number',
        desc: '密码最大长度要求',
      },
    ],
  } as ConfigGroup<'auth'>,
  {
    name: '通知服务',
    module: 'mailer',
    fields: [
      'SMTP.host',
      'SMTP.port',
      'SMTP.username',
      'SMTP.password',
      'SMTP.ignoreTLS',
      'SMTP.sender',
    ],
    operations: [SendTestEmail],
  } as ConfigGroup<'mailer'>,
  {
    name: '存储服务',
    module: 'storages',
    fields: [
      {
        key: 'blob.storage',
        desc: '用户上传文件的存储提供商',
        sub: 'provider',
        type: 'Enum',
        options: ['fs', 'aws-s3', 'cloudflare-r2', 'tencent-cos'],
      },
      {
        key: 'blob.storage',
        sub: 'bucket',
        type: 'String',
        desc: '用户上传文件存储的桶名称',
      },
      {
        key: 'blob.storage',
        sub: 'config',
        type: 'JSON',
        desc: '直接传递给存储提供商的配置（例如aws-sdk）',
      },
      {
        key: 'avatar.storage',
        desc: '用户头像的存储提供商',
        sub: 'provider',
        type: 'Enum',
        options: ['fs', 'aws-s3', 'cloudflare-r2', 'tencent-cos'],
      },
      {
        key: 'avatar.storage',
        sub: 'bucket',
        type: 'String',
        desc: '用户头像存储的桶名称',
      },
      {
        key: 'avatar.storage',
        sub: 'config',
        type: 'JSON',
        desc: '直接传递给存储提供商的配置（例如aws-sdk）',
      },
      {
        key: 'avatar.publicPath',
        type: 'String',
        desc: '用户头像的公开路径前缀（例如 https://my-bucket.s3.amazonaws.com/）',
      },
    ],
    operations: [StorageConfigOperation],
  } as ConfigGroup<'storages'>,
  {
    name: '第三方登录',
    module: 'oauth',
    fields: ['providers.google', 'providers.github', 'providers.oidc'],
  } as ConfigGroup<'oauth'>,
  {
    name: '人工智能',
    module: 'copilot',
    fields: [
      'enabled',
      'providers.openai',
      'providers.deepseek',
      'providers.gemini',
      'providers.perplexity',
      'providers.anthropic',
      'providers.fal',
      'unsplash',
      'exa',
      {
        key: 'storage',
        desc: 'AI助手文件的存储提供商',
        sub: 'provider',
        type: 'Enum',
        options: ['fs', 'aws-s3', 'cloudflare-r2', 'tencent-cos'],
      },
      {
        key: 'storage',
        sub: 'bucket',
        type: 'String',
        desc: 'AI助手文件存储的桶名称',
      },
      {
        key: 'storage',
        sub: 'config',
        type: 'JSON',
        desc: '直接传递给存储提供商的配置（例如aws-sdk）',
      },
    ],
  } as ConfigGroup<'copilot'>,
  {
    name: '任务管理',
    module: 'job',
    fields: [
      {
        key: 'queue',
        desc: '任务队列配置',
        type: 'JSON'
      },
      {
        key: 'worker',
        desc: '工作线程配置',
        type: 'JSON'
      },
      {
        key: 'queues.copilot',
        desc: 'AI助手任务队列配置',
        type: 'JSON'
      },
      {
        key: 'queues.doc',
        desc: '文档任务队列配置',
        type: 'JSON'
      },
      {
        key: 'queues.indexer',
        desc: '索引任务队列配置',
        type: 'JSON'
      },
      {
        key: 'queues.notification',
        desc: '通知任务队列配置',
        type: 'JSON'
      },
      {
        key: 'queues.nightly',
        desc: '定时任务队列配置',
        type: 'JSON'
      }
    ],
  } as ConfigGroup<'job'>,
  {
    name: '访问限流',
    module: 'throttle',
    fields: [
      {
        key: 'enabled',
        desc: '是否启用访问限流控制',
        type: 'Boolean'
      },
      {
        key: 'throttlers.default',
        desc: '默认限流器配置',
        type: 'JSON'
      },
      {
        key: 'throttlers.strict',
        desc: '严格限流器配置',
        type: 'JSON'
      }
    ],
  } as ConfigGroup<'throttle'>,
  {
    name: '文档服务',
    module: 'doc',
    fields: [
      {
        key: 'experimental.yocto',
        desc: '使用y-octo进行Yjs更新合并',
        type: 'Boolean'
      },
      {
        key: 'history.interval',
        desc: '文档更新时创建历史快照的最小时间间隔（毫秒）',
        type: 'Number'
      }
    ],
  } as ConfigGroup<'doc'>,
  {
    name: 'WebSocket',
    module: 'websocket',
    fields: [
      {
        key: 'transports',
        desc: '允许的WebSocket传输协议',
        type: 'JSON'
      },
      {
        key: 'maxHttpBufferSize',
        desc: '消息允许的最大字节数（防止DoS攻击）',
        type: 'Number'
      }
    ],
  } as ConfigGroup<'websocket'>,
];

export const UNKNOWN_CONFIG_GROUPS = ALL_CONFIGURABLE_MODULES.filter(
  module => !KNOWN_CONFIG_GROUPS.some(group => group.module === module)
).map(module => {
  // 根据模块名称返回中文菜单名称
  let name = upperFirst(module);
  if (module === 'metrics') name = '监控指标';
  else if (module === 'crypto') name = '加密服务';
  else if (module === 'flags') name = '功能标志';
  else if (module === 'docService') name = '文档服务';
  else if (module === 'client') name = '客户端';
  else if (module === 'captcha') name = '验证码';
  else if (module === 'customerIo') name = '客户反馈';
  else if (module === 'indexer') name = '索引服务';
  else if (module === 'payment') name = '支付系统';
  else if (module === 'worker') name = '工作进程';
  
  return {
    name,
    module,
    // @ts-expect-error 允许类型错误
    fields: Object.keys(CONFIG_DESCRIPTORS[module]),
    operations: undefined,
  };
});

export const ALL_SETTING_GROUPS = [
  ...KNOWN_CONFIG_GROUPS,
  ...UNKNOWN_CONFIG_GROUPS,
];

export const ALL_CONFIG_DESCRIPTORS = CONFIG_DESCRIPTORS as Record<
  string,
  Record<string, ConfigDescriptor>
>;
