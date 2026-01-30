// import type { ServerFeature } from '@yunke/graphql';

// Temporary placeholder enum since GraphQL backend removed
enum ServerFeature {
  Captcha = 'captcha',
  Copilot = 'copilot',
  OAuth = 'oauth',
  Payment = 'payment',
}

import {
  backoffRetry,
  effect,
  Entity,
  fromPromise,
  LiveData,
  onComplete,
  onStart,
} from '@toeverything/infra';
import { exhaustMap, map, tap } from 'rxjs';

import { ServerScope } from '../scopes/server';
import { AuthService } from '../services/auth';
import { FetchService } from '../services/fetch';
// import { GraphQLService } from '../services/graphql'; // 已移除GraphQL支持
import { ServerConfigStore } from '../stores/server-config';
import type { ServerListStore } from '../stores/server-list';
import type { ServerConfig, ServerMetadata } from '../types';

type LowercaseServerFeature = Lowercase<ServerFeature>;
type ServerFeatureRecord = {
  [key in LowercaseServerFeature]: boolean;
};

export class Server extends Entity<{
  serverMetadata: ServerMetadata;
}> {
  readonly id = this.props.serverMetadata.id;
  readonly baseUrl = this.props.serverMetadata.baseUrl;
  readonly scope = this.framework.createScope(ServerScope, {
    server: this as Server,
  });

  readonly serverConfigStore = this.scope.framework.get(ServerConfigStore);
  readonly fetch = this.scope.framework.get(FetchService).fetch;
  // readonly gql = this.scope.framework.get(GraphQLService).gql; // GraphQL已移除
  get account$() {
    return this.scope.framework.get(AuthService).session.account$;
  }
  readonly serverMetadata = this.props.serverMetadata;

  constructor(private readonly serverListStore: ServerListStore) {
    super();
  }

  readonly config$ = LiveData.from<ServerConfig>(
    this.serverListStore.watchServerConfig(this.serverMetadata.id).pipe(
      map(config => {
        if (!config) {
          throw new Error('加载服务器配置失败');
        }
        return config;
      })
    ),
    null as any
  );

  readonly isConfigRevalidating$ = new LiveData(false);

  readonly features$ = this.config$.map(config => {
    return Array.from(new Set(config.features)).reduce((acc, cur) => {
      acc[cur.toLowerCase() as LowercaseServerFeature] = true;
      return acc;
    }, {} as ServerFeatureRecord);
  });

  readonly credentialsRequirement$ = this.config$.map(config => {
    return config ? config.credentialsRequirement : null;
  });

  // 🔧 检测是否为有效的服务器 URL（离线模式使用 localhost:0）
  private isValidServerUrl(): boolean {
    try {
      const url = new URL(this.baseUrl);
      // 端口为 0 表示离线模式
      if (url.port === '0') {
        return false;
      }
      // 没有有效的主机名
      if (!url.hostname || url.hostname === 'localhost' && url.port === '0') {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  readonly revalidateConfig = effect(
    exhaustMap(() => {
      // 🔧 离线模式：跳过服务器配置获取，直接使用默认配置
      if (!this.isValidServerUrl()) {
        console.log('🤖 [Server] 离线模式：跳过服务器配置获取，使用默认配置');
        // 直接设置默认配置
        const defaultConfig = {
          credentialsRequirement: { password: { minLength: 8, maxLength: 256 } },
          features: ['copilot'] as any[],
          oauthProviders: [],
          serverName: 'YUNKE Local',
          type: 'selfhosted' as const,
          version: '1.0.0',
          initialized: true,
        };
        this.serverListStore.updateServerConfig(this.serverMetadata.id, defaultConfig);
        this.isConfigRevalidating$.next(false);
        // 返回空的 observable
        return fromPromise(async () => defaultConfig).pipe(
          onComplete(() => {
            this.isConfigRevalidating$.next(false);
          })
        );
      }
      
      return fromPromise(signal =>
        this.serverConfigStore.fetchServerConfig(this.baseUrl, signal)
      ).pipe(
        backoffRetry({
          count: Infinity,
        }),
        tap(config => {
          if (!config) {
            console.warn('[Server.revalidateConfig] 空的服务器配置');
            return;
          }
          this.serverListStore.updateServerConfig(this.serverMetadata.id, {
            credentialsRequirement: (config as any)?.credentialsRequirement ?? {},
            features: (config as any)?.features ?? [],
            oauthProviders: (config as any)?.oauthProviders ?? [],
            serverName: (config as any)?.name ?? 'Server',
            type: (config as any)?.type ?? 'selfhosted',
            version: (config as any)?.version ?? '0.0.0',
            initialized: (config as any)?.initialized ?? true,
          });
        }),
        onStart(() => {
          this.isConfigRevalidating$.next(true);
        }),
        onComplete(() => {
          this.isConfigRevalidating$.next(false);
        })
      );
    })
  );

  async waitForConfigRevalidation(signal?: AbortSignal) {
    try {
      this.revalidateConfig();
      await this.isConfigRevalidating$.waitFor(
        isRevalidating => !isRevalidating,
        signal
      );
    } catch (error) {
      if (error instanceof Event && error.type === 'abort') return;
      console.error('配置重新验证失败:', error);
    }
  }

  override dispose(): void {
    this.scope.dispose();
    this.revalidateConfig.unsubscribe();
  }
}
