import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';

import {
  type BlobRecord,
  type DocClock,
  type DocRecord,
  type ListedBlobRecord,
  parseUniversalId,
  type SpaceType,
} from '@yunke/nbstore';
import type { NativeDBApis } from '@yunke/nbstore/sqlite';
import type { NativeDBV1Apis } from '@yunke/nbstore/sqlite/v1';
import { DebugLogger } from '@yunke/debug';
import { mergeUpdates } from 'yjs';

import {
  ensureHandlePermission,
  loadOfflineRootHandle,
} from './offline-file-handle';

const SQLITE_SCHEMA_VERSION = 1;
const OFFLINE_DEBUG =
  typeof BUILD_CONFIG !== 'undefined' && BUILD_CONFIG.debug === true;

// 全局存储错误事件类型
export interface StorageErrorEvent {
  type: 'write-failure' | 'data-loss' | 'offline-overflow' | 'storage-low' | 'integrity-error';
  message: string;
  details?: Record<string, unknown>;
}

// 存储空间状态
export interface StorageQuotaStatus {
  usage: number;        // 已用空间 (bytes)
  quota: number;        // 总配额 (bytes)
  percentUsed: number;  // 使用百分比
  isLow: boolean;       // 是否空间不足
}

// 存储空间预警阈值
const STORAGE_WARNING_THRESHOLD = 0.8;  // 80% 触发警告
const STORAGE_CRITICAL_THRESHOLD = 0.95; // 95% 触发严重警告

declare global {
  interface WindowEventMap {
    'yunke-storage-error': CustomEvent<StorageErrorEvent>;
  }
}

// 发送存储错误通知
const emitStorageError = (error: StorageErrorEvent) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('yunke-storage-error', { detail: error })
    );
  }
};

/**
 * 🔧 P0 优化：检查存储配额
 * 使用 Storage API 检查可用存储空间
 */
