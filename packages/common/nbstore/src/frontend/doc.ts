import { groupBy } from 'lodash-es';
import { nanoid } from 'nanoid';
import {
  combineLatest,
  filter,
  first,
  lastValueFrom,
  map,
  Observable,
  ReplaySubject,
  share,
  Subject,
  throttleTime,
} from 'rxjs';
import {
  applyUpdate,
  type Doc as YDoc,
  encodeStateAsUpdate,
  Map as YMap,
  mergeUpdates,
  type Transaction as YTransaction,
} from 'yjs';

import type { DocRecord, DocStorage } from '../storage';
import type { DocSync } from '../sync/doc';
import { AsyncPriorityQueue } from '../utils/async-priority-queue';
import { isEmptyUpdate } from '../utils/is-empty-update';
import { takeUntilAbort } from '../utils/take-until-abort';
import { MANUALLY_STOP, throwIfAborted } from '../utils/throw-if-aborted';

const NBSTORE_ORIGIN = 'nbstore-frontend';

type Job =
  | {
      type: 'load';
      docId: string;
    }
  | {
      type: 'save';
      docId: string;
      update: Uint8Array;
    }
  | {
      type: 'apply';
      docId: string;
      update: Uint8Array;
    };

interface DocFrontendOptions {
  mergeUpdates?: (updates: Uint8Array[]) => Promise<Uint8Array> | Uint8Array;
}

export type DocFrontendDocState = {
  /**
   * some data is available in yjs doc instance
   */
  ready: boolean;
  /**
   * data is loaded from local doc storage and applied to yjs doc instance
   */
  loaded: boolean;
  /**
   * some data is being applied to yjs doc instance, or some data is being saved to local doc storage
   */
  updating: boolean;
  /**
   * the doc is syncing with remote peers
   */
  syncing: boolean;
  /**
   * the doc is synced with remote peers
   */
  synced: boolean;
  /**
   * the doc is retrying to sync with remote peers
   */
  syncRetrying: boolean;
  /**
   * the error message when syncing with remote peers
   */
  syncErrorMessage: string | null;
};

export type DocFrontendState = {
  /**
   * total number of docs
   */
  total: number;
  /**
   * number of docs that have been loaded to yjs doc instance
   */
  loaded: number;
  /**
   * some data is being applied to yjs doc instance, or some data is being saved to local doc storage
   */
  updating: boolean;
  /**
   * number of docs that are syncing with remote peers
   */
  syncing: number;
  /**
   * whether all docs are synced with remote peers
   */
  synced: boolean;
  /**
   * whether the doc is retrying to sync with remote peers
   */
  syncRetrying: boolean;
  /**
   * the error message when syncing with remote peers
   */
  syncErrorMessage: string | null;
};

export class DocFrontend {
  private readonly uniqueId = `frontend:${nanoid()}`;

  private readonly prioritySettings = new Map<string, number>();

  private readonly status = {
    docs: new Map<string, YDoc>(),
    connectedDocs: new Set<string>(),
    readyDocs: new Set<string>(),
    jobDocQueue: new AsyncPriorityQueue(),
    jobMap: new Map<string, Job[]>(),
    currentJob: null as { docId: string; jobs: Job[] } | null,
  };

  private readonly statusUpdatedSubject$ = new Subject<string>();

  private readonly abort = new AbortController();

  constructor(
    public readonly storage: DocStorage,
    private readonly sync: DocSync,
    readonly options: DocFrontendOptions = {}
  ) {}

  private _docState$(docId: string): Observable<DocFrontendDocState> {
    const frontendState$ = new Observable<{
      ready: boolean;
      loaded: boolean;
      updating: boolean;
    }>(subscribe => {
      const next = () => {
        const readyStatus = this.status.readyDocs.has(docId);
        const loadedStatus = this.status.connectedDocs.has(docId);
        const updatingStatus = (this.status.jobMap.get(docId)?.length ?? 0) > 0 ||
            this.status.currentJob?.docId === docId;

        subscribe.next({
          ready: readyStatus,
          loaded: loadedStatus,
          updating: updatingStatus,
        });
      };
      next();
      return this.statusUpdatedSubject$.subscribe(updatedId => {
        if (updatedId === docId) next();
      });
    });
    const syncState$ = this.sync.docState$(docId);
    return combineLatest([frontendState$, syncState$]).pipe(
      map(([frontend, sync]) => ({
        ...frontend,
        synced: sync.synced,
        syncing: sync.syncing,
        syncRetrying: sync.retrying,
        syncErrorMessage: sync.errorMessage,
      }))
    );
  }

