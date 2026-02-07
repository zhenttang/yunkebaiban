import type { AsyncMemento, Memento } from '@toeverything/infra';
import EventEmitter2 from 'eventemitter2';
import { type IDBPDatabase, openDB } from 'idb';
import { Observable } from 'rxjs';
import { DebugLogger } from '@yunke/debug';

import type {
  CacheStorage,
  GlobalCache,
  GlobalSessionState,
  GlobalState,
} from '../providers/global';
import { safeJsonParse } from '../../../utils/safe-json';

// 统一日志管理
const logger = new DebugLogger('yunke:storage-memento');

export class StorageMemento implements Memento {
  // eventEmitter is used for same tab event
  private readonly eventEmitter = new EventEmitter2();
  // channel is used for cross-tab event
  private readonly channel: BroadcastChannel | null;
  private readonly memory = new Map<string, unknown>();
  constructor(
    private readonly storage: Storage,
    private readonly prefix: string
  ) {
    this.channel =
      typeof BroadcastChannel === 'function'
        ? new BroadcastChannel(this.prefix)
        : null;
  }

  private storageKey(key: string) {
    return this.prefix + key;
  }

  private readValue<T>(key: string): T | undefined {
    const storageKey = this.storageKey(key);
    let raw: string | null = null;
    try {
      raw = this.storage.getItem(storageKey);
    } catch (error) {
      logger.warn('Failed to read storage key', { key, error });
      return this.memory.get(storageKey) as T | undefined;
    }
    if (raw === null) {
      return this.memory.get(storageKey) as T | undefined;
    }
    const parsed = safeJsonParse<T>(raw, {
      onError: error => {
        logger.warn(`Failed to parse key "${key}", removing corrupted entry`, error);
        try {
          this.storage.removeItem(storageKey);
        } catch (removeError) {
          logger.warn('Failed to remove corrupted storage key', { key, error: removeError });
        }
      },
    });
    if (parsed !== undefined) {
      this.memory.set(storageKey, parsed);
    }
    return parsed;
  }

  keys(): string[] {
    const keys = new Set<string>();
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.add(key.slice(this.prefix.length));
        }
      }
    } catch (error) {
      logger.warn('Failed to read storage keys', error);
    }
    for (const key of this.memory.keys()) {
      if (key.startsWith(this.prefix)) {
        keys.add(key.slice(this.prefix.length));
      }
    }
    return Array.from(keys);
  }

  get<T>(key: string): T | undefined {
    return this.readValue<T>(key);
  }
  watch<T>(key: string): Observable<T | undefined> {
    return new Observable<T | undefined>(subscriber => {
      const first = this.readValue<T>(key);
      subscriber.next(first);

      const eventEmitterCb = (value: T) => {
        subscriber.next(value);
      };
      this.eventEmitter.on(key, eventEmitterCb);

      const channelCb = (event: MessageEvent) => {
        if (event.data.key === key) {
          subscriber.next(event.data.value);
        }
      };
      this.channel?.addEventListener('message', channelCb);
      return () => {
        this.eventEmitter.off(key, eventEmitterCb);
        this.channel?.removeEventListener('message', channelCb);
      };
    });
  }
  set<T>(key: string, value: T): void {
    const storageKey = this.storageKey(key);
    this.memory.set(storageKey, value);
    try {
      this.storage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      logger.warn('Failed to persist value, keep in memory',
        key,
        error
      );
    }
    this.eventEmitter.emit(key, value);
    try {
      this.channel?.postMessage({ key, value });
    } catch (error) {
      logger.warn('Failed to broadcast update', { key, error });
    }
  }

  del(key: string): void {
    const storageKey = this.storageKey(key);
    this.memory.delete(storageKey);
    try {
      this.storage.removeItem(storageKey);
    } catch (error) {
      logger.warn('Failed to remove storage key', { key, error });
    }
  }

  clear(): void {
    for (const key of this.keys()) {
      this.del(key);
    }
  }
}

export class LocalStorageGlobalCache
  extends StorageMemento
  implements GlobalCache
{
  constructor() {
    super(localStorage, 'global-cache:');
  }
}

export class LocalStorageGlobalState
  extends StorageMemento
  implements GlobalState
{
  constructor() {
    super(localStorage, 'global-state:');
  }
}

export class SessionStorageGlobalSessionState
  extends StorageMemento
  implements GlobalSessionState
{
  constructor() {
    super(sessionStorage, 'global-session-state:');
  }
}

