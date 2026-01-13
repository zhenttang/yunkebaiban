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
    sessionId?: string;
    clientId?: string;
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

  'space:broadcast-doc-updates': {
    spaceType: string;
    spaceId: string;
    docId: string;
    updates: Array<{
      spaceType?: string;
      spaceId?: string;
      docId?: string;
      update: string;
      timestamp: number;
      editor?: string;
      sessionId?: string;
      clientId?: string;
    }>;
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
    {
      spaceType: string;
      spaceId: string;
      docId: string;
      update: string;
      sessionId?: string;
      clientId?: string;
    },
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
    // 🔧 Android兼容性修复：使用btoa而不是FileReader
    // FileReader.readAsDataURL在Android WebView中可能产生错误的Base64编码
    try {
      // 方法1：直接使用btoa（适用于所有环境，包括Android）
      let binary = '';
      const len = array.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(array[i]);
      }
      const base64 = btoa(binary);
      resolve(base64);
    } catch (error) {
      console.error('❌ [uint8ArrayToBase64] btoa编码失败，回退到FileReader:', error);
      
      // 方法2：回退到FileReader（原始方法）
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
      reader.onerror = function() {
        console.error('❌ [uint8ArrayToBase64] FileReader也失败了');
        resolve('');
      };
      reader.readAsDataURL(blob);
    }
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
  private tokenCache: string | null = null;
  private readonly endpoint: string;

  constructor(endpoint: string, isSelfHosted: boolean) {
    this.endpoint = endpoint;
    this.socketIOManager = new SocketIOManager(endpoint, {
      autoConnect: false,
      // 🔧 Android修复：强制使用polling优先，因为Android Capacitor可能有websocket问题
      transports: ['polling', 'websocket'], // 强制polling优先
      secure: new URL(endpoint).protocol === 'https:',
      // we will handle reconnection by ourselves
      reconnection: false,
    });
    
    // ✅ 预先获取 token 用于 URL 参数
    // 注意：Socket.IO 的 query 选项不支持异步函数，所以需要预先获取
    this.initializeToken();
    
    this.socket = this.socketIOManager.socket('/', {
      auth(cb) {
        if (authMethod) {
          authMethod(endpoint, cb);
        } else {
          cb({});
        }
      },
      // ✅ 通过 URL 参数传递 token，以便后端能够获取
      // 注意：query 选项在连接时会被调用，此时 tokenCache 可能还未设置
      // 但 Socket.IO 会在连接时使用这个值，如果 tokenCache 为 null，则不会传递 token 参数
      query: () => {
        return this.tokenCache ? { token: this.tokenCache } : {};
      },
    });
  }

  private initializeToken() {
    if (authMethod) {
      authMethod(this.endpoint, (authData: any) => {
        this.tokenCache = authData?.token || null;
        if (this.tokenCache) {
          console.log('✅ [SocketManager] Token 已缓存，可用于 URL 参数');
        }
      });
    }
  }

  connect() {
    let disconnected = false;

    // 🔧 优化：如果已连接且 refCount > 0，只增加引用计数，不重复连接
    if (this.socket.connected && this.refCount > 0) {
      console.log('ℹ️ [SocketManager] Socket 已连接，增加引用计数:', {
        refCount: this.refCount + 1,
        socketId: this.socket.id
      });
      this.refCount++;
      return {
        socket: this.socket,
        disconnect: () => {
          if (disconnected) {
            return;
          }
          disconnected = true;
          this.refCount--;
          if (this.refCount === 0) {
            this.socket.disconnect();
          }
        },
      };
    }

    this.refCount++;
    
    // 🔧 只有在未连接时才调用 connect()
    if (!this.socket.connected) {
      this.socket.connect();
    }

    return {
      socket: this.socket,
      disconnect: () => {
        if (disconnected) {
          return;
        }

        disconnected = true;
        this.refCount--;

        if (this.refCount === 0) {
          this.socket.disconnect();
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
    const { socket, disconnect } = this.manager.connect();

    try {
      throwIfAborted(signal);

      await Promise.race([
        new Promise<void>((resolve, reject) => {
          if (socket.connected) {
            resolve();
            return;
          }

          socket.once('connect', () => {
            resolve();
          });

          socket.once('connect_error', err => {
            console.error('❌ [SocketConnection] Socket 连接错误:', {
              error: err.message,
              type: err.type,
              description: err.description
            });
            reject(err);
          });
        }),
        new Promise<void>((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            reject(signal.reason);
          });
        }),
      ]);

    } catch (err) {
      console.error('❌ [SocketConnection] doConnect 失败:', {
        error: err instanceof Error ? err.message : String(err),
        endpoint: this.endpoint
      });
      disconnect();
      throw err;
    }

    socket.on('disconnect', this.handleDisconnect);

    return {
      socket,
      disconnect,
    };
  }

  override doDisconnect(conn: { socket: Socket; disconnect: () => void }) {
    conn.socket.off('disconnect', this.handleDisconnect);
    conn.disconnect();
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