  docState$(docId: string): Observable<DocFrontendDocState> {
    return this._docState$(docId).pipe(
      throttleTime(1000, undefined, {
        trailing: true,
        leading: true,
      })
    );
  }

  private readonly _state$ = combineLatest([
    new Observable<{ total: number; loaded: number; updating: boolean }>(
      subscriber => {
        const next = () => {
          subscriber.next({
            total: this.status.docs.size,
            loaded: this.status.connectedDocs.size,
            updating:
              this.status.jobMap.size > 0 || this.status.currentJob !== null,
          });
        };
        next();
        return this.statusUpdatedSubject$.subscribe(() => {
          next();
        });
      }
    ),
    this.sync.state$,
  ]).pipe(
    map(([frontend, sync]) => ({
      total: sync.total ?? frontend.total,
      loaded: frontend.loaded,
      updating: frontend.updating,
      syncing: sync.syncing,
      synced: sync.synced,
      syncRetrying: sync.retrying,
      syncErrorMessage: sync.errorMessage,
    })),
    share({
      connector: () => new ReplaySubject(1),
    })
  ) satisfies Observable<DocFrontendState>;

  state$ = this._state$.pipe(
    throttleTime(1000, undefined, {
      leading: true,
      trailing: true,
    })
  );

  start() {
    if (this.abort.signal.aborted) {
      throw new Error('doc frontend can only start once');
    }
    this.mainLoop(this.abort.signal).catch(error => {
      console.error(error);
    });
  }

  stop() {
    this.abort.abort(MANUALLY_STOP);
  }

