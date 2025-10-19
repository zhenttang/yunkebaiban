/**
 * BlockSuite Layout - 高级存储功能
 * 
 * @author 开发者A2 - 数据存储专家
 * @description 存储事件、同步状态、高级缓存等功能
 */

import type { 
  DocLayoutConfig,
  StorageOptions,
  SyncStatus,
  StorageEvent,
  CacheStrategy
} from '../types/contracts.js';

/**
 * 存储事件管理器
 * 处理存储相关的事件发布和订阅
 */
export class StorageEventManager {
  private listeners = new Map<string, Set<Function>>();
  private eventHistory: StorageEvent[] = [];
  private maxHistorySize = 100;

  /**
   * 订阅存储事件
   */
  subscribe(eventType: string, callback: (event: StorageEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
    
    // 返回取消订阅函数
    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        eventListeners.delete(callback);
        if (eventListeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * 发布存储事件
   */
  emit(eventType: string, data: any): void {
    const event: StorageEvent = {
      type: eventType,
      timestamp: Date.now(),
      data
    };

    // 记录事件历史
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // 通知订阅者
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error(`[StorageEventManager] Error in event callback:`, error);
        }
      });
    }

    console.debug(`[StorageEventManager] Event emitted: ${eventType}`, data);
  }

  /**
   * 获取事件历史
   */
  getEventHistory(eventType?: string, limit: number = 50): StorageEvent[] {
    let events = this.eventHistory;
    
    if (eventType) {
      events = events.filter(event => event.type === eventType);
    }
    
    return events.slice(-limit);
  }

  /**
   * 清空事件历史
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  /**
   * 获取所有活跃的事件监听器数量
   */
  getListenerCount(): Map<string, number> {
    const counts = new Map<string, number>();
    
    this.listeners.forEach((listeners, eventType) => {
      counts.set(eventType, listeners.size);
    });
    
    return counts;
  }

  /**
   * 销毁事件管理器
   */
  dispose(): void {
    this.listeners.clear();
    this.eventHistory = [];
  }
}

/**
 * 同步状态管理器
 * 管理存储的同步状态和冲突解决
 */
export class SyncStateManager {
  private syncStates = new Map<string, SyncStatus>();
  private conflictResolver: ConflictResolver;
  private eventManager: StorageEventManager;

  constructor(eventManager: StorageEventManager) {
    this.eventManager = eventManager;
    this.conflictResolver = new ConflictResolver();
  }

  /**
   * 更新文档的同步状态
   */
  updateSyncStatus(docId: string, status: Partial<SyncStatus>): void {
    const existingStatus = this.syncStates.get(docId) || {
      docId,
      lastSyncTime: 0,
      status: 'synced',
      conflictVersion: null,
      retryCount: 0
    };

    const newStatus: SyncStatus = {
      ...existingStatus,
      ...status,
      lastSyncTime: Date.now()
    };

    this.syncStates.set(docId, newStatus);

    // 发布同步状态变更事件
    this.eventManager.emit('sync-status-changed', {
      docId,
      oldStatus: existingStatus,
      newStatus
    });

    console.debug(`[SyncStateManager] Sync status updated for ${docId}:`, newStatus);
  }

  /**
   * 获取文档的同步状态
   */
  getSyncStatus(docId: string): SyncStatus | null {
    return this.syncStates.get(docId) || null;
  }

  /**
   * 标记文档为同步中
   */
  markAsSyncing(docId: string): void {
    this.updateSyncStatus(docId, {
      status: 'syncing',
      retryCount: 0
    });
  }

  /**
   * 标记文档同步完成
   */
  markAsSynced(docId: string): void {
    this.updateSyncStatus(docId, {
      status: 'synced',
      conflictVersion: null,
      retryCount: 0
    });
  }

  /**
   * 标记文档同步失败
   */
  markAsFailed(docId: string, error: string): void {
    const currentStatus = this.getSyncStatus(docId);
    const retryCount = (currentStatus?.retryCount || 0) + 1;

    this.updateSyncStatus(docId, {
      status: 'failed',
      error,
      retryCount
    });
  }

  /**
   * 标记文档存在冲突
   */
  markAsConflicted(docId: string, conflictVersion: string): void {
    this.updateSyncStatus(docId, {
      status: 'conflict',
      conflictVersion
    });
  }

