import EventEmitter2 from 'eventemitter2';

import { MANUALLY_STOP } from '../utils/throw-if-aborted';

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'closed';

export interface Connection<T = any> {
  readonly status: ConnectionStatus;
  readonly error?: Error;
  readonly inner: T;
  connect(): void;
  disconnect(): void;
  waitForConnected(signal?: AbortSignal): Promise<void>;
  onStatusChanged(
    cb: (status: ConnectionStatus, error?: Error) => void
  ): () => void;
}

export abstract class AutoReconnectConnection<T = any>
  implements Connection<T>
{
  private readonly event = new EventEmitter2({
    maxListeners: 100,
  });
  private _inner: T | undefined = undefined;
  private _status: ConnectionStatus = 'idle';
  private _error: Error | undefined = undefined;
  retryDelay = 3000;
  connectingTimeout = 15000;
  private refCount = 0;
  private connectingAbort?: AbortController;
  private reconnectingAbort?: AbortController;

  constructor() {}

  get shareId(): string | undefined {
    return undefined;
  }

  get maybeConnection() {
    return this._inner;
  }

  get inner(): T {
    if (this._inner === undefined) {
      throw new Error(
        `连接 ${this.constructor.name} 尚未建立。`
      );
    }

    return this._inner;
  }

  private set inner(inner: T | undefined) {
    this._inner = inner;
  }

  get status() {
    return this._status;
  }

  get error() {
    return this._error;
  }

  protected set error(error: Error | undefined) {
    this.handleError(error);
  }

  private setStatus(status: ConnectionStatus, error?: Error) {
    const shouldEmit = status !== this._status || error !== this._error;


    this._status = status;
    // 只有在状态为connected时才清除错误
    if (error || status === 'connected') {
      this._error = error;
    }
    if (shouldEmit) {
      this.emitStatusChanged(status, this._error);
    }
  }

  protected abstract doConnect(signal?: AbortSignal): Promise<T>;
  protected abstract doDisconnect(conn: T): void;

  private innerConnect() {

    if (this.status !== 'connecting') {
      this.setStatus('connecting');
      const connectingAbort = new AbortController();
      this.connectingAbort = connectingAbort;
      const signal = connectingAbort.signal;


      const timeout = setTimeout(() => {
        if (!signal.aborted) {
          console.error('❌ [AutoReconnectConnection.innerConnect] 连接超时:', {
            timeout: this.connectingTimeout,
            connectionType: this.constructor.name
          });
          this.handleError(new Error('连接超时'));
        }
      }, this.connectingTimeout);

      this.doConnect(signal)
        .then(value => {
          clearTimeout(timeout);
          if (!signal.aborted) {
            this._inner = value;
            this.setStatus('connected');
          } else {
            console.warn('⚠️ [AutoReconnectConnection.innerConnect] doConnect 成功但已中止:', {
              connectionType: this.constructor.name,
              abortReason: signal.reason
            });
            try {
              this.doDisconnect(value);
            } catch (error) {
              console.error('❌ [AutoReconnectConnection.innerConnect] 断开连接失败:', {
                error,
                connectionType: this.constructor.name
              });
            }
          }
        })
        .catch(error => {
          if (!signal.aborted) {
            clearTimeout(timeout);
            console.error('❌ [AutoReconnectConnection.innerConnect] doConnect 失败:', {
              error,
              errorMessage: error?.message,
              errorStack: error?.stack,
              connectionType: this.constructor.name
            });
            this.handleError(error as any);
          } else {
          }
        });
    }
  }

  private innerDisconnect() {
    this.connectingAbort?.abort(MANUALLY_STOP);
    this.reconnectingAbort?.abort(MANUALLY_STOP);
    try {
      if (this._inner) {
        this.doDisconnect(this._inner);
      }
    } catch (error) {
      console.error('断开连接失败', error);
    }
    this.reconnectingAbort = undefined;
    this.connectingAbort = undefined;
    this._inner = undefined;
  }

  private handleError(reason?: Error) {
    // 发生错误时
    console.error('❌ [AutoReconnectConnection.handleError] 连接错误，准备重新连接:', {
      connectionType: this.constructor.name,
      error: reason,
      errorMessage: reason?.message,
      errorStack: reason?.stack,
      currentStatus: this.status,
      retryDelay: this.retryDelay
    });

    this.innerDisconnect();

    // 如果连接已关闭，不要重新连接
    if (this.status === 'closed') {
      return;
    }

    this.setStatus('error', reason);

    // 重新连接

    this.reconnectingAbort = new AbortController();
    const signal = this.reconnectingAbort.signal;
    const timeout = setTimeout(() => {
      if (!signal.aborted) {
        this.innerConnect();
      }
    }, this.retryDelay);
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
    });
  }

  connect() {

    this.refCount++;
    if (this.refCount === 1) {
      this.innerConnect();
    } else {
    }
  }

  disconnect(force?: boolean) {

    if (force) {
      this.refCount = 0;
    } else {
      this.refCount = Math.max(this.refCount - 1, 0);
    }

    if (this.refCount === 0) {
      this.innerDisconnect();
      this.setStatus('closed');
    } else {
    }
  }

  waitForConnected(signal?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      // 立即检查状态，如果已经是 connected，立即 resolve
      if (this.status === 'connected') {
        resolve();
        return;
      }

      // 🔧 修复：如果状态是 closed，立即 reject
      // 但如果是 error，等待自动重连（不立即 reject）
      if (this.status === 'closed') {
        reject(this._error || new Error(`连接已关闭`));
        return;
      }

      // 如果状态是 error，记录日志但继续等待重连
      if (this.status === 'error') {
        console.log('🔄 [AutoReconnectConnection.waitForConnected] 连接处于 error 状态，等待自动重连', {
          connectionType: this.constructor.name,
          retryDelay: this.retryDelay
        });
      }

      const off = this.onStatusChanged((status, error) => {
        if (status === 'connected') {
          resolve();
          off();
        } else if (status === 'closed') {
          // 只有 closed 状态才 reject（error 状态会自动重连）
          reject(error || new Error(`连接已关闭`));
          off();
        }
      });

      signal?.addEventListener('abort', reason => {
        reject(reason);
        off();
      });
    });
  }

  onStatusChanged(
    cb: (status: ConnectionStatus, error?: Error) => void
  ): () => void {
    this.event.on('statusChanged', cb);
    return () => {
      this.event.off('statusChanged', cb);
    };
  }

  private readonly emitStatusChanged = (
    status: ConnectionStatus,
    error?: Error
  ) => {
    this.event.emit('statusChanged', status, error);
  };
}

export class DummyConnection implements Connection<undefined> {
  readonly status: ConnectionStatus = 'connected';
  readonly inner: undefined;

  connect(): void {
    return;
  }
  disconnect(): void {
    return;
  }
  waitForConnected(_signal?: AbortSignal): Promise<void> {
    return Promise.resolve();
  }
  onStatusChanged(
    _cb: (status: ConnectionStatus, error?: Error) => void
  ): () => void {
    return () => {};
  }
}
