/**
 * WorkspaceConnection - 统一的 workspace 级 Socket.IO 连接管理器
 *
 * 职责：
 * 1. 为每个 workspace 维护唯一的 Socket 连接
 * 2. 在 space:join 之前注册所有监听器，避免广播抢先到达的 race condition
 * 3. 共享 clientId 与 idConverter 给所有 Storage 实例
 * 4. 在 idConverter 未就绪时缓存早期更新，待准备完成一次性下发
 * 5. 通过 EventEmitter 充当事件总线，Storage 只需订阅事件即可
 */

import { EventEmitter } from 'eventemitter3';
import type { Socket } from 'socket.io-client';
import {
  SocketConnection,
  base64ToUint8Array,
  uint8ArrayToBase64,
  type ServerEventsMap,
} from './socket';
import { getIdConverter, type IdConverter } from '../../utils/id-converter';
import { sanitizeSessionIdentifier } from '../../utils/session-activity';
import type { SpaceType } from '../../utils/universal-id';
import type {
  WorkspaceConnectionEvents,
  DocUpdateMessage,
} from './workspace-connection-events';
import { getSocketIOUrl } from '@yunke/config';

const IDENTITY_ID_CONVERTER: IdConverter = {
  newIdToOldId: (id: string) => id,
  oldIdToNewId: (id: string) => id,
};

export interface WorkspaceConnectionOptions {
  serverBaseUrl: string;
  isSelfHosted: boolean;
  spaceType: SpaceType;
  spaceId: string;
}

export class WorkspaceConnection extends EventEmitter<WorkspaceConnectionEvents> {
  /** SocketConnection实例（公开以兼容DocStorageBase） */
  readonly connection: SocketConnection;

  private _idConverter: IdConverter | null = null;
  private _clientId: string | null = null;
  private _isReady = false;

  private earlyUpdates: DocUpdateMessage[] = [];

  private connectPromise: Promise<void> | null = null;
  private reconnectPromise: Promise<void> | null = null;
  private hasJoined = false;

  private listenersRegistered = false;
  private registeredSocket: Socket | null = null;

  constructor(private readonly options: WorkspaceConnectionOptions) {
    super();
    const socketUrl = this.convertToSocketIOUrl(options.serverBaseUrl);
    this.connection = new SocketConnection(socketUrl, options.isSelfHosted);
  }

  get socket(): Socket {
    return this.connection.inner.socket;
  }

  get idConverter(): IdConverter {
    if (!this._idConverter) {
      throw new Error('idConverter未初始化 - 请等待连接完成');
    }
    return this._idConverter;
  }

  get clientId(): string | null {
    return this._clientId;
  }

  get isReady(): boolean {
    return this._isReady;
  }

  async connect(signal?: AbortSignal): Promise<void> {
    if (this._isReady) {
      return;
    }

    if (this.connectPromise) {
      await this.waitWithAbort(this.connectPromise, signal);
      return;
    }

    if (this.hasJoined) {
      await this.waitWithAbort(this.triggerRejoin(signal), signal);
      return;
    }

    const establishingPromise = this.establishInitialConnection(signal);
    const wrappedPromise = establishingPromise.finally(() => {
      if (this.connectPromise === wrappedPromise) {
        this.connectPromise = null;
      }
    });
    this.connectPromise = wrappedPromise;

    await this.waitWithAbort(wrappedPromise, signal);
  }