  /**
   * 解决同步冲突
   */
  async resolveConflict(
    docId: string, 
    localConfig: DocLayoutConfig, 
    remoteConfig: DocLayoutConfig
  ): Promise<DocLayoutConfig> {
    const resolvedConfig = await this.conflictResolver.resolve(localConfig, remoteConfig);
    
    this.markAsSynced(docId);
    
    this.eventManager.emit('conflict-resolved', {
      docId,
      localConfig,
      remoteConfig,
      resolvedConfig
    });

    return resolvedConfig;
  }

  /**
   * 获取所有需要重试的文档
   */
  getDocumentsForRetry(maxRetries: number = 3): string[] {
    const docsToRetry: string[] = [];
    
    this.syncStates.forEach((status, docId) => {
      if (status.status === 'failed' && status.retryCount < maxRetries) {
        docsToRetry.push(docId);
      }
    });
    
    return docsToRetry;
  }

  /**
   * 清理过期的同步状态
   */
  cleanupExpiredStates(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const expiredDocs: string[] = [];
    
    this.syncStates.forEach((status, docId) => {
      if (now - status.lastSyncTime > maxAge) {
        expiredDocs.push(docId);
      }
    });
    
    expiredDocs.forEach(docId => {
      this.syncStates.delete(docId);
      console.debug(`[SyncStateManager] Cleaned up expired sync state for ${docId}`);
    });
  }

  /**
   * 获取同步统计信息
   */
  getSyncStats(): {
    total: number;
    synced: number;
    syncing: number;
    failed: number;
    conflict: number;
  } {
    const stats = {
      total: this.syncStates.size,
      synced: 0,
      syncing: 0,
      failed: 0,
      conflict: 0
    };

    this.syncStates.forEach(status => {
      stats[status.status]++;
    });

    return stats;
  }
}

/**
 * 冲突解决器
 * 处理配置冲突的自动解决策略
 */
export class ConflictResolver {
  
  /**
   * 解决配置冲突
   */
  async resolve(
    localConfig: DocLayoutConfig, 
    remoteConfig: DocLayoutConfig
  ): Promise<DocLayoutConfig> {
    console.debug('[ConflictResolver] Resolving conflict between configs:', {
      local: localConfig,
      remote: remoteConfig
    });

    // 策略1: 时间戳优先 - 选择最新修改的配置
    if (localConfig.lastModified !== remoteConfig.lastModified) {
      const newerConfig = localConfig.lastModified > remoteConfig.lastModified 
        ? localConfig 
        : remoteConfig;
      
      console.debug('[ConflictResolver] Resolved by timestamp - using newer config');
      return { ...newerConfig, lastModified: Date.now() };
    }

    // 策略2: 版本优先 - 选择版本更高的配置
    const localVersion = this._parseVersion(localConfig.version);
    const remoteVersion = this._parseVersion(remoteConfig.version);
    
    if (localVersion !== remoteVersion) {
      const newerVersionConfig = localVersion > remoteVersion 
        ? localConfig 
        : remoteConfig;
      
      console.debug('[ConflictResolver] Resolved by version - using newer version');
      return { ...newerVersionConfig, lastModified: Date.now() };
    }

    // 策略3: 智能合并 - 合并两个配置的最佳特性
    const mergedConfig = await this._smartMerge(localConfig, remoteConfig);
    
    console.debug('[ConflictResolver] Resolved by smart merge');
    return mergedConfig;
  }

  /**
   * 检测配置冲突
   */
  detectConflict(localConfig: DocLayoutConfig, remoteConfig: DocLayoutConfig): boolean {
    // 检查关键字段是否不同
    const criticalFields: (keyof DocLayoutConfig)[] = [
      'layoutMode', 
      'columnWidths', 
      'responsive'
    ];

    for (const field of criticalFields) {
      if (JSON.stringify(localConfig[field]) !== JSON.stringify(remoteConfig[field])) {
        return true;
      }
    }

    return false;
  }

  // ================================
  // 私有方法
  // ================================

  private _parseVersion(version: string): number {
    const parts = version.split('.').map(Number);
    return parts[0] * 10000 + parts[1] * 100 + parts[2];
  }

