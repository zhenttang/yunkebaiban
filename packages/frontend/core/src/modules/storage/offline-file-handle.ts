import { DebugLogger } from '@yunke/debug';

/**
 * File System Access API 类型声明
 * 用于支持离线文件存储功能
 */
interface FileSystemAccessWindow {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}

const DB_NAME = 'yunke-offline-storage';
const STORE_NAME = 'handles';
const ROOT_HANDLE_KEY = 'offline-root';
const OFFLINE_DEBUG =
  typeof BUILD_CONFIG !== 'undefined' && BUILD_CONFIG.debug === true;

// 统一日志器
const logger = new DebugLogger('yunke:offline-handle');

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

/**
 * 🔧 P1 修复：缓存 IndexedDB 连接，避免每次操作都新建连接
 * 
 * 旧实现每次 withStore 调用都 open + close，频繁操作时性能差。
 * 现在缓存连接，添加 onclose/onerror 自动重连。
 */
let cachedHandleDb: IDBDatabase | null = null;
let handleDbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (cachedHandleDb) {
    return Promise.resolve(cachedHandleDb);
  }
  if (handleDbPromise) {
    return handleDbPromise;
  }
  
  handleDbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      // 监控连接关闭，自动重置缓存
      db.onclose = () => {
        cachedHandleDb = null;
        handleDbPromise = null;
      };
      db.onerror = () => {
        cachedHandleDb = null;
        handleDbPromise = null;
      };
      db.onversionchange = () => {
        db.close();
        cachedHandleDb = null;
        handleDbPromise = null;
      };
      cachedHandleDb = db;
      resolve(db);
    };
    request.onerror = () => {
      handleDbPromise = null;
      reject(request.error);
    };
  });
  
  handleDbPromise.catch(() => {
    handleDbPromise = null;
  });
  
  return handleDbPromise;
}

async function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result as T);
    request.onerror = () => {
      reject(request.error);
    };
    tx.onerror = () => {
      reject(tx.error);
    };
    tx.onabort = () => {
      reject(new Error('IndexedDB 事务被中止'));
    };
    // 🔧 P1 修复：不再在每次事务后 close 连接，连接由缓存管理
  });
}

export function isFileSystemAccessSupported(): boolean {
  const windowWithFSA = globalThis as unknown as FileSystemAccessWindow;
  return typeof windowWithFSA.showDirectoryPicker === 'function';
}

export async function saveOfflineRootHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  await withStore('readwrite', store => store.put(handle, ROOT_HANDLE_KEY));
  logInfo('saved root handle', { name: handle.name });
}

export async function loadOfflineRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const handle = await withStore('readonly', store => store.get(ROOT_HANDLE_KEY));
    logInfo('loaded root handle', { name: handle?.name ?? '' });
    return handle ?? null;
  } catch (error) {
    // 🔧 Bug #17 修复：记录具体错误，便于调试离线存储问题
    logWarn('failed to load root handle', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function clearOfflineRootHandle(): Promise<void> {
  await withStore('readwrite', store => store.delete(ROOT_HANDLE_KEY));
  logInfo('cleared root handle');
}

export async function ensureHandlePermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  if (typeof handle.queryPermission !== 'function') return false;
  const status = await handle.queryPermission({ mode: 'readwrite' });
  logInfo('query permission', { name: handle.name, status });
  if (status === 'granted') return true;
  if (typeof handle.requestPermission !== 'function') return false;
  const requested = await handle.requestPermission({ mode: 'readwrite' });
  logInfo('request permission', { name: handle.name, status: requested });
  return requested === 'granted';
}

export async function requestOfflineRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) return null;
  const windowWithFSA = globalThis as unknown as FileSystemAccessWindow;
  const handle = await windowWithFSA.showDirectoryPicker!();
  await saveOfflineRootHandle(handle);
  return handle;
}

export async function getOfflineRootHandleName(): Promise<string> {
  const handle = await loadOfflineRootHandle();
  return handle?.name ?? '';
}
