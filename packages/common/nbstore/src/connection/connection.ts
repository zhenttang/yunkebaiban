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

    console.log('🔄 [AutoReconnectConnection.setStatus] 状态变化:', {
      connectionType: this.constructor.name,
      oldStatus: this._status,
      newStatus: status,
      hasError: !!error,
      errorMessage: error?.message,
      willEmit: shouldEmit
    });

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
    console.log('🔌 [AutoReconnectConnection.innerConnect] 开始内部连接流程:', {
      connectionType: this.constructor.name,
      currentStatus: this.status,
      refCount: this.refCount
    });

    if (this.status !== 'connecting') {
      this.setStatus('connecting');
      const connectingAbort = new AbortController();
      this.connectingAbort = connectingAbort;
      const signal = connectingAbort.signal;

      console.log('⏱️ [AutoReconnectConnection.innerConnect] 设置连接超时:', {
        timeout: this.connectingTimeout,
        connectionType: this.constructor.name
      });

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
            console.log('✅ [AutoReconnectConnection.innerConnect] doConnect 成功:', {
              connectionType: this.constructor.name
            });
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
            console.log('⚠️ [AutoReconnectConnection.innerConnect] doConnect 失败但已中止，忽略:', {
              connectionType: this.constructor.name
            });
          }
        });
    } else {
      console.log('⚠️ [AutoReconnectConnection.innerConnect] 已在连接中，忽略:', {
        connectionType: this.constructor.name
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
      console.log('⚠️ [AutoReconnectConnection.handleError] 连接已关闭，不重新连接:', {
        connectionType: this.constructor.name
      });
      return;
    }

    this.setStatus('error', reason);

    // 重新连接
    console.log(`⏳ [AutoReconnectConnection.handleError] 将在 ${this.retryDelay}ms 后重试连接...`, {
      connectionType: this.constructor.name
    });

    this.reconnectingAbort = new AbortController();
    const signal = this.reconnectingAbort.signal;
    const timeout = setTimeout(() => {
      if (!signal.aborted) {
        console.log('🔄 [AutoReconnectConnection.handleError] 重试连接时间到，调用 innerConnect:', {
          connectionType: this.constructor.name
        });
        this.innerConnect();
      } else {
        console.log('⚠️ [AutoReconnectConnection.handleError] 重试已中止:', {
          connectionType: this.constructor.name
        });
      }
    }, this.retryDelay);
    signal.addEventListener('abort', () => {
      clearTimeout(timeout);
    });
  }

  connect() {
    console.log('🔌 [AutoReconnectConnection.connect] 调用 connect:', {
      connectionType: this.constructor.name,
      beforeRefCount: this.refCount,
      currentStatus: this.status
    });

    this.refCount++;
    if (this.refCount === 1) {
      console.log('🔌 [AutoReconnectConnection.connect] RefCount 为 1，开始内部连接:', {
        connectionType: this.constructor.name
      });
      this.innerConnect();
    } else {
      console.log('🔌 [AutoReconnectConnection.connect] RefCount > 1，跳过连接:', {
        connectionType: this.constructor.name,
        refCount: this.refCount
      });
    }
  }

  disconnect(force?: boolean) {
    console.log('🔌 [AutoReconnectConnection.disconnect] 调用 disconnect:', {
      connectionType: this.constructor.name,
      force,
      beforeRefCount: this.refCount,
      currentStatus: this.status
    });

    if (force) {
      this.refCount = 0;
    } else {
      this.refCount = Math.max(this.refCount - 1, 0);
    }

    if (this.refCount === 0) {
      console.log('🔌 [AutoReconnectConnection.disconnect] RefCount 归零，执行内部断开:', {
        connectionType: this.constructor.name
      });
      this.innerDisconnect();
      this.setStatus('closed');
    } else {
      console.log('🔌 [AutoReconnectConnection.disconnect] RefCount 未归零，保持连接:', {
        connectionType: this.constructor.name,
        remainingRefCount: this.refCount
      });
    }
  }

  waitForConnected(signal?: AbortSignal) {
    console.log('⏳ [AutoReconnectConnection.waitForConnected] 等待连接:', {
      connectionType: this.constructor.name,
      currentStatus: this.status,
      hasSignal: !!signal
    });

    return new Promise<void>((resolve, reject) => {
      if (this.status === 'connected') {
        console.log('✅ [AutoReconnectConnection.waitForConnected] 已经连接，立即返回:', {
          connectionType: this.constructor.name
        });
        resolve();
        return;
      }

      console.log('⏳ [AutoReconnectConnection.waitForConnected] 监听状态变化...', {
        connectionType: this.constructor.name
      });

      const off = this.onStatusChanged(status => {
        console.log('🔔 [AutoReconnectConnection.waitForConnected] 收到状态变化通知:', {
          connectionType: this.constructor.name,
          newStatus: status
        });

        if (status === 'connected') {
          console.log('✅ [AutoReconnectConnection.waitForConnected] 连接成功，resolve:', {
            connectionType: this.constructor.name
          });
          resolve();
          off();
        }
      });

      signal?.addEventListener('abort', reason => {
        console.warn('⚠️ [AutoReconnectConnection.waitForConnected] 收到中止信号:', {
          connectionType: this.constructor.name,
          reason
        });
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
