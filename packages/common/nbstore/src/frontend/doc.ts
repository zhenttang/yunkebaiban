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

  // NEW-1 修复：页面关闭/隐藏时的事件处理器引用
  private _handleVisibilityChange: (() => void) | null = null;
  private _handleBeforeUnload: (() => void) | null = null;

  start() {
    if (this.abort.signal.aborted) {
      throw new Error('doc frontend can only start once');
    }
    this.mainLoop(this.abort.signal).catch(error => {
      console.error(error);
    });
    // NEW-1 修复：注册页面关闭/隐藏时的 flush 监听
    this._registerPageLifecycleListeners();
  }

  stop() {
    // NEW-1 修复：注销页面生命周期监听
    this._unregisterPageLifecycleListeners();
    this.abort.abort(MANUALLY_STOP);
  }

  /**
   * NEW-1 修复：立即 flush 所有 pending updates 到存储
   *
   * 当页面隐藏（visibilitychange）或即将关闭（beforeunload）时调用，
   * 确保 100ms 防抖窗口内尚未保存的编辑数据不会丢失。
   */
  flushAllPendingUpdates() {
    for (const [docGuid, updates] of this.pendingUpdates.entries()) {
      if (!updates || updates.length === 0) continue;

      // 取消该文档的防抖定时器
      const timer = this.saveTimers.get(docGuid);
      if (timer) {
        clearTimeout(timer);
        this.saveTimers.delete(docGuid);
      }

      // 合并并调度保存
      const mergedUpdate = this.mergeUpdates(updates);
      this.pendingUpdates.delete(docGuid);

      this.schedule({
        type: 'save',
        docId: docGuid,
        update: mergedUpdate,
      });
    }
  }

  private _registerPageLifecycleListeners() {
    if (typeof document === 'undefined') return;

    this._handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        this.flushAllPendingUpdates();
      }
    };

    this._handleBeforeUnload = () => {
      this.flushAllPendingUpdates();
    };

    document.addEventListener('visibilitychange', this._handleVisibilityChange);
    window.addEventListener('beforeunload', this._handleBeforeUnload);
  }

  private _unregisterPageLifecycleListeners() {
    if (typeof document === 'undefined') return;

    if (this._handleVisibilityChange) {
      document.removeEventListener('visibilitychange', this._handleVisibilityChange);
      this._handleVisibilityChange = null;
    }
    if (this._handleBeforeUnload) {
      window.removeEventListener('beforeunload', this._handleBeforeUnload);
      this._handleBeforeUnload = null;
    }
  }

  private async mainLoop(signal?: AbortSignal) {
    // console.log('[DocFrontend Debug] mainLoop 开始');

    // console.log('[DocFrontend Debug] 等待 storage 连接（第一次）...');
    await this.storage.connection.waitForConnected(signal);
    // console.log('[DocFrontend Debug] storage 连接成功（第一次）');

    const dispose = this.storage.subscribeDocUpdate((record, origin) => {
      this.event.onStorageUpdate(record, origin);
    });

    try {
      // console.log('[DocFrontend Debug] 等待 storage 连接（第二次）...');
      // wait for storage to connect
      await Promise.race([
        this.storage.connection.waitForConnected(signal),
        new Promise((_, reject) => {
          if (!signal) return;
          if (signal.aborted) {
            reject(signal.reason ?? MANUALLY_STOP);
            return;
          }
          signal.addEventListener(
            'abort',
            () => {
              reject(signal.reason ?? MANUALLY_STOP);
            },
            { once: true }
          );
        }),
      ]);
      // console.log('[DocFrontend Debug] storage 连接成功（第二次），开始主循环');


      while (true) {
        throwIfAborted(signal);

        // console.log('[DocFrontend Debug] 等待队列中的下一个文档...');
        const docId = await this.status.jobDocQueue.asyncPop(signal);
        // console.log('[DocFrontend Debug] 从队列获取文档:', { docId });

        const jobs = this.status.jobMap.get(docId);
        this.status.jobMap.delete(docId);

        if (!jobs) {
          // console.warn('⚠️ [DocFrontend.mainLoop] 作业列表为空，跳过:', {
          //   docId
          // });
          this.statusUpdatedSubject$.next(docId);
          continue;
        }

        // console.log('[DocFrontend Debug] 开始处理文档作业:', {
        //   docId,
        //   jobsCount: jobs.length,
        //   jobTypes: jobs.map(j => j.type)
        // });

        this.status.currentJob = { docId, jobs };
        this.statusUpdatedSubject$.next(docId);

        const { apply, load, save } = groupBy(jobs, job => job.type) as {
          [key in Job['type']]?: Job[];
        };

        if (load?.length) {
          // console.log('[DocFrontend Debug] 执行 load 作业...');
          await this.jobs.load(load[0] as any, signal);
          // console.log('[DocFrontend Debug] load 作业完成');
        }

        if (apply?.length) {
          // console.log('[DocFrontend Debug] 执行 apply 作业...', { count: apply.length });
          for (const applyJob of apply) {
            await this.jobs.apply(applyJob as any, signal);
          }
          // console.log('[DocFrontend Debug] apply 作业完成');
        }

        if (save?.length) {
          // console.log('[DocFrontend Debug] 执行 save 作业...', { count: save.length });
          await this.jobs.save(docId, save as any, signal);
          // console.log('[DocFrontend Debug] save 作业完成');
        }

        // console.log('[DocFrontend Debug] 文档作业全部完成:', { docId });
        this.status.currentJob = null;
        this.statusUpdatedSubject$.next(docId);
      }
    } catch (error) {
      if (signal?.aborted) {
        // 正常停止时不输出错误日志
        return;
      }
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
      // console.log('[DocFrontend.load] 开始加载文档:', { docId: job.docId });
      
      const doc = this.status.docs.get(job.docId);
      if (!doc) {
        // console.warn('[DocFrontend.load] 文档不在 docs Map 中，跳过');
        return;
      }
      
      const existingData = encodeStateAsUpdate(doc);
      // console.log('[DocFrontend.load] 编码当前文档状态:', {
      //   docId: job.docId,
      //   existingDataSize: existingData.byteLength,
      //   isEmpty: isEmptyUpdate(existingData)
      // });

      if (!isEmptyUpdate(existingData)) {
        // console.log('[DocFrontend.load] 当前文档有数据，调度 save 作业');
        this.schedule({
          type: 'save',
          docId: doc.guid,
          update: existingData,
        });
      }

      // mark doc as loaded
      doc.emit('sync', [true, doc]);
      // console.log('[DocFrontend.load] 触发文档 sync 事件');

      // console.log('[DocFrontend.load] 从 storage 读取文档数据...');
      const docRecord = await this.storage.getDoc(job.docId);
      // console.log('[DocFrontend.load] storage.getDoc 完成:', {
      //   hasRecord: !!docRecord,
      //   binSize: docRecord?.bin?.length || 0
      // });
      
      throwIfAborted(signal);

      if (docRecord && !isEmptyUpdate(docRecord.bin)) {
        // console.log('[DocFrontend.load] 应用文档更新...');
        this.applyUpdate(job.docId, docRecord.bin);
        this.status.readyDocs.add(job.docId);
        // console.log('[DocFrontend.load] 文档标记为 ready（有数据）');
      } else {
        // console.warn('⚠️ [DocFrontend.load] 文档数据为空，但仍标记为ready以允许初始化:', {
        //   docId: job.docId,
        //   hasDocRecord: !!docRecord,
        //   binSize: docRecord?.bin?.length || 0,
        //   reason: !docRecord ? 'no-doc-record' : 'empty-update'
        // });
        // 即使文档为空，也标记为 ready，允许应用层初始化默认内容
        this.status.readyDocs.add(job.docId);
        // console.log('[DocFrontend.load] 空文档标记为 ready（允许初始化）');
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
        console.log('💾 [DocFrontend.save] 开始保存文档:', {
          docId,
          jobsCount: jobs.length
        });
        
        const updatesList = jobs.map(j => j.update).filter(update => !isEmptyUpdate(update));

        const merged = await this.mergeUpdates(updatesList);


        throwIfAborted(signal);

        try {
          console.log('💾 [DocFrontend.save] 推送到存储...', {
            docId,
            mergedSize: merged.length
          });
          
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
        console.error('❌ [DocFrontend.save] 保存跳过 - 文档不在 connectedDocs 中:', {
          docId,
          docsSize: this.status.docs.size,
          connectedDocsSize: this.status.connectedDocs.size,
          allConnectedDocs: Array.from(this.status.connectedDocs),
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
    // 🔧 立即保存 pending 的 updates，防止数据丢失
    const timer = this.saveTimers.get(doc.guid);
    if (timer) {
      clearTimeout(timer);
      this.saveTimers.delete(doc.guid);
    }

    const pendingUpdates = this.pendingUpdates.get(doc.guid);
    if (pendingUpdates && pendingUpdates.length > 0) {
      console.log('💾 [DocFrontend.disconnectDoc] 文档关闭，立即保存 pending updates', {
        docGuid: doc.guid,
        updateCount: pendingUpdates.length
      });

      const mergedUpdate = this.mergeUpdates(pendingUpdates);
      this.pendingUpdates.delete(doc.guid);

      this.schedule({
        type: 'save',
        docId: doc.guid,
        update: mergedUpdate,
      });
    }

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

  // 🔧 修复数据丢失：改用延迟合并机制，累积 100ms 内的 update 后批量保存
  private readonly pendingUpdates = new Map<string, Uint8Array[]>();
  private readonly saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private static readonly SAVE_DEBOUNCE_MS = 100; // 100ms 延迟合并

  applyUpdate(docId: string, update: Uint8Array) {
    const doc = this.status.docs.get(docId);
    if (doc && !isEmptyUpdate(update)) {
      // 数据验证和详细日志
      // const firstBytes = Array.from(update.slice(0, 10))
      //   .map(b => b.toString(16).padStart(2, '0'))
      //   .join(' ');
      
      const isEmpty = update.byteLength === 0 || 
        (update.byteLength === 2 && update[0] === 0 && update[1] === 0);
      
      // Y.js 更新数据通常以 0x00 或 0x01 开始
      // const looksLikeYjsUpdate = update[0] === 0x00 || update[0] === 0x01;
      
      // console.log('[isEmptyUpdate] Y.js二进制数据检查:', {
      //   byteLength: update.byteLength,
      //   isEmpty,
      //   firstBytes,
      //   isEmptyPattern: isEmpty,
      //   looksLikeYjsUpdate
      // });
      
      // 如果数据看起来不像 Y.js 更新，记录警告
      // if (!looksLikeYjsUpdate) {
      //   console.warn('⚠️ [applyUpdate] 数据格式可能不正确，不是标准的 Y.js 更新格式', {
      //     docId,
      //     firstByte: update[0],
      //     expectedFirstByte: '0x00 或 0x01',
      //     dataPreview: firstBytes
      //   });
      // }
      
      try {
        this.isApplyingUpdate = true;
        applyUpdate(doc, update, NBSTORE_ORIGIN);
      } catch (err: any) {
        console.error('failed to apply update yjs doc', err);
        const firstBytes = Array.from(update.slice(0, 10))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ');
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

    console.log('📤 [DocFrontend.handleDocUpdate] 收到更新:', {
      docGuid: doc.guid,
      updateSize: update.length,
      origin,
      inDocs: this.status.docs.has(doc.guid),
      inConnectedDocs: this.status.connectedDocs.has(doc.guid),
      docsCount: this.status.docs.size,
      connectedDocsCount: this.status.connectedDocs.size
    });

    if (!this.status.docs.has(doc.guid)) {
      console.error('❌ [DocFrontend.handleDocUpdate] 文档不在 docs 中，跳过保存！', {
        docId: doc.guid,
        docsSize: this.status.docs.size,
        allDocsKeys: Array.from(this.status.docs.keys())
      });
      return;
    }

    // 🔧 修复数据丢失：累积 update 到队列，延迟合并后保存
    const existingUpdates = this.pendingUpdates.get(doc.guid) || [];
    existingUpdates.push(update);
    this.pendingUpdates.set(doc.guid, existingUpdates);

    console.log('📥 [DocFrontend.handleDocUpdate] 累积更新到队列', {
      docGuid: doc.guid,
      updateSize: update.length,
      queueLength: existingUpdates.length
    });

    // 清除之前的定时器
    const existingTimer = this.saveTimers.get(doc.guid);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // 设置新的定时器：100ms 后合并并保存
    const timer = setTimeout(() => {
      const updates = this.pendingUpdates.get(doc.guid);
      if (!updates || updates.length === 0) {
        return;
      }

      console.log('🔄 [DocFrontend.handleDocUpdate] 合并并保存累积的更新', {
        docGuid: doc.guid,
        updateCount: updates.length,
        totalSize: updates.reduce((sum, u) => sum + u.length, 0)
      });

      // 合并所有 update
      const mergedUpdate = this.mergeUpdates(updates);

      // 清空队列
      this.pendingUpdates.delete(doc.guid);
      this.saveTimers.delete(doc.guid);

      // 调度保存
      this.schedule({
        type: 'save',
        docId: doc.guid,
        update: mergedUpdate,
      });
    }, DocFrontend.SAVE_DEBOUNCE_MS);

    this.saveTimers.set(doc.guid, timer);
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
