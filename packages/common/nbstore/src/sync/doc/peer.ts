import { remove } from 'lodash-es';
import { nanoid } from 'nanoid';
import { Observable, ReplaySubject, share, Subject } from 'rxjs';

import type { DocStorage, DocSyncStorage } from '../../storage';
import { AsyncPriorityQueue } from '../../utils/async-priority-queue';
import { ClockMap } from '../../utils/clock';
import { isEmptyUpdate } from '../../utils/is-empty-update';
import { throwIfAborted } from '../../utils/throw-if-aborted';

type Job =
  | {
      type: 'connect';
      docId: string;
    }
  | {
      type: 'push';
      docId: string;
      update?: Uint8Array;
      clock: Date;
    }
  | {
      type: 'pull';
      docId: string;
    }
  | {
      type: 'pullAndPush';
      docId: string;
    }
  | {
      type: 'save';
      docId: string;
      update?: Uint8Array;
      remoteClock: Date;
    };

interface Status {
  docs: Set<string>;
  connectedDocs: Set<string>;
  jobDocQueue: AsyncPriorityQueue;
  jobMap: Map<string, Job[]>;
  remoteClocks: ClockMap;
  syncing: boolean;
  retrying: boolean;
  skipped: boolean;
  errorMessage: string | null;
}

interface PeerState {
  total: number;
  syncing: number;
  retrying: boolean;
  synced: boolean;
  errorMessage: string | null;
}

interface PeerDocState {
  syncing: boolean;
  synced: boolean;
  retrying: boolean;
  errorMessage: string | null;
}

interface DocSyncPeerOptions {
  mergeUpdates?: (updates: Uint8Array[]) => Promise<Uint8Array> | Uint8Array;
}

function createJobErrorCatcher<
  Jobs extends Record<string, (docId: string, ...args: any[]) => Promise<void>>,
>(jobs: Jobs): Jobs {
  return Object.fromEntries(
    Object.entries(jobs).map(([k, fn]) => {
      return [
        k,
        async (docId, ...args) => {
          try {
            await fn(docId, ...args);
          } catch (err) {
            if (err instanceof Error) {
              throw new Error(
                `Error in job "${k}": ${err.stack || err.message}`
              );
            } else {
              throw err;
            }
          }
        },
      ];
    })
  ) as Jobs;
}

