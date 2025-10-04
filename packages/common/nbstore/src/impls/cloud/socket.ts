import {
  Manager as SocketIOManager,
  type Socket as SocketIO,
} from 'socket.io-client';

import { AutoReconnectConnection } from '../../connection';
import { throwIfAborted } from '../../utils/throw-if-aborted';

// TODO(@forehalo): use [UserFriendlyError]
interface EventError {
  name: string;
  message: string;
}

type WebsocketResponse<T> =
  | {
      error: EventError;
    }
  | {
      data: T;
    };

interface ServerEvents {
  'space:broadcast-doc-update': {
    spaceType: string;
    spaceId: string;
    docId: string;
    update: string;
    timestamp: number;
    editor: string;
  };

  'space:collect-awareness': {
    spaceType: string;
    spaceId: string;
    docId: string;
  };

  'space:broadcast-awareness-update': {
    spaceType: string;
    spaceId: string;
    docId: string;
    awarenessUpdate: string;
  };
}

interface ClientEvents {
  'space:join': [
    { spaceType: string; spaceId: string; clientVersion: string },
    { clientId: string },
  ];
  'space:leave': { spaceType: string; spaceId: string };
  'space:join-awareness': [
    {
      spaceType: string;
      spaceId: string;
      docId: string;
      clientVersion: string;
    },
    { clientId: string },
  ];
  'space:leave-awareness': {
    spaceType: string;
    spaceId: string;
    docId: string;
  };

  'space:update-awareness': {
    spaceType: string;
    spaceId: string;
    docId: string;
    awarenessUpdate: string;
  };

  'space:load-awarenesses': {
    spaceType: string;
    spaceId: string;
    docId: string;
  };

  'space:push-doc-update': [
    { spaceType: string; spaceId: string; docId: string; update: string },
    { timestamp: number },
  ];
  'space:load-doc-timestamps': [
    {
      spaceType: string;
      spaceId: string;
      timestamp?: number;
    },
    Record<string, number>,
  ];
  'space:load-doc': [
    {
      spaceType: string;
      spaceId: string;
      docId: string;
      stateVector?: string;
    },
    {
      missing: string;
      state: string;
      timestamp: number;
    },
  ];
  'space:delete-doc': { spaceType: string; spaceId: string; docId: string };
}

export type ServerEventsMap = {
  [Key in keyof ServerEvents]: (data: ServerEvents[Key]) => void;
};

export type ClientEventsMap = {
  [Key in keyof ClientEvents]: ClientEvents[Key] extends Array<any>
    ? (
        data: ClientEvents[Key][0],
        ack: (res: WebsocketResponse<ClientEvents[Key][1]>) => void
      ) => void
    : (data: ClientEvents[Key]) => void;
};

export type Socket = SocketIO<ServerEventsMap, ClientEventsMap>;

export function uint8ArrayToBase64(array: Uint8Array): Promise<string> {
  return new Promise<string>(resolve => {
    // Create a blob from the Uint8Array
    const blob = new Blob([array]);

    const reader = new FileReader();
    reader.onload = function () {
      const dataUrl = reader.result as string | null;
      if (!dataUrl) {
        resolve('');
        return;
      }
      // The result includes the `data:` URL prefix and the MIME type. We only want the Base64 data
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };

    reader.readAsDataURL(blob);
  });
}

export function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const binaryArray = [...binaryString].map(function (char) {
    return char.charCodeAt(0);
  });
  return new Uint8Array(binaryArray);
}

let authMethod:
  | ((endpoint: string, cb: (data: object) => void) => void)
  | undefined;

export function configureSocketAuthMethod(
  cb: (endpoint: string, cb: (data: object) => void) => void
) {
  authMethod = cb;
}

class SocketManager {
  private readonly socketIOManager: SocketIOManager;
  socket: Socket;
  refCount = 0;

  constructor(endpoint: string, isSelfHosted: boolean) {
    this.socketIOManager = new SocketIOManager(endpoint, {
      autoConnect: false,
      // 🔧 Android修复：强制使用polling优先，因为Android Capacitor可能有websocket问题
      transports: ['polling', 'websocket'], // 强制polling优先
      secure: new URL(endpoint).protocol === 'https:',
      // we will handle reconnection by ourselves
      reconnection: false,
    });
    this.socket = this.socketIOManager.socket('/', {
      auth(cb) {
        if (authMethod) {
          authMethod(endpoint, cb);
        } else {
          cb({});
        }
      },
    });
  }

