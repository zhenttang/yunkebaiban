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
            
        console.log('📊 [DocFrontend] 文档状态更新:', {
          docId: docId,
          ready: readyStatus,
          loaded: loadedStatus,
          updating: updatingStatus,
          readyDocsCount: this.status.readyDocs.size,
          connectedDocsCount: this.status.connectedDocs.size,
          timestamp: new Date().toISOString()
        });
        
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
    console.log('🚀 [DocFrontend.mainLoop] 主循环启动:', {
      timestamp: new Date().toISOString()
    });

    await this.storage.connection.waitForConnected(signal);

    console.log('✅ [DocFrontend.mainLoop] Storage 连接成功，订阅更新事件');

    const dispose = this.storage.subscribeDocUpdate((record, origin) => {
      console.log('📨 [DocFrontend.mainLoop] 收到 storage 更新事件:', {
        docId: record.docId,
        binSize: record.bin?.length,
        origin: origin,
        timestamp: new Date().toISOString()
      });
      this.event.onStorageUpdate(record, origin);
    });

    try {
      console.log('⏳ [DocFrontend.mainLoop] 等待 storage 连接...');

      // wait for storage to connect
      await Promise.race([
        this.storage.connection.waitForConnected(signal),
        new Promise((_, reject) => {
          signal?.addEventListener('abort', reason => {
            reject(reason);
          });
        }),
      ]);

      console.log('✅ [DocFrontend.mainLoop] Storage 连接就绪，开始处理作业队列');

      while (true) {
        throwIfAborted(signal);

        console.log('⏳ [DocFrontend.mainLoop] 等待下一个作业...');

        const docId = await this.status.jobDocQueue.asyncPop(signal);

        console.log('📋 [DocFrontend.mainLoop] 从队列取出作业:', {
          docId,
          timestamp: new Date().toISOString()
        });

        const jobs = this.status.jobMap.get(docId);
        this.status.jobMap.delete(docId);

        if (!jobs) {
          console.warn('⚠️ [DocFrontend.mainLoop] 作业列表为空，跳过:', {
            docId
          });
          this.statusUpdatedSubject$.next(docId);
          continue;
        }

        console.log('🔄 [DocFrontend.mainLoop] 开始处理作业:', {
          docId,
          jobsCount: jobs.length,
          jobTypes: jobs.map(j => j.type).join(', ')
        });

        this.status.currentJob = { docId, jobs };
        this.statusUpdatedSubject$.next(docId);

        const { apply, load, save } = groupBy(jobs, job => job.type) as {
          [key in Job['type']]?: Job[];
        };

        if (load?.length) {
          console.log('📥 [DocFrontend.mainLoop] 执行 load 作业:', {
            docId,
            loadJobsCount: load.length
          });
          await this.jobs.load(load[0] as any, signal);
        }

        if (apply?.length) {
          console.log('🔄 [DocFrontend.mainLoop] 执行 apply 作业:', {
            docId,
            applyJobsCount: apply.length
          });
        }

        for (const applyJob of apply ?? []) {
          await this.jobs.apply(applyJob as any, signal);
        }

        if (save?.length) {
          console.log('💾 [DocFrontend.mainLoop] 执行 save 作业:', {
            docId,
            saveJobsCount: save.length
          });
          await this.jobs.save(docId, save as any, signal);
        }

        console.log('✅ [DocFrontend.mainLoop] 作业处理完成:', {
          docId
        });

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
      console.log('🛑 [DocFrontend.mainLoop] 主循环结束，清理订阅');
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

      console.log('📞 [DocFrontend] 准备调用storage.getDoc:', {
        docId: job.docId,
        storageType: this.storage.constructor.name,
        storageIdentifier: (this.storage as any).constructor.identifier || 'unknown',
        hasGetDocMethod: typeof this.storage.getDoc === 'function',
        storageInstance: !!this.storage
      });

      const docRecord = await this.storage.getDoc(job.docId);
      throwIfAborted(signal);

      console.log('🔍 [DocFrontend] 文档加载检查:', {
        docId: job.docId,
        hasDocRecord: !!docRecord,
        binSize: docRecord?.bin?.length || 0,
        isEmptyUpdate: docRecord ? isEmptyUpdate(docRecord.bin) : 'no-record',
        storageType: this.storage.constructor.name,
        storageIdentifier: (this.storage as any).constructor.identifier || 'unknown',
        timestamp: new Date().toISOString()
      });

      if (docRecord && !isEmptyUpdate(docRecord.bin)) {
        console.log('✅ [DocFrontend.load] 文档数据有效，应用更新并标记为ready:', {
          docId: job.docId,
          binSize: docRecord.bin.length,
          binHex: Array.from(docRecord.bin.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' ')
        });
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

      console.log('🎯 [DocFrontend.load] 关键：将文档添加到 connectedDocs:', {
        docId: job.docId,
        beforeSize: this.status.connectedDocs.size,
        beforeList: Array.from(this.status.connectedDocs)
      });

      this.status.connectedDocs.add(job.docId);

      console.log('✅ [DocFrontend.load] load 作业完成，connectedDocs 已更新:', {
        docId: job.docId,
        afterSize: this.status.connectedDocs.size,
        afterList: Array.from(this.status.connectedDocs),
        isNowInConnectedDocs: this.status.connectedDocs.has(job.docId)
      });

      this.statusUpdatedSubject$.next(job.docId);
    },
    save: async (
      docId: string,
      jobs: (Job & { type: 'save' })[],
      signal?: AbortSignal
    ) => {
      console.log('💾 [DocFrontend.save] 保存作业开始:', {
        docId,
        jobsCount: jobs.length,
        totalUpdatesSize: jobs.reduce((sum, j) => sum + j.update.length, 0),
        timestamp: new Date().toISOString()
      });

      if (!this.status.docs.has(docId)) {
        console.warn('⚠️ [DocFrontend.save] 保存跳过 - 文档不在 docs 集合中:', {
          docId,
          docsSize: this.status.docs.size,
          docsList: Array.from(this.status.docs)
        });
        return;
      }

      console.log('✅ [DocFrontend.save] 文档在 docs 集合中，检查 connectedDocs:', {
        docId,
        isInConnectedDocs: this.status.connectedDocs.has(docId),
        connectedDocsSize: this.status.connectedDocs.size,
        connectedDocsList: Array.from(this.status.connectedDocs)
      });

      if (this.status.connectedDocs.has(docId)) {
        const updatesList = jobs.map(j => j.update).filter(update => !isEmptyUpdate(update));
        console.log('🔄 [DocFrontend.save] 合并更新中:', {
          docId,
          updatesCount: updatesList.length,
          totalSize: updatesList.reduce((sum, u) => sum + u.length, 0)
        });

        const merged = await this.mergeUpdates(updatesList);

        console.log('🔄 [DocFrontend.save] 合并完成，准备推送到存储:', {
          docId,
          mergedSize: merged.length,
          isEmpty: isEmptyUpdate(merged),
          storageType: this.storage?.constructor?.name || 'unknown'
        });

        throwIfAborted(signal);

        try {
          await this.storage.pushDocUpdate(
            {
              docId,
              bin: merged,
            },
            this.uniqueId
          );
          console.log('✅ [DocFrontend.save] 推送到存储成功:', {
            docId,
            dataSize: merged.length
          });
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
      console.log('🔄 [DocFrontend.jobs.apply] Apply 作业开始:', {
        docId: job.docId,
        updateSize: job.update.length,
        timestamp: new Date().toISOString()
      });

      throwIfAborted(signal);

      if (!this.status.docs.has(job.docId)) {
        console.warn('⚠️ [DocFrontend.jobs.apply] 文档不在 docs 中，跳过:', {
          docId: job.docId
        });
        return;
      }

      console.log('🔍 [DocFrontend.jobs.apply] 检查 connectedDocs:', {
        docId: job.docId,
        isInConnectedDocs: this.status.connectedDocs.has(job.docId)
      });

      if (this.status.connectedDocs.has(job.docId)) {
        console.log('✅ [DocFrontend.jobs.apply] 应用更新到 YJS 文档');
        this.applyUpdate(job.docId, job.update);
      } else {
        console.warn('⚠️ [DocFrontend.jobs.apply] 文档不在 connectedDocs 中，跳过应用');
      }

      if (!isEmptyUpdate(job.update)) {
        console.log('✅ [DocFrontend.jobs.apply] 标记文档为 ready');
        this.status.readyDocs.add(job.docId);
        this.statusUpdatedSubject$.next(job.docId);
      }

      console.log('✅ [DocFrontend.jobs.apply] Apply 作业完成');
    },
  };

  event = {
    onStorageUpdate: (update: DocRecord, origin?: string) => {
      console.log('📨 [DocFrontend.event.onStorageUpdate] 收到存储更新事件:', {
        docId: update.docId,
        binSize: update.bin?.length,
        origin: origin,
        uniqueId: this.uniqueId,
        timestamp: new Date().toISOString()
      });

      if (origin !== this.uniqueId) {
        console.log('✅ [DocFrontend.event.onStorageUpdate] 创建 apply 作业');
        this.schedule({
          type: 'apply',
          docId: update.docId,
          update: update.bin,
        });
      } else {
        console.log('⚠️ [DocFrontend.event.onStorageUpdate] 更新来自自己，跳过');
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
    console.log('🔗 [DocFrontend._connectDoc] 连接文档:', {
      docId: doc.guid,
      alreadyConnected: this.status.docs.has(doc.guid),
      timestamp: new Date().toISOString()
    });

    if (this.status.docs.has(doc.guid)) {
      console.error('❌ [DocFrontend._connectDoc] 文档已连接，抛出错误');
      throw new Error('文档已连接');
    }

    console.log('📋 [DocFrontend._connectDoc] 创建 load 作业');
    this.schedule({
      type: 'load',
      docId: doc.guid,
    });

    console.log('✅ [DocFrontend._connectDoc] 将文档添加到 docs 集合');
    this.status.docs.set(doc.guid, doc);
    this.statusUpdatedSubject$.next(doc.guid);

    console.log('👂 [DocFrontend._connectDoc] 注册 update 事件监听器');
    doc.on('update', this.handleDocUpdate);

    console.log('👂 [DocFrontend._connectDoc] 注册 destroy 事件监听器');
    doc.on('destroy', () => {
      console.log('🗑️ [DocFrontend._connectDoc] 文档被销毁，断开连接:', {
        docId: doc.guid
      });
      this.disconnectDoc(doc);
    });

    console.log('✅ [DocFrontend._connectDoc] 文档连接完成');
  }

  private schedule(job: Job) {
    console.log('📋 [DocFrontend.schedule] 调度作业:', {
      jobType: job.type,
      docId: job.docId,
      updateSize: job.type === 'save' || job.type === 'apply' ? job.update.length : undefined,
      timestamp: new Date().toISOString()
    });

    const priority = this.prioritySettings.get(job.docId) ?? 0;
    this.status.jobDocQueue.push(job.docId, priority);

    const existingJobs = this.status.jobMap.get(job.docId) ?? [];
    existingJobs.push(job);
    this.status.jobMap.set(job.docId, existingJobs);

    console.log('📋 [DocFrontend.schedule] 作业已加入队列:', {
      jobType: job.type,
      docId: job.docId,
      queuedJobsCount: existingJobs.length,
      priority: priority
    });

    this.statusUpdatedSubject$.next(job.docId);
  }

  private isApplyingUpdate = false;

  applyUpdate(docId: string, update: Uint8Array) {
    const doc = this.status.docs.get(docId);
    if (doc && !isEmptyUpdate(update)) {
      try {
        this.isApplyingUpdate = true;
        applyUpdate(doc, update, NBSTORE_ORIGIN);
      } catch (err) {
        console.error('failed to apply update yjs doc', err);
      } finally {
        this.isApplyingUpdate = false;
      }
    }
  }

  private readonly handleDocUpdate = (
    update: Uint8Array,
    origin: any,
    doc: YDoc,
    transaction: YTransaction
  ) => {
    console.log('📝 [DocFrontend.handleDocUpdate] YJS 文档更新事件:', {
      docId: doc.guid,
      updateSize: update.length,
      origin: origin,
      isNBStoreOrigin: origin === NBSTORE_ORIGIN,
      isApplyingUpdate: this.isApplyingUpdate,
      timestamp: new Date().toISOString()
    });

    if (origin === NBSTORE_ORIGIN) {
      console.log('⚠️ [DocFrontend.handleDocUpdate] 来自 NBStore 的更新，跳过:', {
        docId: doc.guid
      });
      return;
    }

    if (this.isApplyingUpdate && BUILD_CONFIG.debug) {
      let changedList = '';
      for (const [changed, keys] of transaction.changed) {
        for (const key of keys) {
          if (changed instanceof YMap && key) {
            changedList += `${key} => ${changed.get(key)}\n`;
          }
        }
      }
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

    console.log('✅ [DocFrontend.handleDocUpdate] 创建 save 作业:', {
      docId: doc.guid,
      updateSize: update.length
    });

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
