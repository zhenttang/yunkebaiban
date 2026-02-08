/**
 * 🔧 P1 优化：IndexedDB 离线操作存储
 * 
 * 替代 localStorage 的限制（500条/2MB），支持更大容量（5000条/50MB）
 * 自动回退到 localStorage 当 IndexedDB 不可用时
 */

import { DebugLogger } from '@yunke/debug';
import { batchMergeUpdates } from '../workers/merge-worker-client';

// 统一日志管理
const logger = new DebugLogger('yunke:offline-storage');

const DB_NAME = 'yunke_offline_storage';
const DB_VERSION = 1;
const STORE_NAME = 'offline_operations';

// 新的容量限制
export const MAX_OFFLINE_OPERATIONS_IDB = 5000;
export const MAX_OFFLINE_STORAGE_BYTES_IDB = 50 * 1024 * 1024; // 50MB

// 存储空间预警阈值
const STORAGE_WARNING_THRESHOLD = 0.7;  // 70% 触发警告（离线操作存储）
const STORAGE_CRITICAL_THRESHOLD = 0.9; // 90% 触发严重警告

// 存储空间状态
export interface OfflineStorageStatus {
  operationCount: number;
  maxOperations: number;
  estimatedBytes: number;
  maxBytes: number;
  percentUsed: number;
  isLow: boolean;
  isCritical: boolean;
}

export interface OfflineOperation {
  id: string;
  docId: string;
  update: string; // base64 encoded
  timestamp: number;
  spaceId: string;
  spaceType: string;
  sessionId: string;
  clientId?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;
let isIndexedDBAvailable = true;

/**
 * 🔧 P0 修复：重置数据库连接缓存
 * 当连接被浏览器关闭（移动端后台回收、存储压力等）时自动重连
 */
function resetDBConnection() {
  dbPromise = null;
  logger.warn('IndexedDB 连接已重置，将在下次操作时重新打开');
}

/**
 * 打开或创建 IndexedDB 数据库
 * 
 * 🔧 P0 修复：添加 onclose/onerror 监听器，连接断开时自动重置缓存
 * 确保后续操作能重新建立连接，而不是一直使用已关闭的连接
 */
function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      isIndexedDBAvailable = false;
      reject(new Error('IndexedDB not available'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      logger.error('IndexedDB 打开失败', request.error);
      isIndexedDBAvailable = false;
      dbPromise = null; // 🔧 P0 修复：打开失败时重置缓存，允许重试
      reject(request.error);
    };

    request.onsuccess = () => {
      const db = request.result;
      
      // 🔧 P0 修复：监控连接关闭事件
      // 移动端浏览器在内存压力下可能主动关闭 IndexedDB 连接
      db.onclose = () => {
        logger.warn('IndexedDB 连接被浏览器关闭');
        resetDBConnection();
      };
      
      // 🔧 P0 修复：监控连接错误
      db.onerror = (event) => {
        logger.error('IndexedDB 连接错误', (event.target as IDBDatabase)?.name);
        resetDBConnection();
      };
      
      // 🔧 P0 修复：监控版本变化（其他 tab 升级数据库时）
      db.onversionchange = () => {
        logger.warn('IndexedDB 版本变化，关闭当前连接');
        db.close();
        resetDBConnection();
      };
      
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // 创建离线操作存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('docId', 'docId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('spaceId', 'spaceId', { unique: false });
      }
    };
  });

  // 🔧 P0 修复：如果 Promise 被 reject，清除缓存以允许后续重试
  dbPromise.catch(() => {
    dbPromise = null;
  });

  return dbPromise;
}

// 保存计数器，用于触发周期性合并检查
let saveCounter = 0;
const AUTO_COMPACT_CHECK_INTERVAL = 20; // 每 20 次保存检查一次

/**
 * 保存离线操作到 IndexedDB
 */
export async function saveOfflineOperationIDB(operation: OfflineOperation): Promise<void> {
  if (!isIndexedDBAvailable) {
    throw new Error('IndexedDB not available');
  }

  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put(operation);
    
    request.onerror = () => {
      logger.error('保存操作失败', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve();
      
      // 🔧 P1 优化：周期性检查是否需要自动合并（不阻塞保存）
      saveCounter++;
      if (saveCounter >= AUTO_COMPACT_CHECK_INTERVAL) {
        saveCounter = 0;
        // 异步执行，不阻塞
        autoCompactIfNeeded().catch(() => {
          // 静默失败，不影响正常保存
        });
      }
    };
  });
}

