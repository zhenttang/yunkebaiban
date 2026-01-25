const DB_NAME = 'yunke-offline-storage';
const STORE_NAME = 'handles';
const ROOT_HANDLE_KEY = 'offline-root';

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
}

export async function loadOfflineRootHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    return await withStore('readonly', store => store.get(ROOT_HANDLE_KEY));
  } catch {
    return null;
  }
}

export async function clearOfflineRootHandle(): Promise<void> {
  await withStore('readwrite', store => store.delete(ROOT_HANDLE_KEY));
}

export async function ensureHandlePermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  if (typeof handle.queryPermission !== 'function') return false;
  const status = await handle.queryPermission({ mode: 'readwrite' });
  if (status === 'granted') return true;
  if (typeof handle.requestPermission !== 'function') return false;
  const requested = await handle.requestPermission({ mode: 'readwrite' });
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