  private async establishInitialConnection(signal?: AbortSignal): Promise<void> {
    try {
      this.connection.connect();
      await this.connection.waitForConnected(signal);

      const { socket } = this.connection.inner;
      this.registerGlobalListeners(socket);

      await this.joinWorkspace(socket, { loadIdConverter: true });

      this._isReady = true;
      const flushed = this.flushEarlyUpdates();

      this.emit('connection:connected');
      this.emit('connection:synced');

      console.log('✅ [WorkspaceConnection] 连接并同步完成', {
        spaceId: this.options.spaceId,
        clientId: this._clientId,
        earlyUpdatesFlushed: flushed,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('connection:error', err);
      throw err;
    }
  }

  private triggerRejoin(signal?: AbortSignal): Promise<void> {
    if (!this.reconnectPromise) {
      const resumePromise = this.resumeWorkspace(signal);
      const wrappedPromise = resumePromise.finally(() => {
        if (this.reconnectPromise === wrappedPromise) {
          this.reconnectPromise = null;
        }
      });
      this.reconnectPromise = wrappedPromise;
    }

    return this.waitWithAbort(this.reconnectPromise, signal);
  }

  private async resumeWorkspace(signal?: AbortSignal): Promise<void> {
    try {
      await this.connection.waitForConnected(signal);
      const { socket } = this.connection.inner;
      this.registerGlobalListeners(socket);

      await this.joinWorkspace(socket, { loadIdConverter: !this._idConverter });

      this._isReady = true;
      const flushed = this.flushEarlyUpdates();

      this.emit('connection:connected');
      this.emit('connection:synced');

      console.log('🔁 [WorkspaceConnection] 重新加入workspace', {
        spaceId: this.options.spaceId,
        clientId: this._clientId,
        earlyUpdatesFlushed: flushed,
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.emit('connection:error', err);
      throw err;
    }
  }

  private async joinWorkspace(
    socket: Socket,
    options: { loadIdConverter: boolean }
  ): Promise<void> {
    const joinData = {
      spaceType: this.options.spaceType,
      spaceId: this.options.spaceId,
      clientVersion: BUILD_CONFIG.appVersion,
    };

    const res = await socket.emitWithAck('space:join', joinData);

    if ('error' in res) {
      throw new Error(`space:join失败: ${res.error.message}`);
    }

    if ('data' in res && res.data) {
      this._clientId = sanitizeSessionIdentifier(
        (res.data as { clientId?: string }).clientId
      );
    }

    this.hasJoined = true;

    if (!options.loadIdConverter) {
      return;
    }

    try {
      this._idConverter = await this.loadIdConverter(socket);
    } catch (error) {
      console.warn('⚠️ [WorkspaceConnection] idConverter加载失败，使用默认转换器:', error);
      this._idConverter = IDENTITY_ID_CONVERTER;
    }
  }

  private registerGlobalListeners(socket: Socket): void {
    if (this.listenersRegistered && this.registeredSocket === socket) {
      return;
    }

    if (this.listenersRegistered && this.registeredSocket) {
      this.unregisterGlobalListeners();
    }

    socket.on('space:broadcast-doc-update', this.handleServerDocUpdate);
    socket.on('space:broadcast-doc-updates', this.handleServerDocUpdates);
    socket.on('space:broadcast-awareness-update', this.handleAwarenessUpdate);
    socket.on('space:collect-awareness', this.handleAwarenessCollect);
    socket.on('disconnect', this.handleSocketDisconnect);
    socket.on('connect', this.handleSocketReconnect);

    this.listenersRegistered = true;
    this.registeredSocket = socket;
  }

  private unregisterGlobalListeners(): void {
    if (!this.listenersRegistered || !this.registeredSocket) {
      return;
    }

    const socket = this.registeredSocket;
    socket.off('space:broadcast-doc-update', this.handleServerDocUpdate);
    socket.off('space:broadcast-doc-updates', this.handleServerDocUpdates);
    socket.off('space:broadcast-awareness-update', this.handleAwarenessUpdate);
    socket.off('space:collect-awareness', this.handleAwarenessCollect);
    socket.off('disconnect', this.handleSocketDisconnect);
    socket.off('connect', this.handleSocketReconnect);

    this.listenersRegistered = false;
    this.registeredSocket = null;
  }

  private readonly handleServerDocUpdate = (
    message: ServerEventsMap['space:broadcast-doc-update']
  ) => {
    const docUpdate = this.parseDocUpdate(message);
    if (!docUpdate) {
      return;
    }

    if (!this._isReady) {
      this.earlyUpdates.push(docUpdate);
      return;
    }

    this.emit('doc:update', docUpdate);
  };

  private readonly handleServerDocUpdates = (
    message: ServerEventsMap['space:broadcast-doc-updates']
  ) => {
    const docUpdates = message.updates
      .map((update) =>
        this.parseDocUpdate({
          ...update,
          spaceType: update.spaceType ?? message.spaceType,
          spaceId: update.spaceId ?? message.spaceId,
          docId: update.docId ?? message.docId,
        })
      )
      .filter((u): u is DocUpdateMessage => u !== null);

    if (docUpdates.length === 0) {
      return;
    }

    if (!this._isReady) {
      this.earlyUpdates.push(...docUpdates);
      return;
    }

    this.emit('doc:updates', docUpdates);
  };

  private readonly handleAwarenessUpdate = (
    message: ServerEventsMap['space:broadcast-awareness-update']
  ) => {
    if (!this.isSameSpace(message.spaceType, message.spaceId)) {
      return;
    }

    this.emit('awareness:update', {
      docId: message.docId,
      awarenessUpdate: base64ToUint8Array(message.awarenessUpdate),
    });
  };

  private readonly handleAwarenessCollect = (
    message: ServerEventsMap['space:collect-awareness']
  ) => {
    if (!this.isSameSpace(message.spaceType, message.spaceId)) {
      return;
    }

    this.emit('awareness:collect', message.docId);
  };

  private readonly handleSocketDisconnect = (reason: string) => {
    this._isReady = false;
    this.emit('connection:disconnected', reason);
    console.warn('⚠️ [WorkspaceConnection] 断开连接:', reason);
  };

  private readonly handleSocketReconnect = () => {
    if (!this.hasJoined) {
      return;
    }
    this.triggerRejoin().catch((error) => {
      console.error('❌ [WorkspaceConnection] 重连失败:', error);
    });
  };

  private parseDocUpdate(message: any): DocUpdateMessage | null {
    if (!this.isSameSpace(message.spaceType, message.spaceId)) {
      return null;
    }

    const docId = this._idConverter
      ? this._idConverter.oldIdToNewId(message.docId)
      : message.docId;

    return {
      docId,
      update: base64ToUint8Array(message.update),
      timestamp: new Date(message.timestamp),
      sessionId: message.sessionId,
      clientId: message.clientId,
    };
  }

  private flushEarlyUpdates(): number {
    const pending = this.earlyUpdates.length;
    if (pending === 0) {
      return 0;
    }

    console.log(`📦 [WorkspaceConnection] 处理${pending}个早期缓存更新`);

    const updates = this.earlyUpdates.map((update) => ({
      ...update,
      docId: this._idConverter!.oldIdToNewId(update.docId),
    }));

    this.earlyUpdates = [];
    this.emit('doc:updates', updates);
    return pending;
  }

  private async loadIdConverter(socket: Socket): Promise<IdConverter> {
    return getIdConverter(
      {
        getDocBuffer: async (id) => {
          const response = await socket.emitWithAck('space:load-doc', {
            spaceType: this.options.spaceType,
            spaceId: this.options.spaceId,
            docId: id,
          });

          if ('error' in response) {
            if (response.error.name === 'DOC_NOT_FOUND') {
              return null;
            }
            throw new Error(response.error.message);
          }

          const missingData = response.data.missing;
          if (!missingData) {
            return null;
          }

          return base64ToUint8Array(missingData);
        },
      },
      this.options.spaceId
    );
  }

  async pushDocUpdate(
    docId: string,
    update: Uint8Array,
    sessionId?: string,
    clientId?: string
  ): Promise<number> {
    if (!this._isReady || !this._idConverter) {
      throw new Error('WorkspaceConnection未就绪');
    }

    const updateBase64 = await uint8ArrayToBase64(update);
    const oldDocId = this._idConverter.newIdToOldId(docId);

    const result = await this.socket.emitWithAck('space:push-doc-update', {
      spaceType: this.options.spaceType,
      spaceId: this.options.spaceId,
      docId: oldDocId,
      update: updateBase64,
      sessionId,
      clientId,
    });

    if ('error' in result) {
      throw new Error(result.error.message);
    }

    return result.data.timestamp;
  }

  async disconnect(): Promise<void> {
    this.connectPromise = null;
    this.reconnectPromise = null;

    this.safeLeaveWorkspace();
    this.unregisterGlobalListeners();

    this.connection.disconnect(true);

    this._isReady = false;
    this._idConverter = null;
    this._clientId = null;
    this.earlyUpdates = [];
    this.hasJoined = false;

    this.removeAllListeners();
  }

  private safeLeaveWorkspace(): void {
    if (!this.hasJoined) {
      return;
    }

    const current = this.connection.maybeConnection;
    if (!current) {
      return;
    }

    try {
      current.socket.emit('space:leave', {
        spaceType: this.options.spaceType,
        spaceId: this.options.spaceId,
      });
    } catch (error) {
      console.warn('⚠️ [WorkspaceConnection] 发送 space:leave 失败:', error);
    }
  }

  private convertToSocketIOUrl(_baseUrl: string): string {
    return getSocketIOUrl();
  }

  private isSameSpace(spaceType: string, spaceId: string): boolean {
    return (
      spaceType === this.options.spaceType && spaceId === this.options.spaceId
    );
  }

  private waitWithAbort<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
    if (!signal) {
      return promise;
    }

    if (signal.aborted) {
      return Promise.reject(signal.reason ?? new Error('Aborted'));
    }

    return new Promise<T>((resolve, reject) => {
      const onAbort = () => {
        signal.removeEventListener('abort', onAbort);
        reject(signal.reason ?? new Error('Aborted'));
      };

      signal.addEventListener('abort', onAbort);

      promise
        .then((value) => {
          signal.removeEventListener('abort', onAbort);
          resolve(value);
        })
        .catch((error) => {
          signal.removeEventListener('abort', onAbort);
          reject(error);
        });
    });
  }
}