  private async _smartMerge(
    localConfig: DocLayoutConfig, 
    remoteConfig: DocLayoutConfig
  ): Promise<DocLayoutConfig> {
    // 智能合并策略：保留更先进的配置选项
    const mergedConfig: DocLayoutConfig = {
      docId: localConfig.docId,
      version: this._selectBetterVersion(localConfig.version, remoteConfig.version),
      lastModified: Date.now(),
      
      // 布局模式：选择列数更多的（假设用户倾向于更复杂的布局）
      layoutMode: this._selectBetterLayoutMode(localConfig.layoutMode, remoteConfig.layoutMode),
      
      // 列宽：如果布局模式相同，选择更均衡的宽度分布
      columnWidths: await this._selectBetterColumnWidths(
        localConfig.layoutMode, localConfig.columnWidths,
        remoteConfig.layoutMode, remoteConfig.columnWidths
      ),
      
      // 响应式：优先选择启用响应式的配置
      responsive: localConfig.responsive || remoteConfig.responsive,
      
      // 自定义数据：合并所有自定义字段
      ...(localConfig as any).customData && { customData: (localConfig as any).customData },
      ...(remoteConfig as any).customData && { 
        customData: { 
          ...(localConfig as any).customData, 
          ...(remoteConfig as any).customData 
        }
      }
    };

    return mergedConfig;
  }

  private _selectBetterVersion(localVersion: string, remoteVersion: string): string {
    return this._parseVersion(localVersion) >= this._parseVersion(remoteVersion) 
      ? localVersion 
      : remoteVersion;
  }

  private _selectBetterLayoutMode(localMode: any, remoteMode: any): any {
    const modeComplexity = {
      'normal': 1,
      '2-column': 2,
      '3-column': 3,
      '4-column': 4,
      '5-column': 5
    };

    const localComplexity = modeComplexity[localMode as keyof typeof modeComplexity] || 1;
    const remoteComplexity = modeComplexity[remoteMode as keyof typeof modeComplexity] || 1;

    return localComplexity >= remoteComplexity ? localMode : remoteMode;
  }

  private async _selectBetterColumnWidths(
    localMode: any, localWidths: number[],
    remoteMode: any, remoteWidths: number[]
  ): Promise<number[]> {
    // 如果布局模式不同，使用更复杂布局的列宽
    if (localMode !== remoteMode) {
      return this._selectBetterLayoutMode(localMode, remoteMode) === localMode 
        ? localWidths 
        : remoteWidths;
    }

    // 如果布局模式相同，选择更均衡的宽度分布
    const localBalance = this._calculateWidthBalance(localWidths);
    const remoteBalance = this._calculateWidthBalance(remoteWidths);

    return localBalance >= remoteBalance ? localWidths : remoteWidths;
  }

  private _calculateWidthBalance(widths: number[]): number {
    if (widths.length <= 1) return 1;

    const average = widths.reduce((sum, width) => sum + width, 0) / widths.length;
    const variance = widths.reduce((sum, width) => sum + Math.pow(width - average, 2), 0) / widths.length;
    
    // 返回平衡度 (方差越小，平衡度越高)
    return 1 / (1 + variance);
  }
}

/**
 * 高级缓存管理器
 * 实现多种缓存策略和智能清理
 */
export class AdvancedCacheManager {
  private cache = new Map<string, CacheEntry>();
  private strategy: CacheStrategy = 'lru';
  private maxSize: number = 100;
  private maxAge: number = 60 * 60 * 1000; // 1小时
  private hitStats = new Map<string, number>();
  private accessOrder: string[] = [];

  constructor(strategy: CacheStrategy = 'lru', maxSize: number = 100) {
    this.strategy = strategy;
    this.maxSize = maxSize;
  }

  /**
   * 设置缓存项
   */
  set(key: string, value: DocLayoutConfig, ttl?: number): void {
    const entry: CacheEntry = {
      key,
      value: { ...value },
      timestamp: Date.now(),
      ttl: ttl || this.maxAge,
      hitCount: 0,
      lastAccessed: Date.now()
    };

    // 如果缓存已满，根据策略清理
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this._evict();
    }

    this.cache.set(key, entry);
    this._updateAccessOrder(key);

