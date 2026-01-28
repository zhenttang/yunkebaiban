const DB_NAME = 'yunke-offline-storage';
const STORE_NAME = 'handles';
const ROOT_HANDLE_KEY = 'offline-root';
const OFFLINE_DEBUG =
  typeof BUILD_CONFIG !== 'undefined' && BUILD_CONFIG.debug === true;

const logInfo = (message: string, data?: Record<string, unknown>) => {
  if (!OFFLINE_DEBUG) return;
  if (data) {
    console.info('[offline-handle]', message, data);
  } else {
    console.info('[offline-handle]', message);
  }
};

const logWarn = (message: string, data?: Record<string, unknown>) => {
  if (!OFFLINE_DEBUG) return;
  if (data) {
    console.warn('[offline-handle]', message, data);
  } else {
    console.warn('[offline-handle]', message);
  }
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
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
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
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
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export function isFileSystemAccessSupported(): boolean {
  return typeof (globalThis as any).showDirectoryPicker === 'function';
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
  const picker = (globalThis as any).showDirectoryPicker as () => Promise<FileSystemDirectoryHandle>;
  const handle = await picker();
  await saveOfflineRootHandle(handle);
  return handle;
}

export async function getOfflineRootHandleName(): Promise<string> {
  const handle = await loadOfflineRootHandle();
  return handle?.name ?? '';
}
