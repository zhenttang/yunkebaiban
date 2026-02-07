/**
 * Professional 内存管理器
 * 
 * 特性：
 * - LRU 缓存策略
 * - 智能压缩
 * - IndexedDB 持久化
 * - 内存压力监控
 * - 后台卸载
 */

import type { Rect } from '../../types/index.js';

// ==================== 配置 ====================

export interface MemoryManagerConfig {
    // 内存限制（字节）
    maxMemory: number;
    // 缓存大小（项数）
    maxCacheSize: number;
    // 压缩阈值（超过此大小自动压缩）
    compressionThreshold: number;
    // 自动卸载阈值（内存使用率）
    unloadThreshold: number;
    // 数据库名
    dbName: string;
    // 是否启用持久化
    enablePersistence: boolean;
}

const DEFAULT_CONFIG: MemoryManagerConfig = {
    maxMemory: 512 * 1024 * 1024,  // 512MB
    maxCacheSize: 200,
    compressionThreshold: 1024 * 1024,  // 1MB
    unloadThreshold: 0.8,  // 80%
    dbName: 'animation-pro-storage',
    enablePersistence: true,
};

// ==================== 缓存条目 ====================

interface CacheEntry<T> {
    id: string;
    data: T | null;
    size: number;
    compressed: boolean;
    compressedData?: ArrayBuffer;
    lastAccess: number;
    pinned: boolean;
    dirty: boolean;
}

// ==================== LRU 缓存 ====================

class LRUCache<T> {
    private entries: Map<string, CacheEntry<T>> = new Map();
    private maxSize: number;
    private currentMemory: number = 0;
    private maxMemory: number;
    
    // 回调
    onEvict?: (entry: CacheEntry<T>) => void;
    
    constructor(maxSize: number, maxMemory: number) {
        this.maxSize = maxSize;
        this.maxMemory = maxMemory;
    }
    
    get(id: string): CacheEntry<T> | undefined {
        const entry = this.entries.get(id);
        if (entry) {
            entry.lastAccess = Date.now();
            // 移到末尾
            this.entries.delete(id);
            this.entries.set(id, entry);
        }
        return entry;
    }
    
    set(id: string, entry: CacheEntry<T>): void {
        // 先删除旧的（如果存在）
        const existing = this.entries.get(id);
        if (existing) {
            this.currentMemory -= existing.size;
            this.entries.delete(id);
        }
        
        // 检查是否需要淘汰
        while (
            (this.entries.size >= this.maxSize || this.currentMemory + entry.size > this.maxMemory) &&
            this.entries.size > 0
        ) {
            this.evictOldest();
        }
        
        this.entries.set(id, entry);
        this.currentMemory += entry.size;
    }
    
    has(id: string): boolean {
        return this.entries.has(id);
    }
    
    delete(id: string): boolean {
        const entry = this.entries.get(id);
        if (entry) {
            this.currentMemory -= entry.size;
            this.entries.delete(id);
            return true;
        }
        return false;
    }
    
    clear(): void {
        this.entries.clear();
        this.currentMemory = 0;
    }
    
    getMemoryUsage(): number {
        return this.currentMemory;
    }
    
    getSize(): number {
        return this.entries.size;
    }
    
    getAllEntries(): CacheEntry<T>[] {
        return Array.from(this.entries.values());
    }
    
    private evictOldest(): void {
        // 找最旧且未固定的条目
        let oldest: { id: string; entry: CacheEntry<T> } | null = null;
        
        for (const [id, entry] of this.entries) {
            if (entry.pinned) continue;
            
            if (!oldest || entry.lastAccess < oldest.entry.lastAccess) {
                oldest = { id, entry };
            }
        }
        
        if (oldest) {
            this.onEvict?.(oldest.entry);
            this.currentMemory -= oldest.entry.size;
            this.entries.delete(oldest.id);
        }
    }
}

// ==================== 内存管理器 ====================

export class MemoryManager {
    private config: MemoryManagerConfig;
    private cache: LRUCache<ImageData | Uint8ClampedArray>;
    private db: IDBDatabase | null = null;
    
    // 压缩 Worker
    private compressionWorker: Worker | null = null;
    
    // 统计
    private stats = {
        hits: 0,
        misses: 0,
        compressions: 0,
        decompressions: 0,
        writes: 0,
        reads: 0,
    };
    
    // 内存压力回调
    onMemoryPressure?: (level: 'low' | 'medium' | 'high') => void;
    
    constructor(config: Partial<MemoryManagerConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        
        this.cache = new LRUCache(
            this.config.maxCacheSize,
            this.config.maxMemory
        );
        
        // 设置淘汰回调
        this.cache.onEvict = (entry) => {
            if (entry.dirty && this.config.enablePersistence) {
                this.persistEntry(entry).catch(console.error);
            }
        };
        
        // 初始化数据库
        if (this.config.enablePersistence) {
            this.initDatabase().catch(console.error);
        }
        
        // 监控内存压力
        this.startMemoryMonitoring();
    }
    