export class AsyncStorageMemento implements AsyncMemento {
  // eventEmitter is used for same tab event
  private readonly eventEmitter = new EventEmitter2();
  // channel is used for cross-tab event
  private readonly channel: BroadcastChannel | null;
  constructor(
    private readonly dbName: string,
    private readonly table: string
  ) {
    this.channel =
      typeof BroadcastChannel === 'function'
        ? new BroadcastChannel(this.dbName)
        : null;
  }

  private _db: IDBPDatabase<any> | null = null;
  private _dbPromise: Promise<IDBPDatabase<any>> | null = null;

  /**
   * 🔧 P2 修复：处理连接断开情况
   * 
   * 旧实现缓存连接但不处理 close/error 事件，
   * 移动端浏览器回收连接后后续操作全部失败。
   */
  private async getDB() {
    if (this._db) {
      return this._db;
    }
    if (this._dbPromise) {
      return this._dbPromise;
    }
    
    const { dbName, table } = this;
    this._dbPromise = openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(table)) {
          db.createObjectStore(table, { keyPath: 'key' });
        }
      },
    }).then(db => {
      // 监控连接关闭，重置缓存以允许重连
      const rawDb = db as unknown as { addEventListener?: (type: string, listener: () => void) => void };
      if (rawDb.addEventListener) {
        rawDb.addEventListener('close', () => {
          this._db = null;
          this._dbPromise = null;
        });
      }
      this._db = db;
      return db;
    });
    
    this._dbPromise.catch(() => {
      this._db = null;
      this._dbPromise = null;
    });
    
    return this._dbPromise;
  }

  async get<T>(key: string): Promise<T | undefined> {
    const db = await this.getDB();
    const tx = db.transaction(this.table, 'readonly');
    const store = tx.objectStore(this.table);
    const result = await store.get(key);
    return result?.value;
  }

  watch<T>(key: string): Observable<T | undefined> {
    return new Observable<T | undefined>(subscriber => {
      // Get initial value
      this.get<T>(key).then(
        value => {
          subscriber.next(value);
        },
        error => {
          logger.error('获取初始值错误', error);
          subscriber.next(undefined);
        }
      );

      // Listen for same tab events
      const eventEmitterCb = (value: T) => {
        subscriber.next(value);
      };
      this.eventEmitter.on(key, eventEmitterCb);

      // Listen for cross-tab events
      // eslint-disable-next-line sonarjs/no-identical-functions
      const channelCb = (event: MessageEvent) => {
        if (event.data.key === key) {
          subscriber.next(event.data.value);
        }
      };
      this.channel?.addEventListener('message', channelCb);

      return () => {
        this.eventEmitter.off(key, eventEmitterCb);
        this.channel?.removeEventListener('message', channelCb);
      };
    });
  }

  async set<T>(key: string, value: T | undefined): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(this.table, 'readwrite');
    const store = tx.objectStore(this.table);

    if (value === undefined) {
      await store.delete(key);
    } else {
      await store.put({ key, value });
    }

    // Emit events
    this.eventEmitter.emit(key, value);
    try {
      this.channel?.postMessage({ key, value });
    } catch (error) {
      logger.warn('AsyncStorageMemento: Failed to broadcast update', { key, error });
    }
  }

  async del(key: string): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(this.table, 'readwrite');
    const store = tx.objectStore(this.table);
    await store.delete(key);

    // Emit events
    this.eventEmitter.emit(key, undefined);
    try {
      this.channel?.postMessage({ key, value: undefined });
    } catch (error) {
      logger.warn('AsyncStorageMemento: Failed to broadcast update', { key, error });
    }
  }

  async clear(): Promise<void> {
    const keys = await this.keys();
    const db = await this.getDB();
    const tx = db.transaction(this.table, 'readwrite');
    const store = tx.objectStore(this.table);
    await store.clear();

    // Notify observers about each deleted key
    for (const key of keys) {
      this.eventEmitter.emit(key, undefined);
      try {
        this.channel?.postMessage({ key, value: undefined });
      } catch (error) {
        logger.warn('AsyncStorageMemento: Failed to broadcast update', { key, error });
      }
    }
  }

  async keys(): Promise<string[]> {
    const db = await this.getDB();
    const tx = db.transaction(this.table, 'readonly');
    const store = tx.objectStore(this.table);
    const allObjects = await store.getAll();
    return allObjects.map(obj => obj.key);
  }
}

export class IDBGlobalState
  extends AsyncStorageMemento
  implements CacheStorage
{
  constructor() {
    super('global-storage', 'global-state');
  }
}