/**
 * 获取所有离线操作
 */
export async function getOfflineOperationsIDB(): Promise<OfflineOperation[]> {
  if (!isIndexedDBAvailable) {
    return [];
  }

  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    const request = index.getAll();
    
    request.onerror = () => {
      logger.error('获取操作失败', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result || []);
    };
  });
}

/**
 * 获取离线操作数量
 */
export async function getOfflineOperationsCountIDB(): Promise<number> {
  if (!isIndexedDBAvailable) {
    return 0;
  }

  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.count();
    
    request.onerror = () => {
      logger.error('获取数量失败', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

/**
 * 删除指定的离线操作
 */
export async function deleteOfflineOperationIDB(id: string): Promise<void> {
  if (!isIndexedDBAvailable) {
    return;
  }

  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.delete(id);
    
    request.onerror = () => {
      logger.error('删除操作失败', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * 🔧 P1 优化：批量删除离线操作
 * 使用事务级别事件处理，而非逐个请求处理，提升性能
 */
export async function deleteOfflineOperationsIDB(ids: string[]): Promise<void> {
  if (!isIndexedDBAvailable || ids.length === 0) {
    return;
  }

  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // 使用事务级别事件，而非逐个请求事件（性能更好）
    transaction.oncomplete = () => {
      resolve();
    };
    
    transaction.onerror = () => {
      logger.error('批量删除事务失败', transaction.error);
      reject(transaction.error);
    };
    
    transaction.onabort = () => {
      logger.error('批量删除事务中止', transaction.error);
      reject(transaction.error || new Error('Transaction aborted'));
    };

    // 批量提交删除请求（事务会自动处理）
    for (const id of ids) {
      store.delete(id);
    }
  });
}

/**
 * 清空所有离线操作
 */
export async function clearOfflineOperationsIDB(): Promise<void> {
  if (!isIndexedDBAvailable) {
    return;
  }

  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.clear();
    
    request.onerror = () => {
      logger.error('清空操作失败', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve();
    };
  });
}

/**
 * 获取指定文档的离线操作数量
 */
export async function getDocOperationsCountIDB(docId: string): Promise<number> {
  if (!isIndexedDBAvailable) {
    return 0;
  }

  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('docId');
    
    const request = index.count(docId);
    
    request.onerror = () => {
      logger.error('获取文档操作数量失败', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
  });
}

/**
 * 删除指定文档的最旧操作
 */
export async function deleteOldestDocOperationIDB(docId: string): Promise<void> {
  if (!isIndexedDBAvailable) {
    return;
  }

  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('docId');
    
    const request = index.openCursor(docId);
    
    request.onerror = () => {
      logger.error('删除最旧操作失败', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        resolve();
      } else {
        resolve();
      }
    };
  });
}

/**
 * 修剪超出限制的操作（删除最旧的）
 */
export async function trimOfflineOperationsIDB(): Promise<number> {
  if (!isIndexedDBAvailable) {
    return 0;
  }

  const count = await getOfflineOperationsCountIDB();
  
  if (count <= MAX_OFFLINE_OPERATIONS_IDB) {
    return 0;
  }

  const toDelete = count - MAX_OFFLINE_OPERATIONS_IDB;
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    
    let deleted = 0;
    const request = index.openCursor();
    
    request.onerror = () => {
      logger.error('修剪操作失败', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && deleted < toDelete) {
        cursor.delete();
        deleted++;
        cursor.continue();
      } else {
        logger.warn(`已修剪 ${deleted} 条旧操作`);
        resolve(deleted);
      }
    };
  });
}

/**
 * 从 localStorage 迁移数据到 IndexedDB
 */
