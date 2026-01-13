/**
 * WorkspaceConnectionManager - Workspace连接管理器（单例工厂）
 *
 * 职责：
 * 1. 为每个workspace维护唯一的WorkspaceConnection实例
 * 2. 管理连接的生命周期（创建、复用、销毁）
 * 3. 提供全局访问点
 *
 * 模式：单例工厂模式
 * - 全局只有一个Manager实例
 * - 每个workspace只有一个Connection实例
 * - 引用计数管理连接生命周期
 */

import type { SpaceType } from '../../utils/universal-id';
import {
  WorkspaceConnection,
  type WorkspaceConnectionOptions,
} from './workspace-connection';

/**
 * Workspace连接的引用计数包装器
 */
interface ConnectionRef {
  /** WorkspaceConnection实例 */
  connection: WorkspaceConnection;
  /** 引用计数 */
  refCount: number;
  /** 连接是否已建立 */
  connected: boolean;
}

/**
 * Workspace连接管理器
 *
 * 单例模式，全局唯一实例
 */
class WorkspaceConnectionManager {
  private static instance: WorkspaceConnectionManager | null = null;

  /** 连接缓存：workspace ID -> ConnectionRef */
  private connections = new Map<string, ConnectionRef>();

  private constructor() {
    // 私有构造函数，防止外部实例化
  }

  /**
   * 获取单例实例
   */
  static getInstance(): WorkspaceConnectionManager {
    if (!WorkspaceConnectionManager.instance) {
      WorkspaceConnectionManager.instance = new WorkspaceConnectionManager();
    }
    return WorkspaceConnectionManager.instance;
  }

  /**
   * 获取或创建workspace连接
   *
   * @param options - Workspace连接配置
   * @returns WorkspaceConnection实例和释放函数
   */
  getOrCreateConnection(options: WorkspaceConnectionOptions): {
    connection: WorkspaceConnection;
    release: () => void;
  } {
    const key = this.getConnectionKey(options);

    // 如果已存在，增加引用计数并返回
    let ref = this.connections.get(key);
    if (ref) {
      ref.refCount++;
      console.log(
        `♻️ [WorkspaceConnectionManager] 复用连接: ${key} (refCount: ${ref.refCount})`
      );

      return {
        connection: ref.connection,
        release: () => this.releaseConnection(key),
      };
    }

    // 创建新连接
    const connection = new WorkspaceConnection(options);
    ref = {
      connection,
      refCount: 1,
      connected: false,
    };

    this.connections.set(key, ref);

    console.log(
      `✨ [WorkspaceConnectionManager] 创建新连接: ${key} (refCount: 1)`
    );

    return {
      connection,
      release: () => this.releaseConnection(key),
    };
  }

  /**
   * 释放连接引用
   *
   * 当引用计数降为0时，断开连接并销毁实例
   */
  private releaseConnection(key: string): void {
    const ref = this.connections.get(key);
    if (!ref) {
      console.warn(
        `⚠️ [WorkspaceConnectionManager] 试图释放不存在的连接: ${key}`
      );
      return;
    }

    ref.refCount--;

    console.log(
      `📉 [WorkspaceConnectionManager] 释放连接: ${key} (refCount: ${ref.refCount})`
    );

    // 如果引用计数降为0，断开连接并销毁
    if (ref.refCount <= 0) {
      ref.connection
        .disconnect()
        .then(() => {
          console.log(
            `🗑️ [WorkspaceConnectionManager] 销毁连接: ${key}`
          );
        })
        .catch((error) => {
          console.error(
            `❌ [WorkspaceConnectionManager] 断开连接失败: ${key}`,
            error
          );
        });

      this.connections.delete(key);
    }
  }

  /**
   * 获取连接的唯一标识
   *
   * 格式：spaceType:spaceId
   * 例如：workspace:550e8400-e29b-41d4-a716-446655440000
   */
  private getConnectionKey(options: WorkspaceConnectionOptions): string {
    return `${options.spaceType}:${options.spaceId}`;
  }

  /**
   * 获取当前活跃连接数
   */
  getActiveConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * 获取所有连接的状态（用于调试）
   */
  getConnectionStats(): Array<{
    key: string;
    refCount: number;
    connected: boolean;
    isReady: boolean;
  }> {
    return Array.from(this.connections.entries()).map(([key, ref]) => ({
      key,
      refCount: ref.refCount,
      connected: ref.connected,
      isReady: ref.connection.isReady,
    }));
  }

  /**
   * 强制断开所有连接（用于测试或应用关闭）
   */
  async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.connections.values()).map(
      (ref) => ref.connection.disconnect()
    );

    await Promise.all(disconnectPromises);
    this.connections.clear();

    console.log('🧹 [WorkspaceConnectionManager] 所有连接已断开');
  }
}

/**
 * 导出单例实例的便捷访问方法
 */
export function getWorkspaceConnectionManager(): WorkspaceConnectionManager {
  return WorkspaceConnectionManager.getInstance();
}

/**
 * 创建或获取workspace连接
 *
 * 这是推荐的API，供上层代码使用
 *
 * @example
 * ```typescript
 * const { connection, release } = createWorkspaceConnection({
 *   serverBaseUrl: 'https://api.example.com',
 *   isSelfHosted: false,
 *   spaceType: 'workspace',
 *   spaceId: 'workspace-123',
 * });
 *
 * // 使用连接
 * await connection.connect();
 *
 * // 完成后释放
 * release();
 * ```
 */
export function createWorkspaceConnection(options: WorkspaceConnectionOptions): {
  connection: WorkspaceConnection;
  release: () => void;
} {
  return getWorkspaceConnectionManager().getOrCreateConnection(options);
}