  private async mainLoop(signal?: AbortSignal) {

    await this.storage.connection.waitForConnected(signal);


    const dispose = this.storage.subscribeDocUpdate((record, origin) => {
      this.event.onStorageUpdate(record, origin);
    });

    try {

      // wait for storage to connect
      await Promise.race([
        this.storage.connection.waitForConnected(signal),
        new Promise((_, reject) => {
          signal?.addEventListener('abort', reason => {
            reject(reason);
          });
        }),
      ]);


      while (true) {
        throwIfAborted(signal);


        const docId = await this.status.jobDocQueue.asyncPop(signal);

        const jobs = this.status.jobMap.get(docId);
        this.status.jobMap.delete(docId);

        if (!jobs) {
          console.warn('⚠️ [DocFrontend.mainLoop] 作业列表为空，跳过:', {
            docId
          });
          this.statusUpdatedSubject$.next(docId);
          continue;
        }

        this.status.currentJob = { docId, jobs };
        this.statusUpdatedSubject$.next(docId);

        const { apply, load, save } = groupBy(jobs, job => job.type) as {
          [key in Job['type']]?: Job[];
        };

        if (load?.length) {
          await this.jobs.load(load[0] as any, signal);
        }

        if (apply?.length) {
          for (const applyJob of apply) {
            await this.jobs.apply(applyJob as any, signal);
          }
        }

        if (save?.length) {
          await this.jobs.save(docId, save as any, signal);
        }


        this.status.currentJob = null;
        this.statusUpdatedSubject$.next(docId);
      }
    } catch (error) {
      console.error('❌ [DocFrontend.mainLoop] 主循环错误:', {
        error,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    } finally {
      dispose();
    }
  }

  /**
   * Connect a doc to the frontend, the doc will sync with the doc storage.
   * @param doc - The doc to connect
   */
  connectDoc(doc: YDoc) {
    this._connectDoc(doc);
  }

  readonly jobs = {
    load: async (job: Job & { type: 'load' }, signal?: AbortSignal) => {
      const doc = this.status.docs.get(job.docId);
      if (!doc) {
        return;
      }
      const existingData = encodeStateAsUpdate(doc);

      if (!isEmptyUpdate(existingData)) {
        this.schedule({
          type: 'save',
          docId: doc.guid,
          update: existingData,
        });
      }

      // mark doc as loaded
      doc.emit('sync', [true, doc]);


      const docRecord = await this.storage.getDoc(job.docId);
      throwIfAborted(signal);


      if (docRecord && !isEmptyUpdate(docRecord.bin)) {
        this.applyUpdate(job.docId, docRecord.bin);
        this.status.readyDocs.add(job.docId);
      } else {
        console.warn('⚠️ [DocFrontend.load] 文档数据无效，无法标记为ready:', {
          docId: job.docId,
          hasDocRecord: !!docRecord,
          binSize: docRecord?.bin?.length || 0,
          reason: !docRecord ? 'no-doc-record' : 'empty-update'
        });
      }

      this.status.connectedDocs.add(job.docId);
      this.statusUpdatedSubject$.next(job.docId);
    },
    save: async (
      docId: string,
      jobs: (Job & { type: 'save' })[],
      signal?: AbortSignal
    ) => {

      if (!this.status.docs.has(docId)) {
        console.warn('⚠️ [DocFrontend.save] 保存跳过 - 文档不在 docs 集合中:', {
          docId,
          docsSize: this.status.docs.size,
          docsList: Array.from(this.status.docs)
        });
        return;
      }

      if (this.status.connectedDocs.has(docId)) {
        const updatesList = jobs.map(j => j.update).filter(update => !isEmptyUpdate(update));

        const merged = await this.mergeUpdates(updatesList);


        throwIfAborted(signal);

        try {
          await this.storage.pushDocUpdate(
            {
              docId,
              bin: merged,
            },
            this.uniqueId
          );
        } catch (error) {
          console.error('❌ [DocFrontend.save] 推送到存储失败:', {
            docId,
            error,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined
          });
          throw error;
        }
      } else {
        console.warn('⚠️ [DocFrontend.save] 保存跳过 - 文档不在 connectedDocs 中:', {
          docId,
          docsSize: this.status.docs.size,
          connectedDocsSize: this.status.connectedDocs.size,
          reason: 'load作业可能未完成或失败'
        });
      }
    },
    apply: async (job: Job & { type: 'apply' }, signal?: AbortSignal) => {

      throwIfAborted(signal);

      if (!this.status.docs.has(job.docId)) {
        console.warn('⚠️ [DocFrontend.jobs.apply] 文档不在 docs 中，跳过:', {
          docId: job.docId
        });
        return;
      }


      if (this.status.connectedDocs.has(job.docId)) {
        this.applyUpdate(job.docId, job.update);
      } else {
        console.warn('⚠️ [DocFrontend.jobs.apply] 文档不在 connectedDocs 中，跳过应用');
      }

      if (!isEmptyUpdate(job.update)) {
        this.status.readyDocs.add(job.docId);
        this.statusUpdatedSubject$.next(job.docId);
      }

    },
  };

  event = {
    onStorageUpdate: (update: DocRecord, origin?: string) => {

      if (origin !== this.uniqueId) {
        this.schedule({
          type: 'apply',
          docId: update.docId,
          update: update.bin,
        });
      } else {
      }
    },
  };

  /**
   * Disconnect a doc from the frontend, the doc will stop syncing with the doc storage.
   * It's not recommended to use this method directly, better to use `doc.destroy()`.
   *
   * @param doc - The doc to disconnect
   */
  disconnectDoc(doc: YDoc) {
    this.status.docs.delete(doc.guid);
    this.status.connectedDocs.delete(doc.guid);
    this.status.readyDocs.delete(doc.guid);
    this.status.jobDocQueue.remove(doc.guid);
    this.status.jobMap.delete(doc.guid);
    this.statusUpdatedSubject$.next(doc.guid);
    doc.off('update', this.handleDocUpdate);
  }

  addPriority(id: string, priority: number) {
    const undoSyncPriority = this.sync?.addPriority(id, priority);
    const oldPriority = this.prioritySettings.get(id) ?? 0;

    this.prioritySettings.set(id, priority);
    this.status.jobDocQueue.setPriority(id, oldPriority + priority);

    return () => {
      const currentPriority = this.prioritySettings.get(id) ?? 0;
      this.prioritySettings.set(id, currentPriority - priority);
      this.status.jobDocQueue.setPriority(id, currentPriority - priority);

      undoSyncPriority?.();
    };
  }

  private _connectDoc(doc: YDoc) {
    if (this.status.docs.has(doc.guid)) {
      console.error('❌ [DocFrontend._connectDoc] 文档已连接，抛出错误');
      throw new Error('文档已连接');
    }

    this.schedule({
      type: 'load',
      docId: doc.guid,
    });

    this.status.docs.set(doc.guid, doc);
    this.statusUpdatedSubject$.next(doc.guid);

    doc.on('update', this.handleDocUpdate);

    doc.on('destroy', () => {
      this.disconnectDoc(doc);
    });

  }

  private schedule(job: Job) {
    const priority = this.prioritySettings.get(job.docId) ?? 0;
    this.status.jobDocQueue.push(job.docId, priority);

    const existingJobs = this.status.jobMap.get(job.docId) ?? [];
    existingJobs.push(job);
    this.status.jobMap.set(job.docId, existingJobs);

    this.statusUpdatedSubject$.next(job.docId);
  }

  private isApplyingUpdate = false;

  applyUpdate(docId: string, update: Uint8Array) {
    const doc = this.status.docs.get(docId);
    if (doc && !isEmptyUpdate(update)) {
      // 数据验证和详细日志
      const firstBytes = Array.from(update.slice(0, 10))
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      
      const isEmpty = update.byteLength === 0 || 
        (update.byteLength === 2 && update[0] === 0 && update[1] === 0);
      
      // Y.js 更新数据通常以 0x00 或 0x01 开始
      const looksLikeYjsUpdate = update[0] === 0x00 || update[0] === 0x01;
      
      console.log('[isEmptyUpdate] Y.js二进制数据检查:', {
        byteLength: update.byteLength,
        isEmpty,
        firstBytes,
        isEmptyPattern: isEmpty,
        looksLikeYjsUpdate
      });
      
      // 如果数据看起来不像 Y.js 更新，记录警告
      if (!looksLikeYjsUpdate) {
        console.warn('⚠️ [applyUpdate] 数据格式可能不正确，不是标准的 Y.js 更新格式', {
          docId,
          firstByte: update[0],
          expectedFirstByte: '0x00 或 0x01',
          dataPreview: firstBytes
        });
      }
      
      try {
        this.isApplyingUpdate = true;
        applyUpdate(doc, update, NBSTORE_ORIGIN);
      } catch (err: any) {
        console.error('failed to apply update yjs doc', err);
        console.error('❌ [applyUpdate] 详细错误信息:', {
          docId,
          errorMessage: err?.message || String(err),
          errorName: err?.name || 'Unknown',
          updateSize: update.byteLength,
          firstBytes,
          updatePreview: Array.from(update.slice(0, 50))
        });
        
        // 如果是 "Integer out of Range" 错误，提供更多帮助信息
        const errorMessage = err?.message || String(err);
        if (errorMessage.includes('Integer out of Range')) {
          console.error('💡 可能的原因:');
          console.error('  1. 后端返回的数据不是有效的 Y.js 二进制格式');
          console.error('  2. 数据在传输过程中被损坏');
          console.error('  3. 前后端 Y.js 版本不一致');
          console.error('  4. 数据库中存储的数据格式错误');
          console.error('建议: 检查后端返回的数据格式，确保是 Y.js encodeStateAsUpdate 生成的二进制数据');
        }
      } finally {
        this.isApplyingUpdate = false;
      }
    }
  }

  private readonly handleDocUpdate = (
    update: Uint8Array,
    origin: any,
    doc: YDoc,
    _transaction: YTransaction
  ) => {
    if (origin === NBSTORE_ORIGIN) {
      return;
    }

    if (this.isApplyingUpdate && BUILD_CONFIG.debug) {
      // 获取变更的路径列表（用于调试）
      const changedKeys = Array.from(doc.share.keys());
      const changedList = changedKeys.join(', ') || '(empty)';
      
      console.warn(`⚠️ When nbstore applies a remote update, some code triggers a local change to the doc.
This will causes the document's 'edited by' to become the current user, even if the user has not actually modified the document.
This is usually caused by a coding error and needs to be fixed by the developer.
Changed:
${changedList}
`);
    }

    if (!this.status.docs.has(doc.guid)) {
      console.warn('⚠️ [DocFrontend.handleDocUpdate] 文档不在 docs 中，跳过:', {
        docId: doc.guid,
        docsSize: this.status.docs.size
      });
      return;
    }

    this.schedule({
      type: 'save',
      docId: doc.guid,
      update,
    });
  };

  protected mergeUpdates(updates: Uint8Array[]) {
    const merge = this.options?.mergeUpdates ?? mergeUpdates;
    return merge(updates.filter(bin => !isEmptyUpdate(bin)));
  }

  async waitForUpdated(docId?: string, abort?: AbortSignal) {
    const source$: Observable<DocFrontendDocState | DocFrontendState> = docId
      ? this._docState$(docId)
      : this._state$;
    await lastValueFrom(
      source$.pipe(
        filter(status => !status.updating),
        takeUntilAbort(abort),
        first()
      )
    );
    return;
  }

  async waitForDocLoaded(docId: string, abort?: AbortSignal) {
    await lastValueFrom(
      this._docState$(docId).pipe(
        filter(state => state.loaded),
        takeUntilAbort(abort),
        first()
      )
    );
  }

  async waitForSynced(docId?: string, abort?: AbortSignal) {
    await this.waitForUpdated(docId, abort);
    await this.sync.waitForSynced(docId, abort);
  }

  async waitForDocReady(docId: string, abort?: AbortSignal) {
    await lastValueFrom(
      this._docState$(docId).pipe(
        filter(state => state.ready),
        takeUntilAbort(abort),
        first()
      )
    );
  }

  async resetSync() {
    await this.sync.resetSync();
  }
}