export async function migrateFromLocalStorage(
  localStorageKey: string,
  safeStorage: { getItem: (key: string) => string | null; removeItem: (key: string) => void }
): Promise<number> {
  if (!isIndexedDBAvailable) {
    return 0;
  }

  try {
    const existing = safeStorage.getItem(localStorageKey);
    if (!existing) {
      return 0;
    }

    // 🔧 P1 优化：JSON 解析安全增强
    let operations: OfflineOperation[];
    try {
      const parsed = JSON.parse(existing);
      if (!Array.isArray(parsed)) {
        logger.warn('迁移数据格式错误，预期数组', { type: typeof parsed });
        return 0;
      }
      operations = parsed;
    } catch (parseError) {
      logger.error('迁移数据 JSON 解析失败', parseError);
      safeStorage.removeItem(localStorageKey);
      return 0;
    }
    
    if (operations.length === 0) {
      return 0;
    }

    logger.info(`开始迁移 ${operations.length} 条操作到 IndexedDB...`);

    const db = await openDB();
    
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      let completed = 0;
      let hasError = false;

      operations.forEach(op => {
        const request = store.put(op);
        
        request.onerror = () => {
          if (!hasError) {
            hasError = true;
            reject(request.error);
          }
        };
        
        request.onsuccess = () => {
          completed++;
          if (completed === operations.length && !hasError) {
            resolve();
          }
        };
      });
    });

    // 迁移成功后，清除 localStorage
    safeStorage.removeItem(localStorageKey);
    logger.info('迁移完成，已清除 localStorage');

    return operations.length;
  } catch (error) {
    logger.error('迁移失败', error);
    return 0;
  }
}

/**
 * 检查 IndexedDB 是否可用
 */
export function isIndexedDBStorageAvailable(): boolean {
  return isIndexedDBAvailable;
}

/**
 * 初始化离线存储（检查可用性）
 */
export async function initOfflineStorage(): Promise<boolean> {
  try {
    await openDB();
    logger.info('IndexedDB 初始化成功');
    return true;
  } catch (error) {
    logger.warn('IndexedDB 不可用，将使用 localStorage', error);
    isIndexedDBAvailable = false;
    return false;
  }
}

/**
 * 🔧 P0 优化：获取离线存储状态
 * 
 * 🔧 P1 修复：使用 cursor 遍历估算大小，而不是加载全部数据到内存
 * 对于 5000 条/50MB 的数据量，旧实现会造成严重的内存峰值
 */
export async function getOfflineStorageStatus(): Promise<OfflineStorageStatus> {
  if (!isIndexedDBAvailable) {
    return {
      operationCount: 0,
      maxOperations: MAX_OFFLINE_OPERATIONS_IDB,
      estimatedBytes: 0,
      maxBytes: MAX_OFFLINE_STORAGE_BYTES_IDB,
      percentUsed: 0,
      isLow: false,
      isCritical: false,
    };
  }
  
  try {
    const db = await openDB();
    
    const { count, estimatedBytes } = await new Promise<{ count: number; estimatedBytes: number }>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      
      let count = 0;
      let estimatedBytes = 0;
      
      // 使用 cursor 遍历，只读取需要的字段长度，不加载整个对象到内存
      const request = store.openCursor();
      
      request.onerror = () => {
        reject(request.error);
      };
      
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          count++;
          const op = cursor.value as OfflineOperation;
          // 估算大小：update 的 base64 长度 + 元数据开销
          estimatedBytes += (op.update?.length ?? 0) + (op.docId?.length ?? 0) + (op.spaceId?.length ?? 0) + 100;
          cursor.continue();
        } else {
          resolve({ count, estimatedBytes });
        }
      };
    });
    
    const percentByCount = count / MAX_OFFLINE_OPERATIONS_IDB;
    const percentByBytes = estimatedBytes / MAX_OFFLINE_STORAGE_BYTES_IDB;
    const percentUsed = Math.max(percentByCount, percentByBytes);
    
    return {
      operationCount: count,
      maxOperations: MAX_OFFLINE_OPERATIONS_IDB,
      estimatedBytes,
      maxBytes: MAX_OFFLINE_STORAGE_BYTES_IDB,
      percentUsed,
      isLow: percentUsed >= STORAGE_WARNING_THRESHOLD,
      isCritical: percentUsed >= STORAGE_CRITICAL_THRESHOLD,
    };
  } catch (error) {
    logger.warn('获取存储状态失败，使用保守估算', error);
    const operationCount = await getOfflineOperationsCountIDB().catch(() => 0);
    const estimatedBytes = operationCount * 2000; // 保守估算每条 2KB
    const percentByCount = operationCount / MAX_OFFLINE_OPERATIONS_IDB;
    const percentByBytes = estimatedBytes / MAX_OFFLINE_STORAGE_BYTES_IDB;
    const percentUsed = Math.max(percentByCount, percentByBytes);
    
    return {
      operationCount,
      maxOperations: MAX_OFFLINE_OPERATIONS_IDB,
      estimatedBytes,
      maxBytes: MAX_OFFLINE_STORAGE_BYTES_IDB,
      percentUsed,
      isLow: percentUsed >= STORAGE_WARNING_THRESHOLD,
      isCritical: percentUsed >= STORAGE_CRITICAL_THRESHOLD,
    };
  }
}

