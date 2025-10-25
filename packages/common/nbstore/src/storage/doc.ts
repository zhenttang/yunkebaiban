import EventEmitter2 from 'eventemitter2';

import type { Connection } from '../connection';
import { isEmptyUpdate } from '../utils/is-empty-update';
import type { Locker } from './lock';
import { SingletonLocker } from './lock';
import { type Storage } from './storage';

export interface DocClock {
  docId: string;
  timestamp: Date;
}

export type DocClocks = Record<string, Date>;
export interface DocRecord extends DocClock {
  bin: Uint8Array;
  editor?: string;
  sessionId?: string;
  clientId?: string;
}

export interface DocDiff extends DocClock {
  missing: Uint8Array;
  state: Uint8Array;
}

export interface DocUpdate {
  docId: string;
  bin: Uint8Array;
  editor?: string;
  sessionId?: string;
  clientId?: string;
}

export interface Editor {
  name: string;
  avatarUrl: string | null;
}

export interface DocStorageOptions {
  mergeUpdates?: (updates: Uint8Array[]) => Promise<Uint8Array> | Uint8Array;
  id: string;

  /**
   * 以只读模式打开。
   */
  readonlyMode?: boolean;
}

export interface DocStorage extends Storage {
  readonly storageType: 'doc';
  readonly isReadonly: boolean;
  readonly spaceId: string;
  /**
   * 获取包含最新二进制数据的文档记录。
   */
  getDoc(docId: string): Promise<DocRecord | null>;
  /**
   * 根据给定的状态向量获取yjs二进制差异。
   */
  getDocDiff(docId: string, state?: Uint8Array): Promise<DocDiff | null>;
  /**
   * 将更新推送到存储中
   *
   * @param origin - 内部标识符，用于在"update"事件中识别来源。不会被存储或传输。
   */
  pushDocUpdate(update: DocUpdate, origin?: string): Promise<DocClock>;

  /**
   * 获取文档最新更新的时间戳。
   */
  getDocTimestamp(docId: string): Promise<DocClock | null>;

  /**
   * 获取所有文档的时间戳信息。特别适用于同步过程。
   */
  getDocTimestamps(after?: Date): Promise<DocClocks>;

  /**
   * 删除特定文档数据及其所有快照和更新
   */
  deleteDoc(docId: string): Promise<void>;

  /**
   * 订阅存储本身发出的文档更新。
   *
   * 注意：
   *
   *   存储本身并不总是发出更新。
   *
   *   例如，在Sqlite存储中，更新只会来自用户对文档的更新，
   *   换句话说，存储内部永远不会自动生成更新。
   *
   *   但对于云存储，会有来自其他客户端的更新广播，
   *   所以存储会发出更新来通知客户端集成它们。
   */
  subscribeDocUpdate(
    callback: (update: DocRecord, origin?: string) => void
  ): () => void;
}

export abstract class DocStorageBase<Opts = {}> implements DocStorage {
  get isReadonly(): boolean {
    return this.options.readonlyMode ?? false;
  }
  private readonly event = new EventEmitter2();
  readonly storageType = 'doc';
  abstract readonly connection: Connection;
  protected readonly locker: Locker = new SingletonLocker();
  readonly spaceId = this.options.id;

  constructor(protected readonly options: Opts & DocStorageOptions) {}

  async getDoc(docId: string) {
    // console.log('📦 [DocStorageBase] 开始获取文档:', {
    //   docId: docId,
    //   isReadonly: this.isReadonly,
    //   spaceId: this.spaceId,
    //   storageType: this.constructor.name,
    //   timestamp: new Date().toISOString()
    // });

    await using _lock = this.isReadonly
      ? undefined
      : await this.lockDocForUpdate(docId);

    // console.log('📦 [DocStorageBase] 获取文档快照...');
    const snapshot = await this.getDocSnapshot(docId);
    // console.log('📦 [DocStorageBase] 快照结果:', {
    //   docId: docId,
    //   hasSnapshot: !!snapshot,
    //   snapshotSize: snapshot?.bin?.length || 0
    // });

    // console.log('📦 [DocStorageBase] 获取文档更新...');
    const updates = await this.getDocUpdates(docId);
    // console.log('📦 [DocStorageBase] 更新结果:', {
    //   docId: docId,
    //   updatesCount: updates.length,
    //   totalUpdatesSize: updates.reduce((sum, u) => sum + (u.bin?.length || 0), 0)
    // });

    if (updates.length) {
      // console.log('📦 [DocStorageBase] 需要合并更新，开始squash...');
      const { timestamp, bin, editor } = await this.squash(
        snapshot ? [snapshot, ...updates] : updates
      );

      const newSnapshot = {
        spaceId: this.spaceId,
        docId,
        bin,
        timestamp,
        editor,
      };

      // 如果是只读模式，我们不会设置新快照
      if (!this.isReadonly) {
        // console.log('📦 [DocStorageBase] 保存新快照...');
        await this.setDocSnapshot(newSnapshot, snapshot);

        // 除非抛出异常，否则总是标记更新已合并
        await this.markUpdatesMerged(docId, updates);
      }

      // console.log('✅ [DocStorageBase] 返回合并后的文档:', {
      //   docId: docId,
      //   finalSize: bin.length,
      //   timestamp: timestamp
      // });
      return newSnapshot;
    }

    // console.log('📦 [DocStorageBase] 无需合并，返回快照:', {
    //   docId: docId,
    //   hasSnapshot: !!snapshot,
    //   snapshotSize: snapshot?.bin?.length || 0
    // });
    return snapshot;
  }

