import { DebugLogger } from '@yunke/debug';

import type { SharedStorageGlobal } from '../types';

const logger = new DebugLogger('yunke:cloud-storage:safe-storage');

/**
 * 获取 Electron SharedStorage（类型安全）
 */
function getSharedStorage(): SharedStorageGlobal['__sharedStorage'] | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const windowWithShared = window as unknown as SharedStorageGlobal;
  return windowWithShared.__sharedStorage ?? null;
}

/**
 * 安全的 Storage 访问包装器（兼容 Electron sandbox）
 * 优先使用 Electron 的 SharedStorage，回退到 localStorage
 */
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      const sharedStorage = getSharedStorage();
      if (sharedStorage?.globalState) {
        return sharedStorage.globalState.get(key) ?? null;
      }
      return localStorage?.getItem(key) ?? null;
    } catch (error) {
      logger.warn('SafeStorage getItem 失败', { key, error });
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      const sharedStorage = getSharedStorage();
      if (sharedStorage?.globalState) {
        sharedStorage.globalState.set(key, value);
        return;
      }
      localStorage?.setItem(key, value);
    } catch (error) {
      logger.warn('SafeStorage setItem 失败', { key, error });
    }
  },
  removeItem: (key: string): void => {
    try {
      const sharedStorage = getSharedStorage();
      if (sharedStorage?.globalState) {
        sharedStorage.globalState.del(key);
        return;
      }
      localStorage?.removeItem(key);
    } catch (error) {
      logger.warn('SafeStorage removeItem 失败', { key, error });
    }
  },
};

// 云同步开关存储键
const CLOUD_SYNC_ENABLED_KEY = 'yunke_cloud_sync_enabled';

/**
 * 获取云同步开关状态
 * 默认为 false（离线模式），用户需要手动开启云同步
 */
export function isCloudSyncEnabled(): boolean {
  try {
    const value = safeStorage.getItem(CLOUD_SYNC_ENABLED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

/**
 * 设置云同步开关状态
 */
export function setCloudSyncEnabled(enabled: boolean): void {
  try {
    safeStorage.setItem(CLOUD_SYNC_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch (error) {
    logger.warn('保存云同步开关状态失败', error);
  }
}

/**
 * 日志限流工具类
 * 在指定时间内对相同 key 的日志只输出一次
 */
export class LogThrottle {
  private lastLogTime = new Map<string, number>();
  private logCount = new Map<string, number>();
  private readonly throttleMs = 1000;

  log(key: string, logFn: () => void) {
    const now = Date.now();
    const lastTime = this.lastLogTime.get(key) || 0;
    if (now - lastTime > this.throttleMs) {
      logFn();
      this.lastLogTime.set(key, now);
      this.logCount.set(key, 1);
    } else {
      const count = (this.logCount.get(key) || 0) + 1;
      this.logCount.set(key, count);
    }
  }
}

/**
 * 带超时的 Promise 包装器
 */
export const awaitWithTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string
): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return new Promise<T>((resolve, reject) => {
    timer = setTimeout(() => {
      timer = null;
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then(result => {
        if (timer !== null) {
          clearTimeout(timer);
        }
        resolve(result);
      })
      .catch(error => {
        if (timer !== null) {
          clearTimeout(timer);
        }
        reject(error);
      });
  });
};
