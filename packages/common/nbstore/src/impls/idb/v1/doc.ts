import { once } from 'lodash-es';
import type {
  Array as YArray,
  Map as YMap,
} from 'yjs';

import { share } from '../../../connection';
import {
  type DocClocks,
  type DocRecord,
  DocStorageBase,
  type DocStorageOptions,
  type DocUpdate,
} from '../../../storage';
import { getIdConverter } from '../../../utils/id-converter';
import { DocIDBConnection } from './db';

/**
 * We use a fixed timestamp in v1 because the v1 should never be changed.
 * This date is chosen because it is large enough to overwrite some previous error data.
 * In our sync storage, only a larger timestamp can overwrite smaller one.
 */
const CONST_TIMESTAMP = new Date(1893456000000);

/**
 * @deprecated readonly
 */
export class IndexedDBV1DocStorage extends DocStorageBase {
  static readonly identifier = 'IndexedDBV1DocStorage';

  readonly connection = share(new DocIDBConnection());

  constructor(opts: DocStorageOptions) {
    super({
      ...opts,
      readonlyMode: true,
    });
  }

  get db() {
    return this.connection.inner;
  }

  get name() {
    return 'idb(old)';
  }

  override async getDoc(docId: string) {
    if (!this.db) {
      return null;
    }
    const oldId = (await this.getIdConverter()).newIdToOldId(docId);
    const rawDoc = await this.rawGetDoc(oldId);
    return rawDoc
      ? {
          docId: rawDoc.docId,
          bin: rawDoc.bin,
          timestamp: CONST_TIMESTAMP,
        }
      : null;
  }

  protected override async getDocSnapshot() {
    return null;
  }

  override async pushDocUpdate(update: DocUpdate) {
    // no more writes to old db
    return { docId: update.docId, timestamp: CONST_TIMESTAMP };
  }

  override async deleteDoc(docId: string) {
    if (!this.db) {
      return;
    }
    const oldId = (await this.getIdConverter()).newIdToOldId(docId);
    const trx = this.db.transaction('workspace', 'readwrite');
    await trx.store.delete(oldId);
  }

  override async getDocTimestamps(): Promise<DocClocks> {
    if (!this.db) {
      return {};
    }

    const idConverter = await this.getIdConverter();

    const oldIds: string[] = [this.spaceId];

    const rootDocBuffer = await this.rawGetDoc(this.spaceId);
    if (rootDocBuffer) {
      // 动态导入 yjs，避免 Worker 初始化时加载
      const { Doc: YDoc, applyUpdate } = await import('yjs');

      const ydoc = new YDoc({
        guid: this.spaceId,
      });
      try {
        // 有些旧数据可能为空或损坏（例如 00 00），这里做保护
        if (rootDocBuffer.bin?.byteLength && rootDocBuffer.bin.byteLength > 2) {
          applyUpdate(ydoc, rootDocBuffer.bin);
        } else {
          console.warn('[IndexedDBV1DocStorage] rootDocBuffer is empty/corrupt, skip applyUpdate');
        }
      } catch (e) {
        console.warn('[IndexedDBV1DocStorage] applyUpdate failed on root doc buffer, skip normalized id scan', e);
      }

      // get all ids from rootDoc.meta.pages.[*].id, trust this id as normalized id
      const normalizedDocIds = (
        (ydoc.getMap('meta') as YMap<any> | undefined)?.get('pages') as
          | YArray<YMap<any>>
          | undefined
      )
        ?.map(i => i.get('id') as string)
        .filter(i => !!i);

      const spaces = ydoc.getMap('spaces') as YMap<any> | undefined;
      for (const pageId of normalizedDocIds ?? []) {
        const subdoc = spaces?.get(pageId);
        if (subdoc && subdoc instanceof YDoc) {
          oldIds.push(subdoc.guid);
        }
      }
    }

    const trx = this.db.transaction('workspace', 'readonly');
    const allKeys = await trx.store.getAllKeys();
    oldIds.push(...allKeys.filter(k => k.startsWith(`db$${this.spaceId}$`)));
    oldIds.push(
      ...allKeys.filter(k =>
        k.match(new RegExp(`^userdata\\$[\\w-]+\\$${this.spaceId}$`))
      )
    );

    return Object.fromEntries(
      oldIds.map(id => [idConverter.oldIdToNewId(id), CONST_TIMESTAMP])
    );
  }

  override async getDocTimestamp(_docId: string) {
    return null;
  }

  protected override async setDocSnapshot(): Promise<boolean> {
    return false;
  }

  protected override async getDocUpdates(): Promise<DocRecord[]> {
    return [];
  }

  protected override async markUpdatesMerged(): Promise<number> {
    return 0;
  }

  private async rawGetDoc(id: string) {
    if (!this.db) {
      return null;
    }
    const trx = this.db.transaction('workspace', 'readonly');
    const record = await trx.store.get(id);

    if (!record?.updates.length) {
      return null;
    }

    // 过滤明显无效/空的更新（例如 2 字节 00 00）
    const validUpdates = record.updates.filter(u => {
      const len = u?.update?.byteLength ?? 0;
      return len > 2; // 最小保护阈值，避免 yjs 解码异常
    });

    if (!validUpdates.length) {
      return null;
    }

    if (validUpdates.length === 1) {
      return {
        docId: id,
        bin: validUpdates[0].update,
        timestamp: new Date(validUpdates[0].timestamp),
      };
    }

    return {
      docId: id,
      bin: await this.mergeUpdates(validUpdates.map(update => update.update)),
      timestamp: new Date(validUpdates.at(-1)?.timestamp ?? Date.now()),
    };
  }

  private readonly getIdConverter = once(async () => {
    const idConverter = getIdConverter(
      {
        getDocBuffer: async id => {
          if (!this.db) {
            return null;
          }
          const trx = this.db.transaction('workspace', 'readonly');
          const record = await trx.store.get(id);

          if (!record?.updates.length) {
            return null;
          }

          const valid = record.updates
            .map(u => u.update)
            .filter(buf => (buf?.byteLength ?? 0) > 2);
          if (!valid.length) {
            return null;
          }
          if (valid.length === 1) {
            return valid[0];
          }
          try {
            return await this.mergeUpdates(valid);
          } catch (e) {
            console.warn('[IndexedDBV1DocStorage] mergeUpdates failed, return first valid update', e);
            return valid[0];
          }
        },
      },
      this.spaceId
    );

    return await idConverter;
  });
}