    // ==================== 数据库初始化 ====================
    
    private async initDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.dbName, 1);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                
                // 创建存储
                if (!db.objectStoreNames.contains('frames')) {
                    db.createObjectStore('frames', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('tiles')) {
                    db.createObjectStore('tiles', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('thumbnails')) {
                    db.createObjectStore('thumbnails', { keyPath: 'id' });
                }
            };
        });
    }
    
    // ==================== 缓存操作 ====================
    
    /**
     * 存储数据
     */
    store(
        id: string,
        data: ImageData | Uint8ClampedArray,
        options: {
            pinned?: boolean;
            compress?: boolean;
        } = {}
    ): void {
        const { pinned = false, compress = false } = options;
        
        const size = this.calculateSize(data);
        const shouldCompress = compress || size > this.config.compressionThreshold;
        
        const entry: CacheEntry<ImageData | Uint8ClampedArray> = {
            id,
            data: shouldCompress ? null : data,
            size,
            compressed: shouldCompress,
            compressedData: shouldCompress ? this.compressSync(data) : undefined,
            lastAccess: Date.now(),
            pinned,
            dirty: true,
        };
        
        this.cache.set(id, entry);
        
        if (shouldCompress) {
            this.stats.compressions++;
        }
    }
    
    /**
     * 获取数据
     */
    async get(id: string): Promise<ImageData | Uint8ClampedArray | null> {
        const entry = this.cache.get(id);
        
        if (entry) {
            this.stats.hits++;
            
            if (entry.compressed && entry.compressedData) {
                // 解压
                entry.data = await this.decompressAsync(entry.compressedData);
                entry.compressed = false;
                entry.compressedData = undefined;
                this.stats.decompressions++;
            }
            
            return entry.data;
        }
        
        this.stats.misses++;
        
        // 从数据库加载
        if (this.config.enablePersistence && this.db) {
            const dbData = await this.loadFromDatabase(id);
            if (dbData) {
                this.store(id, dbData);
                this.stats.reads++;
                return dbData;
            }
        }
        
        return null;
    }
    
    /**
     * 检查是否存在
     */
    has(id: string): boolean {
        return this.cache.has(id);
    }
    
    /**
     * 删除数据
     */
    async delete(id: string): Promise<boolean> {
        const deleted = this.cache.delete(id);
        
        if (this.config.enablePersistence && this.db) {
            await this.deleteFromDatabase(id);
        }
        
        return deleted;
    }
    
    /**
     * 固定数据（不会被淘汰）
     */
    pin(id: string): boolean {
        const entry = this.cache.get(id);
        if (entry) {
            entry.pinned = true;
            return true;
        }
        return false;
    }
    
    /**
     * 取消固定
     */
    unpin(id: string): boolean {
        const entry = this.cache.get(id);
        if (entry) {
            entry.pinned = false;
            return true;
        }
        return false;
    }
    
    /**
     * 标记为脏
     */
    markDirty(id: string): void {
        const entry = this.cache.get(id);
        if (entry) {
            entry.dirty = true;
        }
    }
    
    // ==================== 压缩 ====================
    
    /**
     * 同步压缩（简单 RLE）
     */
    private compressSync(data: ImageData | Uint8ClampedArray): ArrayBuffer {
        const raw = data instanceof ImageData ? data.data : data;
        
        // 简单实现：使用 PNG 风格的压缩
        // 实际应该使用更高效的算法或 Web Worker
        const compressed = this.rleEncode(raw);
        
        return compressed.buffer;
    }
    
    /**
     * 异步解压
     */
    private async decompressAsync(buffer: ArrayBuffer): Promise<Uint8ClampedArray> {
        // 如果有 Worker，使用 Worker
        if (this.compressionWorker) {
            return this.decompressInWorker(buffer);
        }
        
        // 否则同步解压
        const decoded = this.rleDecode(new Uint8Array(buffer));
        return new Uint8ClampedArray(decoded);
    }
    
    /**
     * RLE 编码
     */
    private rleEncode(data: Uint8ClampedArray): Uint8Array {
        const result: number[] = [];
        let i = 0;
        
        while (i < data.length) {
            const value = data[i];
            let count = 1;
            
            // 计算连续相同值的数量
            while (i + count < data.length && data[i + count] === value && count < 255) {
                count++;
            }
            
            result.push(count, value);
            i += count;
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * RLE 解码
     */
    private rleDecode(data: Uint8Array): Uint8Array {
        const result: number[] = [];
        
        for (let i = 0; i < data.length; i += 2) {
            const count = data[i];
            const value = data[i + 1];
            
            for (let j = 0; j < count; j++) {
                result.push(value);
            }
        }
        
        return new Uint8Array(result);
    }
    
    /**
     * Worker 解压
     */
    private decompressInWorker(buffer: ArrayBuffer): Promise<Uint8ClampedArray> {
        return new Promise((resolve, reject) => {
            if (!this.compressionWorker) {
                reject(new Error('Worker not available'));
                return;
            }
            
            const handleMessage = (event: MessageEvent) => {
                this.compressionWorker!.removeEventListener('message', handleMessage);
                resolve(new Uint8ClampedArray(event.data));
            };
            
            this.compressionWorker.addEventListener('message', handleMessage);
            this.compressionWorker.postMessage({ type: 'decompress', data: buffer }, [buffer]);
        });
    }
    
    // ==================== 持久化 ====================
    
    /**
     * 持久化条目到 IndexedDB
     */
    private async persistEntry(entry: CacheEntry<ImageData | Uint8ClampedArray>): Promise<void> {
        if (!this.db) return;
        
        const data = entry.compressed ? entry.compressedData : entry.data;
        if (!data) return;
        
        const serialized = entry.data instanceof ImageData
            ? { type: 'ImageData', width: entry.data.width, height: entry.data.height, data: Array.from(entry.data.data) }
            : { type: 'Uint8ClampedArray', data: Array.from(entry.data as Uint8ClampedArray) };
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['frames'], 'readwrite');
            const store = transaction.objectStore('frames');
            
            const request = store.put({
                id: entry.id,
                serialized,
                compressed: entry.compressed,
                lastAccess: entry.lastAccess,
            });
            
            request.onsuccess = () => {
                entry.dirty = false;
                this.stats.writes++;
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 从 IndexedDB 加载
     */
    private async loadFromDatabase(id: string): Promise<ImageData | Uint8ClampedArray | null> {
        if (!this.db) return null;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['frames'], 'readonly');
            const store = transaction.objectStore('frames');
            const request = store.get(id);
            
            request.onsuccess = () => {
                const result = request.result;
                if (!result) {
                    resolve(null);
                    return;
                }
                
                const { serialized } = result;
                
                if (serialized.type === 'ImageData') {
                    const data = new Uint8ClampedArray(serialized.data);
                    resolve(new ImageData(data, serialized.width, serialized.height));
                } else {
                    resolve(new Uint8ClampedArray(serialized.data));
                }
            };
            
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * 从数据库删除
     */
    private async deleteFromDatabase(id: string): Promise<void> {
        if (!this.db) return;
        
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(['frames'], 'readwrite');
            const store = transaction.objectStore('frames');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    // ==================== 内存监控 ====================
    
    private startMemoryMonitoring(): void {
        // 每 5 秒检查一次
        setInterval(() => {
            const usage = this.getMemoryUsage();
            const ratio = usage / this.config.maxMemory;
            
            if (ratio > 0.9) {
                this.onMemoryPressure?.('high');
                this.emergencyCleanup();
            } else if (ratio > 0.7) {
                this.onMemoryPressure?.('medium');
            } else if (ratio > 0.5) {
                this.onMemoryPressure?.('low');
            }
        }, 5000);
    }
    
    /**
     * 紧急清理
     */
    private emergencyCleanup(): void {
        // 压缩所有未压缩的条目
        for (const entry of this.cache.getAllEntries()) {
            if (!entry.compressed && entry.data && !entry.pinned) {
                entry.compressedData = this.compressSync(entry.data);
                entry.data = null;
                entry.compressed = true;
                this.stats.compressions++;
            }
        }
    }
    
    // ==================== 统计 ====================
    
    /**
     * 获取内存使用量
     */
    getMemoryUsage(): number {
        return this.cache.getMemoryUsage();
    }
    
    /**
     * 获取缓存大小
     */
    getCacheSize(): number {
        return this.cache.getSize();
    }
    
    /**
     * 获取统计信息
     */
    getStats(): typeof this.stats & { hitRate: number; memoryUsage: number } {
        const total = this.stats.hits + this.stats.misses;
        return {
            ...this.stats,
            hitRate: total > 0 ? this.stats.hits / total : 0,
            memoryUsage: this.getMemoryUsage(),
        };
    }
    
    // ==================== 辅助方法 ====================
    
    private calculateSize(data: ImageData | Uint8ClampedArray): number {
        if (data instanceof ImageData) {
            return data.data.byteLength;
        }
        return data.byteLength;
    }
    
    // ==================== 清理 ====================
    
    /**
     * 清除所有缓存
     */
    async clear(): Promise<void> {
        // 持久化脏数据
        if (this.config.enablePersistence) {
            for (const entry of this.cache.getAllEntries()) {
                if (entry.dirty) {
                    await this.persistEntry(entry);
                }
            }
        }
        
        this.cache.clear();
    }
    
    /**
     * 销毁
     */
    dispose(): void {
        this.clear();
        
        if (this.compressionWorker) {
            this.compressionWorker.terminate();
            this.compressionWorker = null;
        }
        
        if (this.db) {
            this.db.close();
            this.db = null;
        }
    }
}
