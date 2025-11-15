import type {
  UserStorageConfig,
  StorageTestResult,
  StorageStats,
} from './types';

const API_BASE = '/api/user/storage-config';

/**
 * 用户存储配置API服务
 */
export class UserStorageConfigService {
  /**
   * 获取当前用户的存储配置
   */
  static async getConfig(): Promise<UserStorageConfig | null> {
    try {
      const response = await fetch(API_BASE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.status === 404) {
        return null; // 用户还没有配置
      }

      if (!response.ok) {
        throw new Error(`获取配置失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取存储配置失败:', error);
      throw error;
    }
  }

  /**
   * 保存或更新当前用户的存储配置
   */
  static async saveConfig(
    config: UserStorageConfig
  ): Promise<UserStorageConfig> {
    try {
      const response = await fetch(API_BASE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`保存配置失败: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('保存存储配置失败:', error);
      throw error;
    }
  }

  /**
   * 删除当前用户的存储配置
   */
  static async deleteConfig(): Promise<void> {
    try {
      const response = await fetch(API_BASE, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`删除配置失败: ${response.statusText}`);
      }
    } catch (error) {
      console.error('删除存储配置失败:', error);
      throw error;
    }
  }

  /**
   * 测试存储配置是否可用
   */
  static async testConfig(
    config: UserStorageConfig
  ): Promise<StorageTestResult> {
    try {
      const response = await fetch(`${API_BASE}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`测试配置失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('测试存储配置失败:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '测试失败',
      };
    }
  }

  /**
   * 获取存储使用统计
   */
  static async getStats(): Promise<StorageStats | null> {
    try {
      const response = await fetch(`${API_BASE}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`获取统计失败: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('获取存储统计失败:', error);
      return null;
    }
  }
}