function isEqualUint8Arrays(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

/**
 *
 * @param local - 本地文档数据
 * @param localSv - 本地文档状态向量
 * @param remoteDiff - 远程文档数据与本地文档状态向量的差异,
 * 应该通过 `Y.diffUpdate(remoteDocData, localSv)` 计算
 * @param remoteSv - 远程文档状态向量
 * @returns 如果没有差异返回null，否则返回差异数据
 */
async function docDiffUpdate(
  local: Uint8Array,
  localSv: Uint8Array,
  remoteDiff: Uint8Array,
  remoteSv: Uint8Array
) {
  // 动态导入 yjs，避免 Worker 初始化时加载
  const { diffUpdate } = await import('yjs');

  // 如果localSv不等于remoteSv，返回差异数据
  if (!isEqualUint8Arrays(localSv, remoteSv)) {
    return diffUpdate(local, remoteSv);
  }

  // localDiff是本地文档的删除集
  const localDiff = diffUpdate(local, localSv);

  // 如果localDiff等于remoteDiff，返回null，表示没有差异
  if (isEqualUint8Arrays(localDiff, remoteDiff)) {
    return null;
  } else {
    // 否则，返回差异数据
    return diffUpdate(local, remoteSv);
  }
}

export class DocSyncPeer {
  /**
   * 用于在"update"事件中识别自己的随机唯一ID
   */
  private readonly uniqueId = `sync:${this.peerId}:${nanoid()}`;
  private readonly prioritySettings = new Map<string, number>();
  
  /**
   * 🔧 防重复调度：记录最近调度的作业时间戳
   * key: `${docId}:${jobType}`, value: timestamp
   */
  private readonly recentSchedules = new Map<string, number>();
  private readonly SCHEDULE_DEBOUNCE_MS = 100; // 100ms内不重复调度相同作业

  constructor(
    readonly peerId: string,
    readonly local: DocStorage,
    readonly syncMetadata: DocSyncStorage,
    readonly remote: DocStorage,
    readonly options: DocSyncPeerOptions = {}
  ) {}

  private status: Status = {
    docs: new Set<string>(),
    connectedDocs: new Set<string>(),
    jobDocQueue: new AsyncPriorityQueue(),
    jobMap: new Map(),
    remoteClocks: new ClockMap(new Map()),
    syncing: false,
    retrying: false,
    skipped: false,
    errorMessage: null,
  };
  private readonly statusUpdatedSubject$ = new Subject<string | true>();

  peerState$ = new Observable<PeerState>(subscribe => {
    const next = () => {
      if (this.status.skipped) {
        subscribe.next({
          total: 0,
          syncing: 0,
          synced: true,
          retrying: false,
          errorMessage: null,
        });
      } else if (!this.status.syncing) {
        // 如果syncing = false，jobMap为空
        subscribe.next({
          total: this.status.docs.size,
          syncing: this.status.docs.size,
          synced: false,
          retrying: this.status.retrying,
          errorMessage: this.status.errorMessage,
        });
      } else {
        const syncing = this.status.jobMap.size;
        subscribe.next({
          total: this.status.docs.size,
          syncing: syncing,
          retrying: this.status.retrying,
          errorMessage: this.status.errorMessage,
          synced: syncing === 0,
        });
      }
    };
    next();
    const dispose = this.statusUpdatedSubject$.subscribe(() => {
      next();
    });
    return () => {
      dispose.unsubscribe();
    };
  }).pipe(
    share({
      connector: () => new ReplaySubject(1),
    })
  );

  docState$(docId: string) {
    return new Observable<PeerDocState>(subscribe => {
      const next = () => {
        if (this.status.skipped) {
          subscribe.next({
            syncing: false,
            synced: true,
            retrying: false,
            errorMessage: null,
          });
        }
        subscribe.next({
          syncing:
            !this.status.connectedDocs.has(docId) ||
            this.status.jobMap.has(docId),
          synced: !this.status.jobMap.has(docId),
          retrying: this.status.retrying,
          errorMessage: this.status.errorMessage,
        });
      };
      next();
      return this.statusUpdatedSubject$.subscribe(updatedId => {
        if (updatedId === true || updatedId === docId) next();
      });
    });
  }

  private readonly jobs = createJobErrorCatcher({
    connect: async (docId: string, signal?: AbortSignal) => {
      console.log('🔗 [DocSyncPeer.connect] 连接作业开始:', {
        docId,
        peerId: this.peerId,
        timestamp: new Date().toISOString()
      });

      const pushedClock =
        (await this.syncMetadata.getPeerPushedClock(this.peerId, docId))
          ?.timestamp ?? null;
      const clock = await this.local.getDocTimestamp(docId);

      console.log('🔗 [DocSyncPeer.connect] 时钟状态:', {
        docId,
        localClock: clock?.timestamp,
        pushedClock: pushedClock,
        isRemoteReadonly: this.remote.isReadonly
      });

      throwIfAborted(signal);
      if (
        !this.remote.isReadonly &&
        clock &&
        (pushedClock === null ||
          pushedClock.getTime() < clock.timestamp.getTime())
      ) {
        console.log('🔗 [DocSyncPeer.connect] 执行 pullAndPush:', { docId });
        await this.jobs.pullAndPush(docId, signal);
      } else {
        // 无需推送
        const pulled =
          (await this.syncMetadata.getPeerPulledRemoteClock(this.peerId, docId))
            ?.timestamp ?? null;
        const remoteClock = this.status.remoteClocks.get(docId);

        console.log('🔗 [DocSyncPeer.connect] 检查是否需要 pull:', {
          docId,
          pulledClock: pulled,
          remoteClock: remoteClock,
          needPull: remoteClock && (pulled === null || pulled.getTime() < remoteClock.getTime())
        });

        if (
          remoteClock &&
          (pulled === null || pulled.getTime() < remoteClock.getTime())
        ) {
          console.log('🔗 [DocSyncPeer.connect] 执行 pull:', { docId });
          await this.jobs.pull(docId, signal);
        }
      }

      this.status.connectedDocs.add(docId);
      console.log('✅ [DocSyncPeer.connect] 连接成功，已添加到 connectedDocs:', {
        docId,
        connectedDocsSize: this.status.connectedDocs.size,
        connectedDocsList: Array.from(this.status.connectedDocs),
        peerId: this.peerId
      });
      this.statusUpdatedSubject$.next(docId);
    },
    push: async (
      docId: string,
      jobs: (Job & { type: 'push' })[],
      signal?: AbortSignal
    ) => {
      console.log('🔄 [DocSyncPeer.push] 推送作业开始:', {
        docId,
        jobsCount: jobs.length,
        isInConnectedDocs: this.status.connectedDocs.has(docId),
        connectedDocsSize: this.status.connectedDocs.size,
        connectedDocsList: Array.from(this.status.connectedDocs),
        isRemoteReadonly: this.remote.isReadonly,
        peerId: this.peerId
      });

      if (this.status.connectedDocs.has(docId) && !this.remote.isReadonly) {
        const maxClock = jobs.reduce(
          (a, b) => (a.getTime() > b.clock.getTime() ? a : b.clock),
          new Date(0)
        );

        const merged = await this.mergeUpdates(
          jobs
            .map(j => j.update ?? new Uint8Array())
            .filter(update => !isEmptyUpdate(update))
        );

        console.log('🔄 [DocSyncPeer.push] 合并更新完成:', {
          docId,
          mergedSize: merged.length,
          isEmpty: isEmptyUpdate(merged)
        });

        if (!isEmptyUpdate(merged)) {
          console.log('📤 [DocSyncPeer.push] 开始推送到远程存储:', {
            docId,
            dataSize: merged.length,
            peerId: this.peerId
          });

          try {
            // 添加超时控制：30秒超时
            const pushPromise = this.remote.pushDocUpdate(
              {
                docId,
                bin: merged,
              },
              this.uniqueId
            );
            
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Push timeout after 30s')), 30000);
            });
            
            const { timestamp } = await Promise.race([pushPromise, timeoutPromise]);

            console.log('✅ [DocSyncPeer.push] 远程推送成功:', {
              docId,
              timestamp,
              peerId: this.peerId
            });

            this.schedule({
              type: 'save',
              docId,
              remoteClock: timestamp,
            });
          } catch (error) {
            // 推送失败，记录错误但不中断整个同步流程
            console.error('❌ [DocSyncPeer.push] 推送失败，跳过此文档:', {
              docId,
              error: error instanceof Error ? error.message : String(error),
              peerId: this.peerId
            });
            
            // 不抛出错误，让同步继续其他文档
            // 但记录到状态中
            this.status.errorMessage = `Push failed for ${docId}: ${error instanceof Error ? error.message : String(error)}`;
          }
        }
        throwIfAborted(signal);
        await this.syncMetadata.setPeerPushedClock(this.peerId, {
          docId,
          timestamp: maxClock,
        });
      } else {
        console.warn('⚠️ [DocSyncPeer.push] 推送被跳过:', {
          docId,
          reason: !this.status.connectedDocs.has(docId) ?
            'docId不在connectedDocs中' :
            'remote存储为只读',
          connectedDocsSize: this.status.connectedDocs.size,
          connectedDocsList: Array.from(this.status.connectedDocs),
          isRemoteReadonly: this.remote.isReadonly,
          peerId: this.peerId
        });
      }
    },
    pullAndPush: async (docId: string, signal?: AbortSignal) => {
      // 动态导入 yjs，避免 Worker 初始化时加载
      const { encodeStateVectorFromUpdate } = await import('yjs');

      const localDocRecord = await this.local.getDoc(docId);

      const stateVector =
        localDocRecord && !isEmptyUpdate(localDocRecord.bin)
          ? encodeStateVectorFromUpdate(localDocRecord.bin)
          : new Uint8Array();
      const remoteDocRecord = await this.remote.getDocDiff(docId, stateVector);

      if (remoteDocRecord) {
        const {
          missing: newData,
          state: serverStateVector,
          timestamp: remoteClock,
        } = remoteDocRecord;
        throwIfAborted(signal);
        const { timestamp: localClock } = await this.local.pushDocUpdate(
          {
            bin: newData,
            docId,
          },
          this.uniqueId
        );
        throwIfAborted(signal);
        await this.syncMetadata.setPeerPulledRemoteClock(this.peerId, {
          docId,
          timestamp: remoteClock,
        });
        const diff =
          localDocRecord && serverStateVector && serverStateVector.length > 0
            ? await docDiffUpdate(
                localDocRecord.bin,
                stateVector,
                newData,
                serverStateVector
              )
            : localDocRecord?.bin;
        if (diff && !isEmptyUpdate(diff)) {
          throwIfAborted(signal);
          console.log('🔄 [同步] 准备推送文档差异更新:', {
            docId,
            peerId: this.peerId,
            diffSize: diff.length,
            uniqueId: this.uniqueId
          });
          const { timestamp: remoteClock } = await this.remote.pushDocUpdate(
            {
              bin: diff,
              docId,
            },
            this.uniqueId
          );
          console.log('✅ [同步] 差异更新推送成功:', {
            docId,
            remoteClock,
            peerId: this.peerId
          });
          this.schedule({
            type: 'save',
            docId,
            remoteClock,
          });
        }
        throwIfAborted(signal);
        this.schedule({
          type: 'push',
          docId,
          clock: localClock,
        });
      } else {
        if (localDocRecord) {
          if (!isEmptyUpdate(localDocRecord.bin)) {
            throwIfAborted(signal);
            const { timestamp: remoteClock } = await this.remote.pushDocUpdate(
              {
                bin: localDocRecord.bin,
                docId,
              },
              this.uniqueId
            );
            this.schedule({
              type: 'save',
              docId,
              remoteClock,
            });
          }
          this.schedule({
            type: 'push',
            docId,
            clock: localDocRecord.timestamp,
          });
          await this.syncMetadata.setPeerPushedClock(this.peerId, {
            docId,
            timestamp: localDocRecord.timestamp,
          });
        }
      }
    },
    pull: async (docId: string, signal?: AbortSignal) => {
      // 动态导入 yjs，避免 Worker 初始化时加载
      const { encodeStateVectorFromUpdate } = await import('yjs');

      const docRecord = await this.local.getDoc(docId);

      const stateVector =
        docRecord && !isEmptyUpdate(docRecord.bin)
          ? encodeStateVectorFromUpdate(docRecord.bin)
          : new Uint8Array();
      const serverDoc = await this.remote.getDocDiff(docId, stateVector);
      if (!serverDoc) {
        return;
      }
      const { missing: newData, timestamp: remoteClock } = serverDoc;
      throwIfAborted(signal);
      const { timestamp } = await this.local.pushDocUpdate(
        {
          docId,
          bin: newData,
        },
        this.uniqueId
      );
      throwIfAborted(signal);
      await this.syncMetadata.setPeerPulledRemoteClock(this.peerId, {
        docId,
        timestamp: remoteClock,
      });
      this.schedule({
        type: 'push',
        docId,
        clock: timestamp,
      });
    },
    save: async (
      docId: string,
      jobs: (Job & { type: 'save' })[],
      signal?: AbortSignal
    ) => {
      const remoteClock = jobs.reduce(
        (a, b) => (a.getTime() > b.remoteClock.getTime() ? a : b.remoteClock),
        new Date(0)
      );
      if (this.status.connectedDocs.has(docId)) {
        const data = jobs
          .map(j => j.update)
          .filter((update): update is Uint8Array =>
            update ? !isEmptyUpdate(update) : false
          );
        const update =
          data.length > 0 ? await this.mergeUpdates(data) : new Uint8Array();

        throwIfAborted(signal);
        if (!isEmptyUpdate(update)) {
          const { timestamp } = await this.local.pushDocUpdate(
            {
              docId,
              bin: update,
            },
            this.uniqueId
          );

          // 安排推送作业以将时间戳标记为已推送时间戳
          this.schedule({
            type: 'push',
            docId,
            clock: timestamp,
          });
        }
        throwIfAborted(signal);

        await this.syncMetadata.setPeerPulledRemoteClock(this.peerId, {
          docId,
          timestamp: remoteClock,
        });
      }
    },
  });

  private readonly actions = {
    updateRemoteClock: (docId: string, remoteClock: Date) => {
      console.log('⏰ [DocSyncPeer.actions.updateRemoteClock] 更新远程时钟:', {
        docId,
        remoteClock,
        peerId: this.peerId
      });
      this.status.remoteClocks.setIfBigger(docId, remoteClock);
      this.statusUpdatedSubject$.next(docId);
    },
    addDoc: (docId: string) => {
      console.log('📄 [DocSyncPeer.actions.addDoc] 尝试添加文档:', {
        docId,
        alreadyInDocs: this.status.docs.has(docId),
        docsSize: this.status.docs.size,
        peerId: this.peerId
      });

      if (!this.status.docs.has(docId)) {
        console.log('✅ [DocSyncPeer.actions.addDoc] 文档不在 docs 中，添加并创建 connect 作业');
        this.status.docs.add(docId);
        this.statusUpdatedSubject$.next(docId);
        this.schedule({
          type: 'connect',
          docId,
        });
        console.log('✅ [DocSyncPeer.actions.addDoc] 文档已添加到 docs，connect 作业已调度');
      } else {
        console.log('⚠️ [DocSyncPeer.actions.addDoc] 文档已在 docs 中，跳过');
      }
    },
  };

  readonly events = {
    localUpdated: ({
      docId,
      update,
      clock,
    }: {
      docId: string;
      update: Uint8Array;
      clock: Date;
    }) => {
      console.log('📤 [DocSyncPeer.events.localUpdated] 本地文档更新事件:', {
        docId,
        updateSize: update.length,
        clock,
        peerId: this.peerId,
        timestamp: new Date().toISOString()
      });

      // 尝试为新文档添加文档
      console.log('🔍 [DocSyncPeer.events.localUpdated] 检查是否需要添加文档...');
      this.actions.addDoc(docId);

      // 🔧 过滤空更新，避免无限循环
      if (isEmptyUpdate(update)) {
        console.log('⚠️ [DocSyncPeer.events.localUpdated] 检测到空更新，跳过创建push作业:', {
          docId,
          updateSize: update.length
        });
        return;
      }

      // 安排推送作业
      console.log('📋 [DocSyncPeer.events.localUpdated] 创建 push 作业');
      this.schedule({
        type: 'push',
        docId,
        clock,
        update,
      });

      console.log('✅ [DocSyncPeer.events.localUpdated] 本地更新处理完成');
    },
    remoteUpdated: ({
      docId,
      update,
      remoteClock,
    }: {
      docId: string;
      update: Uint8Array;
      remoteClock: Date;
    }) => {
      // 尝试为新文档添加文档
      this.actions.addDoc(docId);
      this.actions.updateRemoteClock(docId, remoteClock);

      // 🔧 过滤空更新，避免无限循环
      if (isEmptyUpdate(update)) {
        console.log('⚠️ [DocSyncPeer.events.remoteUpdated] 检测到空更新，跳过创建save作业:', {
          docId,
          updateSize: update.length
        });
        return;
      }

      // 安排推送作业
      this.schedule({
        type: 'save',
        docId,
        remoteClock: remoteClock,
        update,
      });
    },
  };

  async mainLoop(signal?: AbortSignal) {
    console.log('🚀 [DocSyncPeer.mainLoop] 主循环启动:', {
      peerId: this.peerId,
      timestamp: new Date().toISOString()
    });

    while (true) {
      try {
        await this.retryLoop(signal);
      } catch (err) {
        if (signal?.aborted) {
          console.log('🛑 [DocSyncPeer.mainLoop] 收到中止信号，退出主循环:', {
            peerId: this.peerId,
            reason: signal.reason
          });
          return;
        }
        console.error('❌ [DocSyncPeer.mainLoop] 同步错误，5秒后重试:', {
          peerId: this.peerId,
          error: err,
          errorMessage: err instanceof Error ? err.message : `${err}`,
          errorStack: err instanceof Error ? err.stack : undefined
        });
        this.status.errorMessage =
          err instanceof Error ? err.message : `${err}`;
        this.statusUpdatedSubject$.next(true);
      } finally {
        // 重置所有状态
        console.warn('🔄 [DocSyncPeer.mainLoop] 重置同步状态:', {
          peerId: this.peerId,
          previousConnectedDocs: Array.from(this.status.connectedDocs),
          previousDocsCount: this.status.docs.size
        });

        this.status = {
          docs: new Set(),
          connectedDocs: new Set(),
          jobDocQueue: new AsyncPriorityQueue(),
          jobMap: new Map(),
          remoteClocks: new ClockMap(new Map()),
          syncing: false,
          skipped: false,
          // 告诉UI显示重试状态
          retrying: true,
          // 来自上次重试的错误消息
          errorMessage: this.status.errorMessage,
        };
        this.statusUpdatedSubject$.next(true);
      }
      // 等待5秒后进行下一次重试
      console.log('⏳ [DocSyncPeer.mainLoop] 等待5秒后重试...', {
        peerId: this.peerId
      });
      await Promise.race([
        new Promise<void>(resolve => {
          setTimeout(resolve, 5000);
        }),
        new Promise((_, reject) => {
          // 如果手动停止则退出
          if (signal?.aborted) {
            reject(signal.reason);
          }
          signal?.addEventListener('abort', () => {
            reject(signal.reason);
          });
        }),
      ]);
    }
  }

  private async retryLoop(signal?: AbortSignal) {
    throwIfAborted(signal);
    if (this.local.isReadonly) {
      // 本地为只读，跳过同步
      this.status.skipped = true;
      this.statusUpdatedSubject$.next(true);
      await new Promise((_, reject) => {
        signal?.addEventListener('abort', reason => {
          reject(reason);
        });
      });
      return;
    }
    const abort = new AbortController();

    signal?.addEventListener('abort', reason => {
      abort.abort(reason);
    });

    signal = abort.signal;

    const disposes: (() => void)[] = [];

    try {
      console.log('🔌 [DocSyncPeer.retryLoop] 开始等待连接:', {
        peerId: this.peerId,
        timestamp: new Date().toISOString()
      });

      // 等待所有存储连接，30秒后超时
      await Promise.race([
        Promise.all([
          this.local.connection.waitForConnected(signal),
          this.remote.connection.waitForConnected(signal),
          this.syncMetadata.connection.waitForConnected(signal),
        ]),
        new Promise<void>((_, reject) => {
          setTimeout(() => {
            console.error('❌ [DocSyncPeer.retryLoop] 连接超时（30秒）:', {
              peerId: this.peerId
            });
            reject(new Error('连接远程超时'));
          }, 1000 * 30);
        }),
        new Promise((_, reject) => {
          signal?.addEventListener('abort', reason => {
            reject(reason);
          });
        }),
      ]);

      console.info('✅ [DocSyncPeer.retryLoop] 所有存储连接成功，远程同步开始:', {
        peerId: this.peerId
      });
      this.status.syncing = true;
      this.statusUpdatedSubject$.next(true);

      console.log('🔍 [DocSyncPeer.retryLoop] 开始设置连接监听器');
      // 如果连接失败则抛出错误
      for (const storage of [this.remote, this.local, this.syncMetadata]) {
        // 如果断开连接则中止
        disposes.push(
          storage.connection.onStatusChanged((_status, error) => {
            console.warn('⚠️ [DocSyncPeer.retryLoop] 存储状态变化，中止同步:', {
              error,
              peerId: this.peerId
            });
            abort.abort('Storage disconnected:' + error);
          })
        );
      }

      // 连接服务器后重置重试标志
      console.log('🔍 [DocSyncPeer.retryLoop] 重置重试标志');
      this.status.retrying = false;
      this.statusUpdatedSubject$.next(true);

      // 订阅本地文档更新
      console.log('👂 [DocSyncPeer.retryLoop] 订阅本地文档更新事件');
      disposes.push(
        this.local.subscribeDocUpdate((update, origin) => {
          console.log('📨 [DocSyncPeer.retryLoop] 收到本地文档更新:', {
            docId: update.docId,
            binSize: update.bin.length,
            origin: origin,
            uniqueId: this.uniqueId,
            peerId: this.peerId,
            timestamp: new Date().toISOString()
          });

          if (
            origin === this.uniqueId ||
            origin?.startsWith(
              `sync:${this.peerId}:`
              // 如果peerId相同则跳过
            )
          ) {
            console.log('⚠️ [DocSyncPeer.retryLoop] 本地更新来自自己，跳过:', {
              docId: update.docId,
              origin,
              uniqueId: this.uniqueId
            });
            return;
          }

          console.log('✅ [DocSyncPeer.retryLoop] 触发 localUpdated 事件');
          this.events.localUpdated({
            docId: update.docId,
            clock: update.timestamp,
            update: update.bin,
          });
        })
      );
      // 订阅远程文档更新
      disposes.push(
        this.remote.subscribeDocUpdate(({ bin, docId, timestamp }, origin) => {
          if (origin === this.uniqueId) {
            return;
          }
          this.events.remoteUpdated({
            docId,
            update: bin,
            remoteClock: timestamp,
          });
        })
      );

      // 从本地添加所有文档
      const localDocs = Object.keys(await this.local.getDocTimestamps());
      throwIfAborted(signal);
      for (const docId of localDocs) {
        this.actions.addDoc(docId);
      }

      // 从元数据获取缓存的时钟
      const cachedClocks = await this.syncMetadata.getPeerRemoteClocks(
        this.peerId
      );
      this.status.remoteClocks.clear();
      throwIfAborted(signal);
      for (const [id, v] of Object.entries(cachedClocks)) {
        this.status.remoteClocks.set(id, v);
      }
      this.statusUpdatedSubject$.next(true);

      // 从服务器获取新时钟
      const maxClockValue = this.status.remoteClocks.max;
      console.log('🕐 [DocSyncPeer.retryLoop] 准备获取文档时间戳:', {
        maxClockValue,
        peerId: this.peerId
      });
      const newClocks = await this.remote.getDocTimestamps(maxClockValue);
      console.log('✅ [DocSyncPeer.retryLoop] 获取文档时间戳成功:', {
        newClocksCount: Object.keys(newClocks).length,
        newClocks: Object.keys(newClocks),
        peerId: this.peerId
      });
      for (const [id, v] of Object.entries(newClocks)) {
        this.status.remoteClocks.set(id, v);
      }
      this.statusUpdatedSubject$.next(true);

      for (const [id, v] of Object.entries(newClocks)) {
        await this.syncMetadata.setPeerRemoteClock(this.peerId, {
          docId: id,
          timestamp: v,
        });
      }

      // 从远程添加所有文档
      console.log('📚 [DocSyncPeer.retryLoop] 从远程添加文档:', {
        remoteDocsCount: this.status.remoteClocks.size,
        remoteDocs: Array.from(this.status.remoteClocks.keys()),
        peerId: this.peerId
      });
      for (const docId of this.status.remoteClocks.keys()) {
        this.actions.addDoc(docId);
      }

      // 开始处理作业
      console.log('🔄 [DocSyncPeer.retryLoop] 开始处理作业队列', {
        jobMapSize: this.status.jobMap.size,
        jobQueueLength: this.status.jobDocQueue.length,
        docs: Array.from(this.status.docs),
        connectedDocs: Array.from(this.status.connectedDocs),
        peerId: this.peerId
      });

      while (true) {
        throwIfAborted(signal);

        console.log('⏳ [DocSyncPeer.retryLoop] 等待下一个作业...');

        const docId = await this.status.jobDocQueue.asyncPop(signal);

        console.log('📋 [DocSyncPeer.retryLoop] 从队列取出作业:', {
          docId,
          peerId: this.peerId
        });

        while (true) {
          // 批量处理同一文档的作业
          const jobs = this.status.jobMap.get(docId);
          if (!jobs || jobs.length === 0) {
            console.log('✅ [DocSyncPeer.retryLoop] 该文档的作业已全部处理完成:', {
              docId
            });
            this.status.jobMap.delete(docId);
            this.statusUpdatedSubject$.next(docId);
            break;
          }

          console.log('🔄 [DocSyncPeer.retryLoop] 处理文档作业:', {
            docId,
            jobsCount: jobs.length,
            jobTypes: jobs.map(j => j.type).join(', '),
            peerId: this.peerId
          });

          const connect = remove(jobs, j => j.type === 'connect');
          if (connect && connect.length > 0) {
            console.log('🔗 [DocSyncPeer.retryLoop] 执行 connect 作业:', {
              docId,
              count: connect.length
            });
            await this.jobs.connect(docId, signal);
            continue;
          }

          const pullAndPush = remove(jobs, j => j.type === 'pullAndPush');
          if (pullAndPush && pullAndPush.length > 0) {
            console.log('🔄 [DocSyncPeer.retryLoop] 执行 pullAndPush 作业:', {
              docId,
              count: pullAndPush.length
            });
            await this.jobs.pullAndPush(docId, signal);
            continue;
          }

          const pull = remove(jobs, j => j.type === 'pull');
          if (pull && pull.length > 0) {
            console.log('📥 [DocSyncPeer.retryLoop] 执行 pull 作业:', {
              docId,
              count: pull.length
            });
            await this.jobs.pull(docId, signal);
            continue;
          }

          const push = remove(jobs, j => j.type === 'push');
          if (push && push.length > 0) {
            console.log('📤 [DocSyncPeer.retryLoop] 执行 push 作业:', {
              docId,
              count: push.length
            });
            await this.jobs.push(
              docId,
              push as (Job & { type: 'push' })[],
              signal
            );
            continue;
          }

          const save = remove(jobs, j => j.type === 'save');
          if (save && save.length > 0) {
            console.log('💾 [DocSyncPeer.retryLoop] 执行 save 作业:', {
              docId,
              count: save.length
            });
            await this.jobs.save(
              docId,
              save as (Job & { type: 'save' })[],
              signal
            );
            continue;
          }
        }
      }
    } finally {
      for (const dispose of disposes) {
        dispose();
      }
      this.status.syncing = false;
      console.info('远程同步结束');
    }
  }

  private schedule(job: Job) {
    console.log('📋 [DocSyncPeer.schedule] 调度作业:', {
      jobType: job.type,
      docId: job.docId,
      peerId: this.peerId,
      timestamp: new Date().toISOString()
    });

    // 🔧 防重复调度：检查最近是否已调度过相同作业
    const scheduleKey = `${job.docId}:${job.type}`;
    const lastScheduleTime = this.recentSchedules.get(scheduleKey) || 0;
    const now = Date.now();
    
    if (now - lastScheduleTime < this.SCHEDULE_DEBOUNCE_MS) {
      console.log('⚠️ [DocSyncPeer.schedule] 检测到重复调度，跳过（防抖）:', {
        jobType: job.type,
        docId: job.docId,
        timeSinceLastSchedule: now - lastScheduleTime,
        debounceMs: this.SCHEDULE_DEBOUNCE_MS
      });
      return;
    }
    
    // 记录本次调度时间
    this.recentSchedules.set(scheduleKey, now);
    
    // 清理旧的记录（超过1秒的）
    for (const [key, time] of this.recentSchedules.entries()) {
      if (now - time > 1000) {
        this.recentSchedules.delete(key);
      }
    }

    const priority = this.prioritySettings.get(job.docId) ?? 0;
    this.status.jobDocQueue.push(job.docId, priority);

    const existingJobs = this.status.jobMap.get(job.docId) ?? [];
    existingJobs.push(job);
    this.status.jobMap.set(job.docId, existingJobs);

    console.log('✅ [DocSyncPeer.schedule] 作业已加入队列:', {
      jobType: job.type,
      docId: job.docId,
      queuedJobsCount: existingJobs.length,
      priority: priority,
      peerId: this.peerId
    });

    this.statusUpdatedSubject$.next(job.docId);
  }

  addPriority(id: string, priority: number) {
    const oldPriority = this.prioritySettings.get(id) ?? 0;
    this.prioritySettings.set(id, priority);
    this.status.jobDocQueue.setPriority(id, oldPriority + priority);

    return () => {
      const currentPriority = this.prioritySettings.get(id) ?? 0;
      this.prioritySettings.set(id, currentPriority - priority);
      this.status.jobDocQueue.setPriority(id, currentPriority - priority);
    };
  }

  protected mergeUpdates = async (updates: Uint8Array[]) => {
    // 动态导入 yjs，避免 Worker 初始化时加载
    const { mergeUpdates: yjsMergeUpdates } = await import('yjs');
    const merge = this.options?.mergeUpdates ?? yjsMergeUpdates;

    return merge(updates.filter(bin => !isEmptyUpdate(bin)));
  };
}