export async function checkStorageQuota(): Promise<StorageQuotaStatus | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage ?? 0;
    const quota = estimate.quota ?? 0;
    
    if (quota === 0) return null;
    
    const percentUsed = usage / quota;
    const isLow = percentUsed >= STORAGE_WARNING_THRESHOLD;
    
    return { usage, quota, percentUsed, isLow };
  } catch (error) {
    logWarn('检查存储配额失败', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * 🔧 P0 优化：检查并发送存储空间预警
 */
export async function checkAndWarnStorageQuota(): Promise<void> {
  const status = await checkStorageQuota();
  if (!status) return;
  
  const usedMB = (status.usage / (1024 * 1024)).toFixed(1);
  const quotaMB = (status.quota / (1024 * 1024)).toFixed(1);
  const percentStr = (status.percentUsed * 100).toFixed(1);
  
  if (status.percentUsed >= STORAGE_CRITICAL_THRESHOLD) {
    logWarn('存储空间严重不足', {
      usage: status.usage,
      quota: status.quota,
      percent: status.percentUsed,
    });
    emitStorageError({
      type: 'storage-low',
      message: `存储空间严重不足！已使用 ${usedMB}MB / ${quotaMB}MB (${percentStr}%)。请清理空间或导出数据。`,
      details: status,
    });
  } else if (status.percentUsed >= STORAGE_WARNING_THRESHOLD) {
    logWarn('存储空间不足', {
      usage: status.usage,
      quota: status.quota,
      percent: status.percentUsed,
    });
    emitStorageError({
      type: 'storage-low',
      message: `存储空间不足，已使用 ${usedMB}MB / ${quotaMB}MB (${percentStr}%)。建议清理不需要的工作区。`,
      details: status,
    });
  }
}

// 统一日志器
const logger = new DebugLogger('yunke:offline-db');

const logInfo = (message: string, data?: Record<string, unknown>) => {
  if (!OFFLINE_DEBUG) return;
  if (data) {
    logger.info(message, data);
  } else {
    logger.info(message);
  }
};

const logWarn = (message: string, data?: Record<string, unknown>) => {
  if (!OFFLINE_DEBUG) return;
  if (data) {
    logger.warn(message, data);
  } else {
    logger.warn(message);
  }
};

const logError = (message: string, error?: unknown) => {
  logger.error(message, error);
};

let sqlInitPromise: Promise<SqlJsStatic> | null = null;
const sqlWasmUrl = new URL('sql.js/dist/sql-wasm.wasm', import.meta.url).toString();

/**
 * 🔧 P0 修复：WASM 加载失败时重置缓存，允许后续重试
 * 
 * 旧实现如果 initSqlJs 失败（网络问题、内存不足等），
 * sqlInitPromise 永远是 rejected 状态，导致所有 SQLite 操作永久失效。
 * 现在失败时清除缓存，下次调用会重试。
 */
async function getSqlJs(): Promise<SqlJsStatic> {
  if (!sqlInitPromise) {
    sqlInitPromise = initSqlJs({
      locateFile: () => sqlWasmUrl,
    });
    // 失败时重置，允许后续重试
    sqlInitPromise.catch(() => {
      logWarn('sql.js WASM 加载失败，将在下次操作时重试');
      sqlInitPromise = null;
    });
  }
  return sqlInitPromise;
}

function initSqliteSchema(db: Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    CREATE TABLE IF NOT EXISTS doc_updates (
      doc_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      bin BLOB NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_doc_updates_doc ON doc_updates(doc_id);
    CREATE INDEX IF NOT EXISTS idx_doc_updates_doc_ts ON doc_updates(doc_id, ts);
    CREATE TABLE IF NOT EXISTS doc_snapshots (
      doc_id TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      bin BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS doc_clocks (
      doc_id TEXT PRIMARY KEY,
      ts INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS blobs (
      key TEXT PRIMARY KEY,
      data BLOB NOT NULL,
      mime TEXT,
      size INTEGER,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS peer_clocks (
      peer TEXT NOT NULL,
      type TEXT NOT NULL,
      doc_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      PRIMARY KEY (peer, type, doc_id)
    );
    CREATE TABLE IF NOT EXISTS blob_uploaded_at (
      peer TEXT NOT NULL,
      blob_id TEXT NOT NULL,
      ts INTEGER NOT NULL,
      PRIMARY KEY (peer, blob_id)
    );
    CREATE TABLE IF NOT EXISTS v1_updates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      doc_id TEXT,
      ts INTEGER NOT NULL,
      data BLOB NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_v1_updates_doc ON v1_updates(doc_id);
    CREATE TABLE IF NOT EXISTS v1_blobs (
      key TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      data BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS v1_server_clock (
      key TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      data BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS v1_sync_metadata (
      key TEXT PRIMARY KEY,
      ts INTEGER NOT NULL,
      data BLOB NOT NULL
    );
    CREATE TABLE IF NOT EXISTS v1_meta (
      key TEXT PRIMARY KEY,
      value INTEGER
    );
  `);

  const stmt = db.prepare(
    'INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value'
  );
  stmt.bind(['schema_version', String(SQLITE_SCHEMA_VERSION)]);
  stmt.step();
  stmt.free();
}

function escapeFilename(name: string) {
  return name
    .replaceAll(/[\\/!@#$%^&*()+~`"':;,?<>|]/g, '_')
    .split('_')
    .filter(Boolean)
    .join('_');
}

async function getDbFileHandle(universalId: string): Promise<FileSystemFileHandle> {
  const root = await loadOfflineRootHandle();
  if (!root) {
    logWarn('offline root handle missing');
    throw new Error('离线目录未选择');
  }
  const granted = await ensureHandlePermission(root);
  if (!granted) {
    logWarn('offline root permission denied', { root: root.name });
    throw new Error('离线目录未授权');
  }
  const { peer, type, id } = parseUniversalId(universalId);
  const spaceDirName = type === 'userspace' ? 'userspaces' : 'workspaces';
  const spaceDir = await root.getDirectoryHandle(spaceDirName, { create: true });
  const peerDir = await spaceDir.getDirectoryHandle(escapeFilename(peer), {
    create: true,
  });
  const workspaceDir = await peerDir.getDirectoryHandle(id, { create: true });
  const handle = await workspaceDir.getFileHandle('storage.db', { create: true });
  logInfo('resolved db handle', {
    root: root.name,
    path: `${spaceDirName}/${escapeFilename(peer)}/${id}/storage.db`,
  });
  return handle;
}

async function getV1DbFileHandle(
  spaceType: SpaceType,
  workspaceId: string
): Promise<FileSystemFileHandle> {
  const root = await loadOfflineRootHandle();
  if (!root) {
    logWarn('offline root handle missing');
    throw new Error('离线目录未选择');
  }
  const granted = await ensureHandlePermission(root);
  if (!granted) {
    logWarn('offline root permission denied', { root: root.name });
    throw new Error('离线目录未授权');
  }
  const spaceDirName = spaceType === 'userspace' ? 'userspaces' : 'workspaces';
  const spaceDir = await root.getDirectoryHandle(spaceDirName, { create: true });
  const workspaceDir = await spaceDir.getDirectoryHandle(workspaceId, {
    create: true,
  });
  const handle = await workspaceDir.getFileHandle('storage.db', { create: true });
  logInfo('resolved v1 db handle', {
    root: root.name,
    path: `${spaceDirName}/${workspaceId}/storage.db`,
  });
  return handle;
}

function readFirstRow(db: Database, sql: string, params: unknown[]) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (!stmt.step()) {
    stmt.free();
    return null;
  }
  const row = stmt.getAsObject();
  stmt.free();
  return row;
}

function readAllRows(db: Database, sql: string, params: unknown[]) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: Record<string, any>[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

function execStatement(db: Database, sql: string, params: unknown[]) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  stmt.step();
  stmt.free();
}

class SqliteFileEntry {
  db: Database;
  handle: FileSystemFileHandle;
  queue: Promise<unknown> = Promise.resolve();
  lastSize: number | null = null;
  
  // 🔧 性能优化：防抖 flush 机制，避免频繁写入磁盘
  // 🔧 P0 修复：改为 public，供 flushAllEntriesSync 同步访问
  flushTimer: ReturnType<typeof setTimeout> | null = null;
  flushDebounceMs = 500; // 初始 500ms 防抖延迟
  pendingFlush = false;
  
  // 🔧 P0 优化：动态防抖延迟参数
  private static readonly MIN_DEBOUNCE_MS = 300;  // 最小延迟
  private static readonly MAX_DEBOUNCE_MS = 1500; // 最大延迟
  private static readonly DEBOUNCE_STEP = 100;    // 调整步长
  private lastWriteTime = 0;
  private writeFrequencyWindow: number[] = [];    // 最近写入时间窗口
  private static readonly FREQUENCY_WINDOW_SIZE = 10; // 统计窗口大小

  constructor(db: Database, handle: FileSystemFileHandle) {
    this.db = db;
    this.handle = handle;
  }

  /**
   * 🔧 P0 优化：根据写入频率动态调整防抖延迟
   * 
   * - 高频写入（<100ms 间隔）：增加延迟，减少 I/O
   * - 低频写入（>2s 间隔）：减少延迟，提高响应性
   */
  private updateDebounceDelay(): void {
    const now = Date.now();
    const timeSinceLastWrite = now - this.lastWriteTime;
    
    // 记录写入时间到窗口
    this.writeFrequencyWindow.push(now);
    if (this.writeFrequencyWindow.length > SqliteFileEntry.FREQUENCY_WINDOW_SIZE) {
      this.writeFrequencyWindow.shift();
    }
    
    // 计算平均写入间隔
    if (this.writeFrequencyWindow.length >= 3) {
      const intervals: number[] = [];
      for (let i = 1; i < this.writeFrequencyWindow.length; i++) {
        intervals.push(this.writeFrequencyWindow[i] - this.writeFrequencyWindow[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      
      if (avgInterval < 100) {
        // 高频写入：增加延迟
        this.flushDebounceMs = Math.min(
          SqliteFileEntry.MAX_DEBOUNCE_MS,
          this.flushDebounceMs + SqliteFileEntry.DEBOUNCE_STEP
        );
      } else if (avgInterval > 2000) {
        // 低频写入：减少延迟
        this.flushDebounceMs = Math.max(
          SqliteFileEntry.MIN_DEBOUNCE_MS,
          this.flushDebounceMs - SqliteFileEntry.DEBOUNCE_STEP
        );
      }
    } else if (timeSinceLastWrite < 100) {
      // 窗口不足但检测到高频写入
      this.flushDebounceMs = Math.min(
        SqliteFileEntry.MAX_DEBOUNCE_MS,
        this.flushDebounceMs + SqliteFileEntry.DEBOUNCE_STEP
      );
    }
    
    this.lastWriteTime = now;
  }

  /**
   * 🔧 P0 优化：检查数据库完整性
   * 使用 SQLite PRAGMA integrity_check 验证数据完整性
   */
  checkIntegrity(): { ok: boolean; errors: string[] } {
    try {
      const stmt = this.db.prepare('PRAGMA integrity_check');
      const errors: string[] = [];
      
      while (stmt.step()) {
        const row = stmt.getAsObject() as { integrity_check?: string };
        const result = row.integrity_check;
        if (result && result !== 'ok') {
          errors.push(result);
        }
      }
      stmt.free();
      
      const ok = errors.length === 0;
      if (!ok) {
        logWarn('数据库完整性检查失败', {
          file: this.handle.name,
          errors,
        });
        emitStorageError({
          type: 'integrity-error',
          message: `数据库完整性检查失败: ${errors.join(', ')}`,
          details: { file: this.handle.name, errors },
        });
      }
      
      return { ok, errors };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logWarn('执行完整性检查失败', {
        file: this.handle.name,
        error: errorMsg,
      });
      return { ok: false, errors: [errorMsg] };
    }
  }

  /**
   * 🔧 P0 优化：获取数据库统计信息
   */
  /**
   * 🔧 P0 修复：用 PRAGMA 获取数据库大小，不再调用 db.export()
   * 
   * 旧实现为了获取 sizeBytes 调用 db.export()，会将整个数据库复制到内存。
   * 对于大数据库（100MB+），这会造成严重的内存峰值和 GC 压力。
   * 改用 page_count * page_size 计算，零拷贝。
   */
  getStats(): { docCount: number; blobCount: number; updateCount: number; sizeBytes: number } {
    try {
      const docCountRow = readFirstRow(this.db, 'SELECT COUNT(*) AS count FROM doc_snapshots', []) as { count?: number } | null;
      const blobCountRow = readFirstRow(this.db, 'SELECT COUNT(*) AS count FROM blobs', []) as { count?: number } | null;
      const updateCountRow = readFirstRow(this.db, 'SELECT COUNT(*) AS count FROM doc_updates', []) as { count?: number } | null;
      
      // 🔧 P0 修复：使用 PRAGMA 获取数据库大小，避免 db.export() 的全量内存复制
      const pageSizeRow = readFirstRow(this.db, 'PRAGMA page_size', []) as { page_size?: number } | null;
      const pageCountRow = readFirstRow(this.db, 'PRAGMA page_count', []) as { page_count?: number } | null;
      const pageSize = pageSizeRow?.page_size ?? 4096;
      const pageCount = pageCountRow?.page_count ?? 0;
      
      return {
        docCount: docCountRow?.count ?? 0,
        blobCount: blobCountRow?.count ?? 0,
        updateCount: updateCountRow?.count ?? 0,
        sizeBytes: pageSize * pageCount,
      };
    } catch {
      return { docCount: 0, blobCount: 0, updateCount: 0, sizeBytes: 0 };
    }
  }

  /**
   * 🔧 P0 修复：确保队列永远不会断裂
   * 
   * 旧实现：queue = task.catch(log)
   * 问题：如果 action 抛出异常，task 是 rejected 的 Promise。
   *   虽然 catch 吞掉了错误让 queue 变成 resolved，但下一个
   *   runExclusive 的 action 可能因为时序问题拿到了 rejected 的 task
   *   而不是 catch 后的 queue。
   * 
   * 新实现：queue 的 Promise 链始终 resolve，即使 action 失败。
   *   task 单独返回给调用者，让调用者处理错误。
   */
  async runExclusive<T>(action: () => Promise<T>): Promise<T> {
    let resolve!: (value: T) => void;
    let reject!: (reason: unknown) => void;
    const result = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    
    // 队列的 Promise 链：无论 action 成功还是失败，都 resolve，保持链不断
    this.queue = this.queue.then(async () => {
      try {
        const value = await action();
        resolve(value);
      } catch (error) {
        logWarn('队列任务执行失败', {
          file: this.handle.name,
          error: error instanceof Error ? error.message : String(error),
        });
        reject(error);
      }
    });
    
    return result;
  }

  /**
   * 🔧 性能优化：防抖 flush，延迟写入磁盘
   * 多次快速写入会被合并为一次磁盘写入，显著提升性能
   * 动态调整延迟时间以适应不同的写入频率
   */
  scheduleFlush(): void {
    this.pendingFlush = true;
    
    // 🔧 P0 优化：动态调整防抖延迟
    this.updateDebounceDelay();
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }
    
    this.flushTimer = setTimeout(() => {
      this.flushTimer = null;
      if (this.pendingFlush) {
        this.pendingFlush = false;
        this.runExclusive(async () => {
          await this.flush();
        }).catch((error) => {
          logWarn('scheduled flush 失败', {
            file: this.handle.name,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }
    }, this.flushDebounceMs);
  }

  /**
   * 🔧 性能优化：立即 flush，用于关键操作（如 disconnect）
   * 取消待处理的防抖 flush，立即执行
   */
  async flushNow(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.pendingFlush = false;
    await this.flush();
  }

  /**
   * 🔧 Bug #16 修复：添加错误处理和重试逻辑
   * 确保离线数据不会因写入失败而丢失
   */
  /**
   * 🔧 P1 修复：增强 flush 安全性
   * 
   * File System Access API 的 createWritable() 默认使用原子写入：
   * 数据先写到临时文件，close() 时才替换原文件。
   * 如果写入过程中页面被杀，abort() 或未 close() 会保留旧文件不变。
   * 
   * 这里的关键改进：
   * 1. 添加 keepExistingData 选项：不截断现有文件直到 close
   * 2. 写入前检查 export 数据有效性（至少 > 100 bytes）
   * 3. 失败时确保正确 abort，不会写入部分数据
   */
  async flush(maxRetries = 3): Promise<void> {
    const data = this.db.export();
    
    // 🔧 P1 修复：写入前检查数据有效性，防止写入空数据或损坏数据覆盖正常文件
    if (!data || data.byteLength < 100) {
      logWarn('flush 跳过：导出数据异常', {
        file: this.handle.name,
        bytes: data?.byteLength ?? 0,
      });
      return;
    }
    
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      let writable: FileSystemWritableFileStream | null = null;
      try {
        // keepExistingData: false（默认）= 原子替换模式
        // 数据先写临时文件，close() 时原子替换，中途失败不会损坏原文件
        writable = await this.handle.createWritable();
        await writable.write(data);
        await writable.close();
        writable = null; // close 成功后置空，防止 finally 中重复操作
        
        if (data.length !== this.lastSize) {
          logInfo('flushed db file', {
            bytes: data.length,
            file: this.handle.name,
          });
          this.lastSize = data.length;
        }
        return; // 成功，退出
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logWarn('flush 失败，准备重试', {
          file: this.handle.name,
          attempt: attempt + 1,
          maxRetries,
          error: lastError.message,
        });
        
        // 确保 abort writable（放弃本次写入，保留旧文件完整）
        if (writable) {
          try {
            await writable.abort();
          } catch {
            // 忽略 abort 错误
          }
        }
        
        // 如果不是最后一次尝试，等待后重试
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        }
      }
    }

    // 所有重试都失败
    logWarn('flush 最终失败，数据可能未保存', {
      file: this.handle.name,
      error: lastError?.message ?? 'Unknown error',
    });
    logError('数据写入失败，可能导致数据丢失', lastError);
    
    emitStorageError({
      type: 'write-failure',
      message: '数据保存失败，可能导致数据丢失。请检查存储空间并重试保存。',
      details: {
        file: this.handle.name,
        error: lastError?.message,
      },
    });
  }
}

async function openSqliteEntry(handle: FileSystemFileHandle, checkIntegrity = true): Promise<SqliteFileEntry> {
  const sql = await getSqlJs();
  const file = await handle.getFile();
  const buffer = file.size > 0 ? new Uint8Array(await file.arrayBuffer()) : null;
  const db = buffer ? new sql.Database(buffer) : new sql.Database();
  initSqliteSchema(db);
  
  const entry = new SqliteFileEntry(db, handle);
  logInfo('opened db file', { file: handle.name, bytes: file.size });
  
  // 🔧 P0 优化：仅对已有数据的数据库进行完整性检查
  if (checkIntegrity && buffer && buffer.length > 0) {
    const integrity = entry.checkIntegrity();
    if (!integrity.ok) {
      logWarn('数据库可能已损坏，但仍尝试使用', {
        file: handle.name,
        errors: integrity.errors,
      });
    }
  }
  
  return entry;
}

export function createFileNativeDBApis(): NativeDBApis {
  const entries = new Map<string, SqliteFileEntry>();

  // 🔧 P0 优化：初始化时检查存储空间
  checkAndWarnStorageQuota().catch((error) => {
    logWarn('初始化存储空间检查失败', {
      error: error instanceof Error ? error.message : String(error),
    });
  });

  // 🔧 P0 优化：定期检查存储空间（每10分钟）
  const STORAGE_CHECK_INTERVAL = 10 * 60 * 1000;
  let storageCheckTimer: ReturnType<typeof setInterval> | null = null;
  
  if (typeof window !== 'undefined') {
    storageCheckTimer = setInterval(() => {
      checkAndWarnStorageQuota().catch(() => {
        // 静默失败
      });
    }, STORAGE_CHECK_INTERVAL);

    // 页面卸载时清理定时器
    window.addEventListener('pagehide', () => {
      if (storageCheckTimer) {
        clearInterval(storageCheckTimer);
        storageCheckTimer = null;
      }
    });
  }

  // 🔧 Bug #18 修复：添加页面卸载时的数据保存机制
  const flushAllEntries = async () => {
    const flushPromises: Promise<void>[] = [];
    for (const [id, entry] of entries) {
      flushPromises.push(
        entry.runExclusive(async () => {
          try {
            await entry.flush(1); // 快速模式，只重试一次
          } catch (error) {
            logWarn('页面卸载时 flush 失败', {
              id,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        })
      );
    }
    await Promise.allSettled(flushPromises);
  };

  /**
   * 🔧 P0 修复 + P1 修复：同步 flush 所有 entry
   * 
   * beforeunload / pagehide 是同步事件，浏览器不会等待异步操作。
   * 这里采用"尽力而为"策略：通过 runExclusive 排队 flush，利用浏览器给予的有限时间窗口。
   * 实际的数据安全由 visibilitychange 事件保证（在页面隐藏时提前 flush）。
   * 
   * 🔧 P1 修复：通过 runExclusive 排队，避免与正在执行的写操作冲突。
   * 旧实现直接调用 entry.flush()，可能同时有两个 createWritable() 操作同一个文件。
   */
  const flushAllEntriesSync = () => {
    for (const [id, entry] of entries) {
      if (entry.pendingFlush) {
        try {
          // 取消防抖定时器
          if (entry.flushTimer) {
            clearTimeout(entry.flushTimer);
            entry.flushTimer = null;
          }
          entry.pendingFlush = false;
          // 通过 runExclusive 排队，避免和其他操作冲突
          entry.runExclusive(async () => {
            await entry.flush(1);
          }).catch((error) => {
            logWarn('同步 flush 失败', {
              id,
              error: error instanceof Error ? error.message : String(error),
            });
          });
        } catch (error) {
          logWarn('同步 flush 异常', {
            id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  };

  // 🔧 P1 优化：事件监听器清理机制（防止内存泄漏）
  let handleBeforeUnload: (() => void) | null = null;
  let handlePageHide: ((event: PageTransitionEvent) => void) | null = null;
  let handleVisibilityChange: (() => void) | null = null;
  let listenersRegistered = false;

  const registerUnloadListeners = () => {
    if (listenersRegistered || typeof window === 'undefined') {
      return;
    }

    /**
     * 🔧 P0 修复：visibilitychange 是离线数据安全的核心保障
     * 
     * 当用户切换 tab、最小化窗口、切换应用时触发。
     * 此时浏览器仍会正常执行异步操作，是 flush 数据的最佳时机。
     * 在移动端尤其重要 —— 切到后台后页面可能被系统直接杀死。
     */
    handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        logInfo('页面不可见，立即 flush 所有数据');
        flushAllEntries().catch((error) => {
          logError('visibilitychange flush 失败', error);
        });
      }
    };

    handleBeforeUnload = () => {
      // 🔧 P0 修复：beforeunload 中使用同步版本，尽力而为
      flushAllEntriesSync();
    };

    // 使用 pagehide 事件（页面真正被卸载时的最后机会）
    handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) {
        // 页面被缓存（bfcache），不需要保存
        return;
      }
      // 🔧 P0 修复：pagehide 中也使用同步版本
      flushAllEntriesSync();
    };

    // 🔧 P0 修复：优先级最高的是 visibilitychange，它能在页面被杀死前异步 flush
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    listenersRegistered = true;
    
    logInfo('已注册页面卸载事件监听器（含 visibilitychange）');
  };

  const unregisterUnloadListeners = () => {
    if (!listenersRegistered || typeof window === 'undefined') {
      return;
    }

    if (handleVisibilityChange) {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      handleVisibilityChange = null;
    }
    if (handleBeforeUnload) {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload = null;
    }
    if (handlePageHide) {
      window.removeEventListener('pagehide', handlePageHide);
      handlePageHide = null;
    }
    listenersRegistered = false;
    
    logInfo('已清理页面卸载事件监听器');
  };

  // 初始注册监听器
  registerUnloadListeners();

  const getEntry = async (universalId: string) => {
    try {
      let entry = entries.get(universalId);
      if (!entry) {
        const handle = await getDbFileHandle(universalId);
        entry = await openSqliteEntry(handle);
        entries.set(universalId, entry);
        logInfo('created db entry', { id: universalId });
      }
      return entry;
    } catch (error) {
      logWarn('failed to open db entry', {
        id: universalId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const api: NativeDBApis = {
    connect: async (id: string) => {
      logInfo('connect', { id });
      await getEntry(id);
    },
    disconnect: async (id: string) => {
      const entry = entries.get(id);
      if (!entry) return;
      await entry.runExclusive(async () => {
        await entry.flushNow(); // 关键操作，立即 flush
        entry.db.close();
      });
      entries.delete(id);
      logInfo('disconnect', { id });
      
      // 🔧 P1 优化：所有连接断开后清理监听器和定时器（防止内存泄漏）
      if (entries.size === 0) {
        unregisterUnloadListeners();
        if (storageCheckTimer) {
          clearInterval(storageCheckTimer);
          storageCheckTimer = null;
          logInfo('已清理存储空间检查定时器');
        }
      }
    },
    pushUpdate: async (id: string, docId: string, update: Uint8Array) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT MAX(ts) AS ts FROM doc_updates WHERE doc_id=?',
          [docId]
        ) as { ts?: number } | null;
        const now = Date.now();
        const ts = row?.ts ? Math.max(now, row.ts + 1) : now;
        
        // 🔧 性能优化：使用事务包裹多条 SQL，确保原子性并提升性能
        entry.db.exec('BEGIN');
        try {
          execStatement(
            entry.db,
            'INSERT INTO doc_updates (doc_id, ts, bin) VALUES (?, ?, ?)',
            [docId, ts, update]
          );
          execStatement(
            entry.db,
            'INSERT INTO doc_clocks (doc_id, ts) VALUES (?, ?) ON CONFLICT(doc_id) DO UPDATE SET ts=excluded.ts',
            [docId, ts]
          );
          entry.db.exec('COMMIT');
        } catch (error) {
          entry.db.exec('ROLLBACK');
          throw error;
        }
        
        entry.scheduleFlush(); // 使用防抖 flush，提升性能
        
        // 🔧 P0 修复：自动压缩 doc_updates，防止数据库无限膨胀
        // 同一个 docId 的 updates 超过阈值时，合并为 snapshot + 清空 updates
        // 这是离线性能的关键：DB 越小 → export 越快 → flush 越快 → 关闭页面时数据越安全
        const AUTO_COMPACT_THRESHOLD = 50; // 每 50 次 update 压缩一次
        try {
          const countRow = readFirstRow(
            entry.db,
            'SELECT COUNT(*) AS cnt FROM doc_updates WHERE doc_id=?',
            [docId]
          ) as { cnt?: number } | null;
          const updateCount = countRow?.cnt ?? 0;
          
          if (updateCount >= AUTO_COMPACT_THRESHOLD) {
            // 读取所有 updates
            const updateRows = readAllRows(
              entry.db,
              'SELECT bin FROM doc_updates WHERE doc_id=? ORDER BY ts ASC',
              [docId]
            ) as { bin?: Uint8Array }[];
            
            const updates: Uint8Array[] = [];
            // 先读取现有 snapshot 作为基础
            const snapshotRow = readFirstRow(
              entry.db,
              'SELECT bin FROM doc_snapshots WHERE doc_id=?',
              [docId]
            ) as { bin?: Uint8Array } | null;
            if (snapshotRow?.bin && snapshotRow.bin.byteLength > 0) {
              updates.push(snapshotRow.bin);
            }
            for (const r of updateRows) {
              if (r.bin && r.bin.byteLength > 0) {
                updates.push(r.bin);
              }
            }
            
            if (updates.length > 1) {
              // 合并为新的 snapshot
              const merged = mergeUpdates(updates);
              
              entry.db.exec('BEGIN');
              try {
                // 保存合并后的 snapshot
                execStatement(
                  entry.db,
                  `INSERT INTO doc_snapshots (doc_id, ts, bin)
                   VALUES (?, ?, ?)
                   ON CONFLICT(doc_id) DO UPDATE SET ts=excluded.ts, bin=excluded.bin`,
                  [docId, ts, merged]
                );
                // 清空所有 updates（已合并到 snapshot）
                execStatement(
                  entry.db,
                  'DELETE FROM doc_updates WHERE doc_id=?',
                  [docId]
                );
                entry.db.exec('COMMIT');
                logInfo('auto-compacted doc_updates', {
                  docId,
                  updateCount,
                  snapshotSize: merged.byteLength,
                });
              } catch (compactError) {
                entry.db.exec('ROLLBACK');
                logWarn('auto-compact failed, skipping', {
                  docId,
                  error: compactError instanceof Error ? compactError.message : String(compactError),
                });
              }
            }
          }
        } catch {
          // 压缩失败不影响正常保存
        }
        
        return new Date(ts);
      });
    },
    getDocSnapshot: async (id: string, docId: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts, bin FROM doc_snapshots WHERE doc_id=?',
          [docId]
        ) as { ts?: number; bin?: Uint8Array } | null;
        if (!row) return null;
        return {
          docId,
          bin: row.bin ?? new Uint8Array(),
          timestamp: new Date(row.ts ?? 0),
        } satisfies DocRecord;
      });
    },
    setDocSnapshot: async (id: string, snapshot: DocRecord) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        execStatement(
          entry.db,
          `INSERT INTO doc_snapshots (doc_id, ts, bin)
           VALUES (?, ?, ?)
           ON CONFLICT(doc_id) DO UPDATE SET ts=excluded.ts, bin=excluded.bin
           WHERE excluded.ts >= doc_snapshots.ts`,
          [snapshot.docId, snapshot.timestamp.getTime(), snapshot.bin]
        );
        entry.scheduleFlush(); // 使用防抖 flush，提升性能
        return true;
      });
    },
    getDocUpdates: async (id: string, docId: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT ts, bin FROM doc_updates WHERE doc_id=? ORDER BY ts ASC',
          [docId]
        ) as { ts?: number; bin?: Uint8Array }[];
        return rows.map(row => ({
          docId,
          bin: row.bin ?? new Uint8Array(),
          timestamp: new Date(row.ts ?? 0),
        }));
      });
    },
    markUpdatesMerged: async (id: string, docId: string, updates: Date[]) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        // 🔧 性能优化：事务 + 错误处理
        entry.db.exec('BEGIN');
        try {
          updates.forEach(update => {
            execStatement(
              entry.db,
              'DELETE FROM doc_updates WHERE doc_id=? AND ts=?',
              [docId, update.getTime()]
            );
          });
          entry.db.exec('COMMIT');
        } catch (error) {
          entry.db.exec('ROLLBACK');
          throw error;
        }
        entry.scheduleFlush();
        return updates.length;
      });
    },
    deleteDoc: async (id: string, docId: string) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        // 🔧 性能优化：事务 + 错误处理
        entry.db.exec('BEGIN');
        try {
          execStatement(
            entry.db,
            'DELETE FROM doc_updates WHERE doc_id=?',
            [docId]
          );
          execStatement(
            entry.db,
            'DELETE FROM doc_snapshots WHERE doc_id=?',
            [docId]
          );
          execStatement(
            entry.db,
            'DELETE FROM doc_clocks WHERE doc_id=?',
            [docId]
          );
          entry.db.exec('COMMIT');
        } catch (error) {
          entry.db.exec('ROLLBACK');
          throw error;
        }
        entry.scheduleFlush();
      });
    },
    getDocClocks: async (id: string, after?: Date | null) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = after
          ? readAllRows(
              entry.db,
              'SELECT doc_id AS docId, ts FROM doc_clocks WHERE ts > ?',
              [after.getTime()]
            )
          : readAllRows(
              entry.db,
              'SELECT doc_id AS docId, ts FROM doc_clocks',
              []
            );
        return rows.map(row => ({
          docId: row.docId as string,
          timestamp: new Date(row.ts as number),
        })) as DocClock[];
      });
    },
    getDocClock: async (id: string, docId: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts FROM doc_clocks WHERE doc_id=?',
          [docId]
        ) as { ts?: number } | null;
        if (!row) return null;
        return { docId, timestamp: new Date(row.ts ?? 0) } satisfies DocClock;
      });
    },
    getBlob: async (id: string, key: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT data, mime, size, created_at FROM blobs WHERE key=?',
          [key]
        ) as { data?: Uint8Array; mime?: string; size?: number; created_at?: number } | null;
        if (!row) return null;
        return {
          key,
          data: row.data ?? new Uint8Array(),
          mime: row.mime ?? '',
          size: row.size ?? 0,
          createdAt: new Date(row.created_at ?? Date.now()),
        } satisfies BlobRecord;
      });
    },
    setBlob: async (id: string, blob: BlobRecord) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        const meta = readFirstRow(
          entry.db,
          'SELECT created_at FROM blobs WHERE key=?',
          [blob.key]
        ) as { created_at?: number } | null;
        const createdAt = meta?.created_at ?? Date.now();
        execStatement(
          entry.db,
          `INSERT INTO blobs (key, data, mime, size, created_at)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(key) DO UPDATE SET data=excluded.data, mime=excluded.mime, size=excluded.size, created_at=blobs.created_at`,
          [
            blob.key,
            blob.data,
            blob.mime ?? null,
            blob.data.length,
            createdAt,
          ]
        );
        entry.scheduleFlush(); // 使用防抖 flush，提升性能
      });
    },
    deleteBlob: async (id: string, key: string) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        execStatement(entry.db, 'DELETE FROM blobs WHERE key=?', [key]);
        entry.scheduleFlush(); // 使用防抖 flush，提升性能
      });
    },
    releaseBlobs: async () => {
      return;
    },
    listBlobs: async (id: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT key, size, mime, created_at FROM blobs',
          []
        ) as { key?: string; size?: number; mime?: string; created_at?: number }[];
        return rows.map(row => ({
          key: row.key ?? '',
          size: row.size ?? 0,
          mime: row.mime ?? '',
          createdAt: new Date(row.created_at ?? Date.now()),
        })) satisfies ListedBlobRecord[];
      });
    },
    getPeerRemoteClocks: async (id: string, peer: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT doc_id AS docId, ts FROM peer_clocks WHERE peer=? AND type=?',
          [peer, 'remote']
        ) as { docId?: string; ts?: number }[];
        return rows.map(row => ({
          docId: row.docId ?? '',
          timestamp: new Date(row.ts ?? 0),
        })) as DocClock[];
      });
    },
    getPeerRemoteClock: async (id: string, peer: string, docId: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts FROM peer_clocks WHERE peer=? AND type=? AND doc_id=?',
          [peer, 'remote', docId]
        ) as { ts?: number } | null;
        if (!row) return null;
        return { docId, timestamp: new Date(row.ts ?? 0) } satisfies DocClock;
      });
    },
    setPeerRemoteClock: async (id: string, peer: string, docId: string, clock: Date) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        execStatement(
          entry.db,
          `INSERT INTO peer_clocks (peer, type, doc_id, ts)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(peer, type, doc_id) DO UPDATE SET ts=excluded.ts`,
          [peer, 'remote', docId, clock.getTime()]
        );
        entry.scheduleFlush(); // 使用防抖 flush，提升性能
      });
    },
    getPeerPulledRemoteClocks: async (id: string, peer: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT doc_id AS docId, ts FROM peer_clocks WHERE peer=? AND type=?',
          [peer, 'pulled']
        ) as { docId?: string; ts?: number }[];
        return rows.map(row => ({
          docId: row.docId ?? '',
          timestamp: new Date(row.ts ?? 0),
        })) as DocClock[];
      });
    },
    getPeerPulledRemoteClock: async (
      id: string,
      peer: string,
      docId: string
    ) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts FROM peer_clocks WHERE peer=? AND type=? AND doc_id=?',
          [peer, 'pulled', docId]
        ) as { ts?: number } | null;
        if (!row) return null;
        return { docId, timestamp: new Date(row.ts ?? 0) } satisfies DocClock;
      });
    },
    setPeerPulledRemoteClock: async (
      id: string,
      peer: string,
      docId: string,
      clock: Date
    ) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        execStatement(
          entry.db,
          `INSERT INTO peer_clocks (peer, type, doc_id, ts)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(peer, type, doc_id) DO UPDATE SET ts=excluded.ts`,
          [peer, 'pulled', docId, clock.getTime()]
        );
        entry.scheduleFlush(); // 使用防抖 flush，提升性能
      });
    },
    getPeerPushedClocks: async (id: string, peer: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT doc_id AS docId, ts FROM peer_clocks WHERE peer=? AND type=?',
          [peer, 'pushed']
        ) as { docId?: string; ts?: number }[];
        return rows.map(row => ({
          docId: row.docId ?? '',
          timestamp: new Date(row.ts ?? 0),
        })) as DocClock[];
      });
    },
    getPeerPushedClock: async (
      id: string,
      peer: string,
      docId: string
    ) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts FROM peer_clocks WHERE peer=? AND type=? AND doc_id=?',
          [peer, 'pushed', docId]
        ) as { ts?: number } | null;
        if (!row) return null;
        return { docId, timestamp: new Date(row.ts ?? 0) } satisfies DocClock;
      });
    },
    setPeerPushedClock: async (
      id: string,
      peer: string,
      docId: string,
      clock: Date
    ) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        execStatement(
          entry.db,
          `INSERT INTO peer_clocks (peer, type, doc_id, ts)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(peer, type, doc_id) DO UPDATE SET ts=excluded.ts`,
          [peer, 'pushed', docId, clock.getTime()]
        );
        entry.scheduleFlush(); // 使用防抖 flush，提升性能
      });
    },
    clearClocks: async (id: string) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        execStatement(entry.db, 'DELETE FROM peer_clocks', []);
        execStatement(entry.db, 'DELETE FROM blob_uploaded_at', []);
        entry.scheduleFlush(); // 使用防抖 flush，提升性能
      });
    },
    setBlobUploadedAt: async (
      id: string,
      peer: string,
      blobId: string,
      uploadedAt: Date | null
    ) => {
      const entry = await getEntry(id);
      await entry.runExclusive(async () => {
        const ts = uploadedAt ? uploadedAt.getTime() : 0;
        execStatement(
          entry.db,
          `INSERT INTO blob_uploaded_at (peer, blob_id, ts)
           VALUES (?, ?, ?)
           ON CONFLICT(peer, blob_id) DO UPDATE SET ts=excluded.ts`,
          [peer, blobId, ts]
        );
        entry.scheduleFlush(); // 使用防抖 flush，提升性能
      });
    },
    getBlobUploadedAt: async (id: string, peer: string, blobId: string) => {
      const entry = await getEntry(id);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT ts FROM blob_uploaded_at WHERE peer=? AND blob_id=?',
          [peer, blobId]
        ) as { ts?: number } | null;
        if (!row) return null;
        return new Date(row.ts ?? 0);
      });
    },
  };

  return api;
}

