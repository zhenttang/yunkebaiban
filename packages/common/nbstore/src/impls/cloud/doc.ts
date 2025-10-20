import type { Socket } from 'socket.io-client';

import {
  type DocClock,
  type DocClocks,
  DocStorageBase,
  type DocStorageOptions,
  type DocUpdate,
} from '../../storage';
import { getIdConverter, type IdConverter } from '../../utils/id-converter';
import type { SpaceType } from '../../utils/universal-id';
import {
  base64ToUint8Array,
  type ServerEventsMap,
  SocketConnection,
  uint8ArrayToBase64,
} from './socket';

/**
 * 将API基础URL转换为Socket.IO URL
 * 统一的端口转换逻辑，避免硬编码
 */
function convertToSocketIOUrl(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    // 所有环境：Socket.IO统一使用9092端口
    url.port = '9092';
    return url.toString();
  } catch {
    // 如果URL解析失败，使用简单的字符串替换作为后备
    return baseUrl.replace(':8080', ':9092').replace(':8082', ':9092');
  }
}

interface CloudDocStorageOptions extends DocStorageOptions {
  serverBaseUrl: string;
  isSelfHosted: boolean;
  type: SpaceType;
}

export class CloudDocStorage extends DocStorageBase<CloudDocStorageOptions> {
  static readonly identifier = 'CloudDocStorage';

  get socket() {
    return this.connection.inner.socket;
  }
  get idConverter() {
    if (!this.connection.idConverter) {
      throw new Error('ID转换器未初始化');
    }
    return this.connection.idConverter;
  }
  readonly spaceType = this.options.type;

  onServerUpdate: ServerEventsMap['space:broadcast-doc-update'] = message => {
    if (
      this.spaceType === message.spaceType &&
      this.spaceId === message.spaceId
    ) {
      this.emit('update', {
        docId: this.idConverter.oldIdToNewId(message.docId),
        bin: base64ToUint8Array(message.update),
        timestamp: new Date(message.timestamp),
        editor: message.editor,
      });
    }
  };

  readonly connection = new CloudDocStorageConnection(
    this.options,
    this.onServerUpdate
  );

  override async getDocSnapshot(docId: string) {
    const res = await this.socket.emitWithAck('space:load-doc', {
      spaceType: this.spaceType,
      spaceId: this.spaceId,
      docId: this.idConverter.newIdToOldId(docId),
    });

    if ('error' in res) {
      if (res.error.name === 'DOC_NOT_FOUND') {
        console.warn('[CloudDocStorage] load-doc: not found', { docId });
        return null;
      }
      throw new Error(res.error.message);
    }

    const missingBin = base64ToUint8Array(res.data.missing);

    return {
      docId,
      bin: missingBin,
      timestamp: new Date(res.data.timestamp),
    };
  }

  override async getDocDiff(docId: string, state?: Uint8Array) {
    const res = await this.socket.emitWithAck('space:load-doc', {
      spaceType: this.spaceType,
      spaceId: this.spaceId,
      docId: this.idConverter.newIdToOldId(docId),
      stateVector: state ? await uint8ArrayToBase64(state) : undefined,
    });

    if ('error' in res) {
      if (res.error.name === 'DOC_NOT_FOUND') {
        console.warn('[CloudDocStorage] diff: not found', { docId });
        return null;
      }
      throw new Error(res.error.message);
    }

    const missing = base64ToUint8Array(res.data.missing);
    const stateBin = base64ToUint8Array(res.data.state);

    return {
      docId,
      missing,
      state: stateBin,
      timestamp: new Date(res.data.timestamp),
    };
  }

