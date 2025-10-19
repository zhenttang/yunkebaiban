import type { IStorageService, DocLayoutConfig } from '../types/contracts.js';
import { LayoutConfigUtils } from '../types/layout.js';

/**
 * 真实的存储服务实现
 */
export class StorageService implements IStorageService {
  private cache = new Map<string, DocLayoutConfig>();
  private storageKey = 'blocksuite-layout-configs';

  async saveLayoutConfig(docId: string, config: DocLayoutConfig): Promise<void> {
    // 验证配置
    if (!LayoutConfigUtils.validateConfig(config)) {
      throw new Error('Invalid layout configuration');
    }

    // 更新缓存
    this.cache.set(docId, { ...config });

    // 保存到localStorage
    await this.persistToStorage();
  }

  async loadLayoutConfig(docId: string): Promise<DocLayoutConfig | null> {
    // 首先从缓存获取
    if (this.cache.has(docId)) {
      return this.cache.get(docId)!;
    }

    // 从存储加载
    await this.loadFromStorage();
    return this.cache.get(docId) || null;
  }

  async clearLayoutConfig(docId: string): Promise<void> {
    this.cache.delete(docId);
    await this.persistToStorage();
  }

  async getAllLayoutConfigs(): Promise<DocLayoutConfig[]> {
    await this.loadFromStorage();
    return Array.from(this.cache.values());
  }

  async batchSaveLayoutConfigs(configs: DocLayoutConfig[]): Promise<void> {
    for (const config of configs) {
      if (LayoutConfigUtils.validateConfig(config)) {
        this.cache.set(config.docId, { ...config });
      }
    }
    await this.persistToStorage();
  }

  private async persistToStorage(): Promise<void> {
    try {
      const data = Array.from(this.cache.values());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to persist layout configs:', error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const configs: DocLayoutConfig[] = JSON.parse(stored);
        configs.forEach(config => {
          if (LayoutConfigUtils.validateConfig(config)) {
            this.cache.set(config.docId, config);
          }
        });
      }
    } catch (error) {
      console.error('Failed to load layout configs:', error);
    }
  }
}