  connect() {
    let disconnected = false;
    console.log('🔌 [SocketManager.connect] 开始连接:', {
      endpoint: this.socketIOManager.uri,
      currentRefCount: this.refCount,
      isSocketConnected: this.socket.connected,
      socketId: this.socket.id
    });

    this.refCount++;
    this.socket.connect();

    console.log('🔌 [SocketManager.connect] socket.connect() 已调用:', {
      newRefCount: this.refCount,
      endpoint: this.socketIOManager.uri
    });

    return {
      socket: this.socket,
      disconnect: () => {
        if (disconnected) {
          console.log('⚠️ [SocketManager.disconnect] 已经断开，忽略重复调用');
          return;
        }
        console.log('🔌 [SocketManager.disconnect] 断开连接:', {
          endpoint: this.socketIOManager.uri,
          beforeRefCount: this.refCount,
          socketId: this.socket.id
        });

        disconnected = true;
        this.refCount--;

        if (this.refCount === 0) {
          console.log('🔌 [SocketManager.disconnect] RefCount 归零，真正断开 Socket:', {
            endpoint: this.socketIOManager.uri
          });
          this.socket.disconnect();
        } else {
          console.log('🔌 [SocketManager.disconnect] RefCount 未归零，保持连接:', {
            endpoint: this.socketIOManager.uri,
            remainingRefCount: this.refCount
          });
        }
      },
    };
  }
}

const SOCKET_MANAGER_CACHE = new Map<string, SocketManager>();
function getSocketManager(endpoint: string, isSelfHosted: boolean) {
  let manager = SOCKET_MANAGER_CACHE.get(endpoint);
  if (!manager) {
    manager = new SocketManager(endpoint, isSelfHosted);
    SOCKET_MANAGER_CACHE.set(endpoint, manager);
  }
  return manager;
}

export class SocketConnection extends AutoReconnectConnection<{
  socket: Socket;
  disconnect: () => void;
}> {
  manager = getSocketManager(this.endpoint, this.isSelfHosted);

  constructor(
    private readonly endpoint: string,
    private readonly isSelfHosted: boolean
  ) {
    super();
  }

  override async doConnect(signal?: AbortSignal) {
    console.log('🔌 [SocketConnection.doConnect] 开始连接流程:', {
      endpoint: this.endpoint,
      isSelfHosted: this.isSelfHosted,
      timestamp: new Date().toISOString()
    });

    const { socket, disconnect } = this.manager.connect();

    console.log('🔌 [SocketConnection.doConnect] Manager 返回 socket:', {
      socketId: socket.id,
      isConnected: socket.connected,
      endpoint: this.endpoint
    });

    try {
      throwIfAborted(signal);

      console.log('🔌 [SocketConnection.doConnect] 等待 Socket 连接...');

      await Promise.race([
        new Promise<void>((resolve, reject) => {
          if (socket.connected) {
            console.log('✅ [SocketConnection.doConnect] Socket 已经连接:', {
              socketId: socket.id
            });
            resolve();
            return;
          }

          console.log('⏳ [SocketConnection.doConnect] 等待 connect 事件...');

          socket.once('connect', () => {
            console.log('✅ [SocketConnection.doConnect] 收到 connect 事件:', {
              socketId: socket.id,
              endpoint: this.endpoint
            });
            resolve();
          });

          socket.once('connect_error', err => {
            console.error('❌ [SocketConnection.doConnect] 收到 connect_error 事件:', {
              error: err,
              errorMessage: err?.message,
              errorStack: err?.stack,
              endpoint: this.endpoint
            });
            reject(err);
          });
        }),
        new Promise<void>((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            console.warn('⚠️ [SocketConnection.doConnect] 收到中止信号:', {
              reason: signal.reason,
              endpoint: this.endpoint
            });
            reject(signal.reason);
          });
        }),
      ]);

      console.log('✅ [SocketConnection.doConnect] Socket 连接成功，注册 disconnect 监听器');

    } catch (err) {
      console.error('❌ [SocketConnection.doConnect] 连接失败:', {
        error: err,
        errorMessage: err instanceof Error ? err.message : String(err),
        errorStack: err instanceof Error ? err.stack : undefined,
        endpoint: this.endpoint
      });
      disconnect();
      throw err;
    }

    socket.on('disconnect', this.handleDisconnect);

    console.log('✅ [SocketConnection.doConnect] doConnect 完成');

    return {
      socket,
      disconnect,
    };
  }

  override doDisconnect(conn: { socket: Socket; disconnect: () => void }) {
    console.log('🔌 [SocketConnection.doDisconnect] 执行断开连接:', {
      socketId: conn.socket.id,
      isConnected: conn.socket.connected,
      endpoint: this.endpoint
    });
    conn.socket.off('disconnect', this.handleDisconnect);
    conn.disconnect();
    console.log('✅ [SocketConnection.doDisconnect] 断开连接完成');
  }

  handleDisconnect = (reason: SocketIO.DisconnectReason) => {
    console.warn('⚠️ [SocketConnection.handleDisconnect] Socket 断开:', {
      reason,
      endpoint: this.endpoint,
      timestamp: new Date().toISOString()
    });
    this.error = new Error(reason);
  };
}