  override async pushDocUpdate(update: DocUpdate) {
    const updateBase64 = await uint8ArrayToBase64(update.bin);
    const docId = this.idConverter?.newIdToOldId(update.docId) || update.docId;

    // 优先使用全局云存储管理器（若可用）
    try {
      const cloudStorageManager = (window as any).__CLOUD_STORAGE_MANAGER__;

      if (cloudStorageManager && cloudStorageManager.isConnected && cloudStorageManager.pushDocUpdate) {
        const timestamp = await cloudStorageManager.pushDocUpdate(docId, update.bin);
        return { timestamp: new Date(timestamp) };
      }
    } catch (error) {
      // 降级到 Socket.IO
    }

    // 降级到原始Socket.IO方法
    if (!this.connection.inner.socket?.connected) {
      throw new Error('Socket.IO connection not established');
    }

    try {
      const requestData = {
        spaceType: this.options.type,
        spaceId: this.spaceId,
        docId: docId,
        update: updateBase64
      };

      const result = await this.connection.inner.socket.emitWithAck('space:push-doc-update', requestData);

      if ('error' in result) {
        throw new Error(`Socket.IO error: ${result.error.message}`);
      }

      return { timestamp: new Date(result.timestamp) };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Just a rough implementation, cloud doc storage should not need this method.
   */
  override async getDocTimestamp(docId: string): Promise<DocClock | null> {
    // 最小实现：通过加载文档获取时间戳（后端可扩展 space:load-doc-timestamps 事件）
    const diff = await this.getDocSnapshot(docId);
    if (!diff) return null;
    return { docId, timestamp: diff.timestamp };
  }

  override async getDocTimestamps(after?: Date) {
    // 通过 Socket 批量获取时间戳
    const response = await this.socket.emitWithAck('space:load-doc-timestamps', {
      spaceType: this.spaceType,
      spaceId: this.spaceId,
      timestamp: after ? after.getTime() : undefined,
    });

    if ('error' in response) {
      console.error('❌ [CloudDocStorage] 获取时间戳失败:', response.error);
      throw new Error(response.error.message);
    }

    const raw: Record<string, number> = response.data as any;
    const ret: DocClocks = {};
    for (const [oldId, ts] of Object.entries(raw || {})) {
      ret[this.idConverter.oldIdToNewId(oldId)] = new Date(ts);
    }
    return ret;
  }

  override async deleteDoc(docId: string) {
    // 使用HTTP REST API删除文档
    const oldDocId = this.idConverter.newIdToOldId(docId);
    
    const response = await fetch(`${this.options.serverBaseUrl}/api/workspaces/${this.spaceId}/docs/${oldDocId}`, {
      method: 'DELETE',
      headers: {
        'x-yunke-version': '0.17.0',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to delete doc: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to delete doc');
    }
  }

  protected async setDocSnapshot() {
    return false;
  }
  protected async getDocUpdates() {
    return [];
  }
  protected async markUpdatesMerged() {
    return 0;
  }
}

class CloudDocStorageConnection extends SocketConnection {
  constructor(
    private readonly options: CloudDocStorageOptions,
    private readonly onServerUpdate: ServerEventsMap['space:broadcast-doc-update']
  ) {
    // 使用统一的端口转换逻辑
    const socketUrl = convertToSocketIOUrl(options.serverBaseUrl);
    super(socketUrl, options.isSelfHosted);
  }

  idConverter: IdConverter | null = null;

  override async doConnect(signal?: AbortSignal) {
    const { socket, disconnect } = await super.doConnect(signal);

    try {
      const joinData = {
        spaceType: this.options.type,
        spaceId: this.options.id,
        clientVersion: BUILD_CONFIG.appVersion,
      };

      const res = await socket.emitWithAck('space:join', joinData);

      if ('error' in res) {
        throw new Error(res.error.message);
      }

      if (!this.idConverter) {
        try {
          this.idConverter = await this.getIdConverter(socket);
        } catch (error) {
          // 使用默认的身份转换器作为后备
          this.idConverter = {
            newIdToOldId: (id: string) => id,
            oldIdToNewId: (id: string) => id,
          };
        }
      }

      socket.on('space:broadcast-doc-update', this.onServerUpdate);

      return { socket, disconnect };
    } catch (e) {
      disconnect();
      throw e;
    }
  }

  override doDisconnect({
    socket,
    disconnect,
  }: {
    socket: Socket;
    disconnect: () => void;
  }) {
    socket.emit('space:leave', {
      spaceType: this.options.type,
      spaceId: this.options.id,
    });
    socket.off('space:broadcast-doc-update', this.onServerUpdate);
    super.doDisconnect({ socket, disconnect });
  }

  async getIdConverter(socket: Socket) {
    return getIdConverter(
      {
        getDocBuffer: async id => {
          const response = await socket.emitWithAck('space:load-doc', {
            spaceType: this.options.type,
            spaceId: this.options.id,
            docId: id,
          });

          if ('error' in response) {
            if (response.error.name === 'DOC_NOT_FOUND') {
              return null;
            }
            // TODO: 使用 [用户友好错误]
            throw new Error(response.error.message);
          }

          const missingData = response.data.missing;
          if (!missingData || missingData === '') {
            return null;
          }

          const buffer = base64ToUint8Array(missingData);
          if (!buffer || buffer.length === 0) {
            return null;
          }

          return buffer;
        },
      },
      this.options.id
    );
  }
}