/**
 * 🔧 P0 优化：检查并发送离线存储空间预警
 */
export async function checkAndWarnOfflineStorage(): Promise<OfflineStorageStatus | null> {
  if (!isIndexedDBAvailable) {
    return null;
  }
  
  try {
    const status = await getOfflineStorageStatus();
    
    const usedKB = (status.estimatedBytes / 1024).toFixed(1);
    const maxMB = (status.maxBytes / (1024 * 1024)).toFixed(1);
    const percentStr = (status.percentUsed * 100).toFixed(1);
    
    if (status.isCritical) {
      logger.error(`离线存储空间严重不足！已使用 ${status.operationCount}/${status.maxOperations} 条操作, ${usedKB}KB/${maxMB}MB (${percentStr}%)`);
      // 发送全局事件通知
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('yunke-storage-error', {
          detail: {
            type: 'offline-overflow',
            message: `离线存储空间严重不足，可能导致新的编辑无法保存。请尽快连接网络同步数据。`,
            details: status,
          }
        }));
      }
    } else if (status.isLow) {
      logger.warn(`离线存储空间不足，已使用 ${status.operationCount}/${status.maxOperations} 条操作 (${percentStr}%)`);
    }
    
    return status;
  } catch (error) {
    logger.error('检查存储状态失败', error);
    return null;
  }
}

/**
 * 🔧 P1 优化：合并离线操作，减少存储占用
 * 
 * 将同一文档的多个更新操作合并为一个，显著减少存储空间
 * 
 * @returns 合并统计信息
 */
