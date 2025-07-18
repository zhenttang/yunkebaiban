import { DebugLogger } from '@affine/debug';
import { UserFriendlyError } from '@affine/error';
import { fromPromise, Service } from '@toeverything/infra';

import type { ServerService } from './server';
import type { AuthStore } from '../stores/auth';

const logger = new DebugLogger('affine:fetch');

export type FetchInit = RequestInit & { timeout?: number };

export class FetchService extends Service {
  constructor(
    private readonly serverService: ServerService,
    private readonly authStore?: AuthStore
  ) {
    super();
  }
  rxFetch = (
    input: string,
    init?: RequestInit & {
      // https://github.com/microsoft/TypeScript/issues/54472
      priority?: 'auto' | 'low' | 'high';
    } & {
      traceEvent?: string;
    }
  ) => {
    return fromPromise(signal => {
      return this.fetch(input, { signal, ...init });
    });
  };

  /**
   * fetch with custom custom timeout and error handling.
   */
  fetch = async (input: string, init?: FetchInit): Promise<Response> => {
    logger.debug('fetch', input);
    const externalSignal = init?.signal;
    if (externalSignal?.aborted) {
      throw externalSignal.reason;
    }
    const abortController = new AbortController();
    externalSignal?.addEventListener('abort', reason => {
      abortController.abort(reason);
    });

    const timeout = init?.timeout ?? 15000;
    const timeoutId = setTimeout(() => {
      abortController.abort('timeout');
    }, timeout);

    let res: Response;

    // 准备headers，包含JWT token
    const headers = {
      ...init?.headers,
      'x-affine-version': BUILD_CONFIG.appVersion,
    };

    // 如果有AuthStore且不是登录接口，添加JWT token
    if (this.authStore && !this.isAuthEndpoint(input)) {
      // 检查authStore是否有getStoredToken方法
      if (typeof this.authStore.getStoredToken === 'function') {
        const token = this.authStore.getStoredToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } else {
        console.warn('AuthStore.getStoredToken is not a function', this.authStore);
      }
    }

    try {
      res = await globalThis.fetch(
        new URL(input, this.serverService.server.serverMetadata.baseUrl),
        {
          ...init,
          signal: abortController.signal,
          // 移除credentials: 'include' - 不再使用Cookie
          headers,
        }
      );
    } catch (err: any) {
      throw new UserFriendlyError({
        status: 504,
        code: 'NETWORK_ERROR',
        type: 'NETWORK_ERROR',
        name: 'NETWORK_ERROR',
        message: `网络错误: ${err.message}`,
        stacktrace: err.stack,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      if (res.status === 504) {
        const error = new Error('网关超时');
        logger.debug('网络错误', error);
        throw new UserFriendlyError({
          status: 504,
          code: 'NETWORK_ERROR',
          type: 'NETWORK_ERROR',
          name: 'NETWORK_ERROR',
          message: '网关超时',
          stacktrace: error.stack,
        });
      } else {
        if (res.headers.get('Content-Type')?.startsWith('application/json')) {
          throw UserFriendlyError.fromAny(await res.json());
        } else {
          throw UserFriendlyError.fromAny(await res.text());
        }
      }
    }

    return res;
  };

  /**
   * 检查是否为认证相关的端点（这些端点不需要JWT token）
   */
  private isAuthEndpoint(url: string): boolean {
    const authEndpoints = [
      '/api/auth/sign-in',
      '/api/auth/sign-in-with-code',
      '/api/auth/register',
      '/api/auth/refresh',
      '/api/auth/magic-link',
      '/api/auth/send-verification-code',
      '/api/auth/preflight',
    ];
    return authEndpoints.some(endpoint => url.includes(endpoint));
  }
}
