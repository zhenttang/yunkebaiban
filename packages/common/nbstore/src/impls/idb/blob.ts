import type { IDBPTransaction, StoreNames } from 'idb';

import { share } from '../../connection';
import {
  type BlobRecord,
  BlobStorageBase,
  type ListedBlobRecord,
  StorageQuotaExceededError,
} from '../../storage';
import { IDBConnection, type IDBConnectionOptions } from './db';
import type { DocStorageSchema } from './schema';

export class IndexedDBBlobStorage extends BlobStorageBase {
  static readonly identifier = 'IndexedDBBlobStorage';
  override readonly isReadonly = false;

  readonly connection = share(new IDBConnection(this.options));

  constructor(private readonly options: IDBConnectionOptions) {
    super();
  }

  get db() {
    return this.connection.inner.db;
  }

  override async get(key: string) {
    return this.runTransaction(
      ['blobs', 'blobData'],
      'readonly',
      'blob:get',
      async trx => {
        const blob = await trx.objectStore('blobs').get(key);
        const data = await trx.objectStore('blobData').get(key);

        if (!blob || blob.deletedAt || !data) {
          return null;
        }

        return {
          ...blob,
          data: data.data,
        };
      }
    );
  }

  override async set(blob: BlobRecord) {
    await this.runTransaction(
      ['blobs', 'blobData'],
      'readwrite',
      'blob:set',
      async trx => {
        await trx.objectStore('blobs').put({
          key: blob.key,
          mime: blob.mime,
          size: blob.data.byteLength,
          createdAt: new Date(),
          deletedAt: null,
        });
        await trx.objectStore('blobData').put({
          key: blob.key,
          data: blob.data,
        });
      }
    );
  }

  override async delete(key: string, permanently: boolean) {
    if (permanently) {
      await this.runTransaction(
        ['blobs', 'blobData'],
        'readwrite',
        'blob:delete:permanent',
        async trx => {
          await trx.objectStore('blobs').delete(key);
          await trx.objectStore('blobData').delete(key);
        }
      );
    } else {
      await this.runTransaction(
        'blobs',
        'readwrite',
        'blob:delete:soft',
        async trx => {
          const blob = await trx.store.get(key);
          if (blob) {
            await trx.store.put({
              ...blob,
              deletedAt: new Date(),
            });
          }
        }
      );
    }
  }

  override async release() {
    const deletedKeys = await this.collectDeletedBlobKeys();
    if (!deletedKeys.length) {
      return;
    }

    const BATCH_SIZE = 50;
    for (let i = 0; i < deletedKeys.length; i += BATCH_SIZE) {
      const batch = deletedKeys.slice(i, i + BATCH_SIZE);
      await this.runTransaction(
        ['blobs', 'blobData'],
        'readwrite',
        'blob:release',
        async trx => {
          const blobStore = trx.objectStore('blobs');
          const blobDataStore = trx.objectStore('blobData');
          await Promise.all(
            batch.map(async key => {
              await blobStore.delete(key);
              await blobDataStore.delete(key);
            })
          );
        }
      );
      // Give IndexedDB event loop a moment to flush between batches.
      if (i + BATCH_SIZE < deletedKeys.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  override async list() {
    return this.runTransaction('blobs', 'readonly', 'blob:list', async trx => {
      const blobs: ListedBlobRecord[] = [];
      let cursor = await trx.store.openCursor();

      while (cursor) {
        if (!cursor.value.deletedAt) {
          blobs.push(cursor.value);
        }
        cursor = await cursor.continue();
      }

      return blobs;
    });
  }

  private async collectDeletedBlobKeys(): Promise<string[]> {
    return this.runTransaction(
      'blobs',
      'readonly',
      'blob:collect-deleted',
      async trx => {
        const keys: string[] = [];
        let cursor = await trx.store.openCursor();

        while (cursor) {
          if (cursor.value.deletedAt) {
            keys.push(cursor.value.key);
          }
          cursor = await cursor.continue();
        }

        return keys;
      }
    );
  }

  private async runTransaction<T>(
    stores: StoreNames<DocStorageSchema> | StoreNames<DocStorageSchema>[],
    mode: IDBTransactionMode,
    context: string,
    operation: (
      trx: IDBPTransaction<
        DocStorageSchema,
        StoreNames<DocStorageSchema>[],
        StoreNames<DocStorageSchema>
      >
    ) => Promise<T>
  ): Promise<T> {
    const storeNames = Array.isArray(stores) ? stores : [stores];
    const trx = this.db.transaction(storeNames, mode);

    try {
      const result = await operation(trx);
      await trx.done;
      return result;
    } catch (error) {
      await this.safelyFinalizeTransaction(trx);
      throw this.normalizeIDBError(error, context);
    }
  }

  private async safelyFinalizeTransaction(
    trx: IDBPTransaction<
      DocStorageSchema,
      StoreNames<DocStorageSchema>[],
      StoreNames<DocStorageSchema>
    >
  ) {
    try {
      await trx.done;
    } catch {
      // ignore secondary failures
    }
  }

  private normalizeIDBError(error: unknown, context: string): Error {
    if (this.isQuotaExceeded(error)) {
      return new StorageQuotaExceededError(
        'IndexedDB 存储空间不足，请清理本地缓存或回收资源后重试。'
      );
    }

    if (error instanceof Error) {
      error.message = `[IndexedDBBlobStorage] ${context} failed: ${error.message}`;
      return error;
    }

    return new Error(`[IndexedDBBlobStorage] ${context} failed.`);
  }

  private isQuotaExceeded(error: unknown): boolean {
    if (
      typeof error === 'object' &&
      error !== null &&
      'name' in error &&
      typeof (error as { name?: unknown }).name === 'string'
    ) {
      return (error as { name: string }).name === 'QuotaExceededError';
    }

    return false;
  }
}