export async function compactOfflineOperationsIDB(): Promise<{
  success: boolean;
  originalCount: number;
  compactedCount: number;
  savedCount: number;
  savedBytes: number;
  error?: string;
}> {
  if (!isIndexedDBAvailable) {
    return {
      success: false,
      originalCount: 0,
      compactedCount: 0,
      savedCount: 0,
      savedBytes: 0,
      error: 'IndexedDB not available',
    };
  }

  const startTime = performance.now();
  
  try {
    // 1. 获取所有离线操作
    const operations = await getOfflineOperationsIDB();
    const originalCount = operations.length;
    
    if (originalCount <= 1) {
      logger.debug('无需合并：操作数量不足');
      return {
        success: true,
        originalCount,
        compactedCount: originalCount,
        savedCount: 0,
        savedBytes: 0,
      };
    }

    // 2. 按 docId + spaceId 分组
    const groupKey = (op: OfflineOperation) => `${op.spaceId}:${op.docId}`;
    const groups = new Map<string, OfflineOperation[]>();
    
    for (const op of operations) {
      const key = groupKey(op);
      const group = groups.get(key) || [];
      group.push(op);
      groups.set(key, group);
    }

    // 3. 找出需要合并的组（有多个操作的文档）
    const toMerge: Array<{ key: string; ops: OfflineOperation[] }> = [];
    const toKeep: OfflineOperation[] = [];
    
    for (const [key, ops] of groups) {
      if (ops.length > 1) {
        // 按时间戳排序
        ops.sort((a, b) => a.timestamp - b.timestamp);
        toMerge.push({ key, ops });
      } else {
        toKeep.push(ops[0]);
      }
    }

    if (toMerge.length === 0) {
      logger.debug('无需合并：没有可合并的操作组');
      return {
        success: true,
        originalCount,
        compactedCount: originalCount,
        savedCount: 0,
        savedBytes: 0,
      };
    }

    // 4. 批量合并更新
    const mergeInput = toMerge.map(({ key, ops }) => ({
      docId: key,
      updates: ops.map(op => op.update),
    }));

    const mergeResults = await batchMergeUpdates(mergeInput);

    // 5. 构建合并后的操作
    const mergedOps: OfflineOperation[] = [];
    const idsToDelete: string[] = [];
    let savedBytes = 0;

    for (let i = 0; i < toMerge.length; i++) {
      const { ops } = toMerge[i];
      const result = mergeResults[i];

      if (result.error) {
        // 合并失败，保留原操作
        logger.warn(`合并失败 (${result.docId})`, result.error);
        mergedOps.push(...ops);
        continue;
      }

      // 计算节省的空间
      const originalSize = ops.reduce((sum, op) => sum + op.update.length, 0);
      const mergedSize = result.merged.length;
      savedBytes += originalSize - mergedSize;

      // 标记要删除的旧操作
      idsToDelete.push(...ops.map(op => op.id));

      // 创建合并后的新操作（使用最新的元信息）
      const latestOp = ops[ops.length - 1];
      mergedOps.push({
        id: `merged_${latestOp.spaceId}_${latestOp.docId}_${Date.now()}`,
        docId: latestOp.docId,
        spaceId: latestOp.spaceId,
        spaceType: latestOp.spaceType,
        sessionId: latestOp.sessionId,
        clientId: latestOp.clientId,
        update: result.merged,
        timestamp: latestOp.timestamp,
      });
    }

    // 6. 🔧 P0 修复：在同一个事务中删除旧操作并保存新操作
    // 确保原子性 —— 要么全部成功，要么全部回滚，不会出现"删了旧数据但没存新数据"的情况
    if (idsToDelete.length > 0 || mergedOps.length > 0) {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => {
          logger.error('合并事务失败', transaction.error);
          reject(transaction.error);
        };
        transaction.onabort = () => {
          logger.error('合并事务被中止', transaction.error);
          reject(transaction.error || new Error('Compact transaction aborted'));
        };
        
        // 先删除旧操作
        for (const id of idsToDelete) {
          store.delete(id);
        }
        // 再保存合并后的新操作
        for (const op of mergedOps) {
          store.put(op);
        }
      });
    }

    const compactedCount = toKeep.length + mergedOps.length;
    const savedCount = originalCount - compactedCount;
    const elapsed = performance.now() - startTime;

    logger.info(`合并完成: ${originalCount} -> ${compactedCount} 条操作, 节省 ${savedCount} 条, ${(savedBytes / 1024).toFixed(1)}KB, 耗时 ${elapsed.toFixed(0)}ms`);

    return {
      success: true,
      originalCount,
      compactedCount,
      savedCount,
      savedBytes,
    };
  } catch (error) {
    logger.error('合并操作失败', error);
    return {
      success: false,
      originalCount: 0,
      compactedCount: 0,
      savedCount: 0,
      savedBytes: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 🔧 P1 优化：自动合并策略
 * 
 * 当离线操作数量超过阈值时自动触发合并
 */
const AUTO_COMPACT_THRESHOLD = 100; // 超过 100 条操作时自动合并
let lastCompactTime = 0;
const COMPACT_COOLDOWN = 60000; // 合并冷却时间 60 秒
let isCompacting = false; // 防止并发合并

export async function autoCompactIfNeeded(): Promise<boolean> {
  if (!isIndexedDBAvailable) {
    return false;
  }

  // 防止并发合并
  if (isCompacting) {
    return false;
  }

  // 检查冷却时间
  const now = Date.now();
  if (now - lastCompactTime < COMPACT_COOLDOWN) {
    return false;
  }

  try {
    const count = await getOfflineOperationsCountIDB();
    
    if (count >= AUTO_COMPACT_THRESHOLD) {
      logger.info(`触发自动合并: ${count} 条操作超过阈值 ${AUTO_COMPACT_THRESHOLD}`);
      isCompacting = true;
      lastCompactTime = now;
      
      try {
        const result = await compactOfflineOperationsIDB();
        return result.success && result.savedCount > 0;
      } finally {
        isCompacting = false;
      }
    }
    
    return false;
  } catch (error) {
    logger.warn('自动合并检查失败', error);
    isCompacting = false;
    return false;
  }
}