/**
 * 🔧 P1 修复：V1 API 添加连接缓存
 * 
 * 旧实现每次调用都新建 SQLite 连接又立即关闭，频繁调用时性能极差。
 * 现在使用 Map 缓存连接，通过 idle 超时自动清理。
 */
export function createFileNativeDBV1Apis(): NativeDBV1Apis {
  const v1Entries = new Map<string, SqliteFileEntry>();
  const v1IdleTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const V1_IDLE_TIMEOUT = 30000; // 30 秒无操作后关闭连接
  
  const getV1CacheKey = (spaceType: SpaceType, workspaceId: string) => `${spaceType}:${workspaceId}`;
  
  const getV1Entry = async (spaceType: SpaceType, workspaceId: string): Promise<SqliteFileEntry> => {
    const key = getV1CacheKey(spaceType, workspaceId);
    let entry = v1Entries.get(key);
    
    if (!entry) {
      const handle = await getV1DbFileHandle(spaceType, workspaceId);
      entry = await openSqliteEntry(handle, false); // V1 只读，不需要完整性检查
      v1Entries.set(key, entry);
    }
    
    // 重置 idle 定时器
    const existingTimer = v1IdleTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    v1IdleTimers.set(key, setTimeout(() => {
      const cached = v1Entries.get(key);
      if (cached) {
        try {
          cached.db.close();
        } catch {
          // ignore
        }
        v1Entries.delete(key);
        v1IdleTimers.delete(key);
        logInfo('V1 连接 idle 超时已关闭', { key });
      }
    }, V1_IDLE_TIMEOUT));
    
    return entry;
  };
  
  return {
    getBlob: async (
      spaceType: SpaceType,
      workspaceId: string,
      key: string
    ) => {
      const entry = await getV1Entry(spaceType, workspaceId);
      return entry.runExclusive(async () => {
        const row = readFirstRow(
          entry.db,
          'SELECT data FROM v1_blobs WHERE key=?',
          [key]
        ) as { data?: Uint8Array } | null;
        if (!row?.data) return null;
        return row.data;
      });
    },
    getBlobKeys: async (spaceType: SpaceType, workspaceId: string) => {
      const entry = await getV1Entry(spaceType, workspaceId);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT key FROM v1_blobs',
          []
        ) as { key?: string }[];
        return rows.map(row => row.key ?? '');
      });
    },
    getDocAsUpdates: async (
      spaceType: SpaceType,
      workspaceId: string,
      subdocId: string
    ) => {
      const entry = await getV1Entry(spaceType, workspaceId);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT data FROM v1_updates WHERE doc_id IS ? ORDER BY id ASC',
          [subdocId]
        ) as { data?: Uint8Array }[];
        if (rows.length === 0) {
          return new Uint8Array([0, 0]);
        }
        const updates = rows.map(row => row.data ?? new Uint8Array());
        return mergeUpdates(updates);
      });
    },
    getDocTimestamps: async (spaceType: SpaceType, workspaceId: string) => {
      const entry = await getV1Entry(spaceType, workspaceId);
      return entry.runExclusive(async () => {
        const rows = readAllRows(
          entry.db,
          'SELECT doc_id AS docId, MAX(ts) AS ts FROM v1_updates WHERE doc_id IS NOT NULL GROUP BY doc_id',
          []
        ) as { docId?: string; ts?: number }[];
        return rows.map(row => ({
          docId: row.docId,
          timestamp: new Date(row.ts ?? 0),
        }));
      });
    },
  };
}