  async getDocDiff(docId: string, state?: Uint8Array) {
    const doc = await this.getDoc(docId);

    if (!doc) {
      return null;
    }

    // 防御: 当本地是空更新(如 00 00)时，yjs 对 encodeStateVectorFromUpdate 可能抛错
    // 这里做安全兜底，避免阻断同步流程；远端会通过 space:load-doc 返回完整快照
    const isEmpty = !doc.bin || doc.bin.length === 0 || isEmptyUpdate(doc.bin);
    if (isEmpty) {
      try {
        // 返回空缺失/空状态向量，交由远端补全
        return {
          docId,
          missing: new Uint8Array(),
          state: new Uint8Array(),
          timestamp: doc.timestamp,
        };
      } catch {
        return {
          docId,
          missing: new Uint8Array(),
          state: new Uint8Array(),
          timestamp: doc.timestamp,
        };
      }
    }

    // 动态导入 yjs，避免 Worker 初始化时加载
    const { diffUpdate, encodeStateVectorFromUpdate } = await import('yjs');

    return {
      docId,
      missing: state && state.length > 0 ? diffUpdate(doc.bin, state) : doc.bin,
      state: encodeStateVectorFromUpdate(doc.bin),
      timestamp: doc.timestamp,
    };
  }

  abstract pushDocUpdate(update: DocUpdate, origin?: string): Promise<DocClock>;

  abstract getDocTimestamp(docId: string): Promise<DocClock | null>;

  abstract getDocTimestamps(after?: Date): Promise<DocClocks>;

  abstract deleteDoc(docId: string): Promise<void>;

  subscribeDocUpdate(callback: (update: DocRecord, origin?: string) => void) {
    this.event.on('update', callback);

    return () => {
      this.event.off('update', callback);
    };
  }

  // 区域：内部使用的API
  protected on(
    event: 'update',
    callback: (update: DocRecord, origin: string) => void
  ): () => void;
  protected on(
    event: 'snapshot',
    callback: (snapshot: DocRecord, prevSnapshot: DocRecord | null) => void
  ): () => void;
  protected on(event: string, callback: (...args: any[]) => void): () => void {
    this.event.on(event, callback);
    return () => {
      this.event.off(event, callback);
    };
  }

  protected emit(event: 'update', update: DocRecord, origin?: string): void;
  protected emit(
    event: 'snapshot',
    snapshot: DocRecord,
    prevSnapshot: DocRecord | null
  ): void;
  protected emit(event: string, ...args: any[]): void {
    this.event.emit(event, ...args);
  }

  protected off(event: string, callback: (...args: any[]) => void): void {
    this.event.off(event, callback);
  }

  /**
   * 从存储中获取文档快照
   */
  protected abstract getDocSnapshot(docId: string): Promise<DocRecord | null>;
  /**
   * 将文档快照设置到存储中
   *
   * @safety
   * 实现此方法时要小心。
   *
   * 在多线程环境中运行时，可能会使用过时的快照调用此方法。
   *
   * 常见的解决方案是只有当新快照的时间戳更新时才在数据库中更新快照记录。
   *
   * @example
   * ```ts
   * await using _lock = await this.lockDocForUpdate(docId);
   * // 设置快照
   *
   * ```
   */
  protected abstract setDocSnapshot(
    snapshot: DocRecord,
    prevSnapshot: DocRecord | null
  ): Promise<boolean>;

  /**
   * 获取文档中尚未合并到快照的所有更新。
   *
   * 更新队列设计是出于性能考虑：
   * 如果我们不立即将更新合并到快照中，可以节省大量写入时间。
   * 当请求最新文档时，更新会被合并到快照中。
   */
  protected abstract getDocUpdates(docId: string): Promise<DocRecord[]>;

  /**
   * 标记更新已合并到快照中。
   */
  protected abstract markUpdatesMerged(
    docId: string,
    updates: DocRecord[]
  ): Promise<number>;

  /**
   * 将文档更新合并为单个更新。
   */
  protected async squash(updates: DocRecord[]): Promise<DocRecord> {
    const lastUpdate = updates.at(-1);
    if (!lastUpdate) {
      throw new Error('No updates to be squashed.');
    }

    // 快速返回
    if (updates.length === 1) {
      return lastUpdate;
    }

    const finalUpdate = await this.mergeUpdates(updates.map(u => u.bin));

    return {
      docId: lastUpdate.docId,
      bin: finalUpdate,
      timestamp: lastUpdate.timestamp,
      editor: lastUpdate.editor,
    };
  }

  protected async mergeUpdates(updates: Uint8Array[]) {
    // 动态导入 yjs，避免 Worker 初始化时加载
    const { mergeUpdates: yjsMergeUpdates } = await import('yjs');
    const merge = this.options?.mergeUpdates ?? yjsMergeUpdates;

    return merge(updates.filter(bin => !isEmptyUpdate(bin)));
  }

  protected async lockDocForUpdate(docId: string): Promise<AsyncDisposable> {
    return this.locker.lock(`workspace:${this.spaceId}:update`, docId);
  }
}