    console.debug(`[AdvancedCacheManager] Cached item: ${key}`);
  }

  /**
   * 获取缓存项
   */
  get(key: string): DocLayoutConfig | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (this._isExpired(entry)) {
      this.cache.delete(key);
      this._removeFromAccessOrder(key);
      return null;
    }

    // 更新访问统计
    entry.hitCount++;
    entry.lastAccessed = Date.now();
    this._updateAccessOrder(key);

    // 更新全局命中统计
    const currentHits = this.hitStats.get(key) || 0;
    this.hitStats.set(key, currentHits + 1);

    console.debug(`[AdvancedCacheManager] Cache hit: ${key}`);
    return { ...entry.value };
  }

  /**
   * 删除缓存项
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this._removeFromAccessOrder(key);
      this.hitStats.delete(key);
      console.debug(`[AdvancedCacheManager] Deleted cache item: ${key}`);
    }
    return deleted;
  }

  /**
   * 检查缓存项是否存在且未过期
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this._isExpired(entry);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.hitStats.clear();
    console.debug('[AdvancedCacheManager] Cache cleared');
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this._calculateHitRate(),
      averageAge: entries.reduce((sum, entry) => sum + (now - entry.timestamp), 0) / entries.length || 0,
      strategy: this.strategy,
      topHits: this._getTopHits(5)
    };
  }

  /**
   * 设置缓存策略
   */
  setStrategy(strategy: CacheStrategy): void {
    this.strategy = strategy;
    console.debug(`[AdvancedCacheManager] Cache strategy changed to: ${strategy}`);
  }

  /**
   * 手动清理过期项
   */
  cleanup(): number {
    const expiredKeys: string[] = [];
    const now = Date.now();

    this.cache.forEach((entry, key) => {
      if (this._isExpired(entry)) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this._removeFromAccessOrder(key);
      this.hitStats.delete(key);
    });

    if (expiredKeys.length > 0) {
      console.debug(`[AdvancedCacheManager] Cleaned up ${expiredKeys.length} expired items`);
    }

    return expiredKeys.length;
  }

  // ================================
  // 私有方法
  // ================================

  private _evict(): void {
    const keyToEvict = this._selectEvictionKey();
    if (keyToEvict) {
      this.delete(keyToEvict);
      console.debug(`[AdvancedCacheManager] Evicted item: ${keyToEvict}`);
    }
  }

  private _selectEvictionKey(): string | null {
    switch (this.strategy) {
      case 'lru': // Least Recently Used
        return this.accessOrder[0] || null;
      
      case 'lfu': // Least Frequently Used
        return this._getLFUKey();
      
      case 'fifo': // First In First Out
        return this._getFIFOKey();
      
      case 'ttl': // Time To Live based
        return this._getTTLKey();
      
      default:
        return this.accessOrder[0] || null;
    }
  }

  private _getLFUKey(): string | null {
    let minHits = Infinity;
    let lfuKey: string | null = null;

    this.cache.forEach((entry, key) => {
      if (entry.hitCount < minHits) {
        minHits = entry.hitCount;
        lfuKey = key;
      }
    });

    return lfuKey;
  }

  private _getFIFOKey(): string | null {
    let oldestTime = Infinity;
    let fifoKey: string | null = null;

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        fifoKey = key;
      }
    });

    return fifoKey;
  }

  private _getTTLKey(): string | null {
    let shortestTTL = Infinity;
    let ttlKey: string | null = null;

    this.cache.forEach((entry, key) => {
      const remainingTTL = entry.ttl - (Date.now() - entry.timestamp);
      if (remainingTTL < shortestTTL) {
        shortestTTL = remainingTTL;
        ttlKey = key;
      }
    });

    return ttlKey;
  }

  private _isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private _updateAccessOrder(key: string): void {
    // 移除旧位置
    this._removeFromAccessOrder(key);
    // 添加到末尾 (最近访问)
    this.accessOrder.push(key);
  }

  private _removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  private _calculateHitRate(): number {
    const totalHits = Array.from(this.hitStats.values()).reduce((sum, hits) => sum + hits, 0);
    const totalRequests = totalHits + this.cache.size; // 简化计算
    return totalRequests > 0 ? totalHits / totalRequests : 0;
  }

  private _getTopHits(limit: number): Array<{key: string, hits: number}> {
    return Array.from(this.hitStats.entries())
      .map(([key, hits]) => ({ key, hits }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }
}

// ================================
// 类型定义
// ================================

interface CacheEntry {
  key: string;
  value: DocLayoutConfig;
  timestamp: number;
  ttl: number;
  hitCount: number;
  lastAccessed: number;
}

interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  averageAge: number;
  strategy: CacheStrategy;
  topHits: Array<{key: string, hits: number}>;
}

/**
 * 导出的高级存储工具集合
 */
export const AdvancedStorageUtils = {
  EventManager: StorageEventManager,
  SyncManager: SyncStateManager,
  ConflictResolver,
  CacheManager: AdvancedCacheManager
};