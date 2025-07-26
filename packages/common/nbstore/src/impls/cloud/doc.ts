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
    const response = await this.socket.emitWithAck('space:load-doc', {
      spaceType: this.spaceType,
      spaceId: this.spaceId,
      docId: this.idConverter.newIdToOldId(docId),
    });

    if ('error' in response) {
      if (response.error.name === 'DOC_NOT_FOUND') {
        return null;
      }
      // TODO: 使用 [用户友好错误]
      throw new Error(response.error.message);
    }

    return {
      docId,
      bin: base64ToUint8Array(response.data.missing),
      timestamp: new Date(response.data.timestamp),
    };
  }

  override async getDocDiff(docId: string, state?: Uint8Array) {
    // 使用HTTP REST API替代WebSocket
    const oldDocId = this.idConverter.newIdToOldId(docId);
    const url = new URL(`${this.options.serverBaseUrl}/api/workspaces/${this.spaceId}/docs/${oldDocId}`);
    
    if (state) {
      url.searchParams.set('stateVector', await uint8ArrayToBase64(state));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-affine-version': '0.17.0',
      },
      credentials: 'include',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get doc diff: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      if (data.error?.name === 'DOC_NOT_FOUND') {
        return null;
      }
      throw new Error(data.error?.message || 'Failed to get doc diff');
    }

    return {
      docId,
      missing: base64ToUint8Array(data.missing),
      state: base64ToUint8Array(data.state),
      timestamp: new Date(data.timestamp),
    };
  }

  override async pushDocUpdate(update: DocUpdate) {
    const updateBase64 = await uint8ArrayToBase64(update.bin);
    const docId = this.idConverter?.newIdToOldId(update.docId) || update.docId;
    
    console.log('🚀 [NBStore-CloudDocStorage] 开始处理文档更新推送');
    console.log('  📊 文档信息:', {
      originalDocId: update.docId,
      convertedDocId: docId,
      spaceId: this.spaceId,
      spaceType: this.options.type
    });
    console.log('  📦 数据信息:', {
      updateSize: update.bin.length,
      base64Size: updateBase64.length,
      timestamp: update.timestamp?.getTime() || Date.now(),
      hasTimestamp: !!update.timestamp
    });
    
    // 首先尝试使用全局云存储管理器
    console.log('  🔍 检查全局云存储管理器...');
    try {
      const cloudStorageManager = (window as any).__CLOUD_STORAGE_MANAGER__;
      console.log('  📋 云存储管理器状态:', {
        exists: !!cloudStorageManager,
        isConnected: cloudStorageManager?.isConnected,
        hasPushMethod: !!cloudStorageManager?.pushDocUpdate
      });
      
      if (cloudStorageManager && cloudStorageManager.isConnected && cloudStorageManager.pushDocUpdate) {
        console.log('  📡 使用云存储管理器进行推送...');
        const timestamp = await cloudStorageManager.pushDocUpdate(docId, update.bin);
        console.log('✅ [NBStore-CloudDocStorage] 云存储管理器推送成功');
        console.log('  📊 结果: timestamp =', timestamp);
        return;
      } else {
        console.log('  ⚠️ 云存储管理器不可用，准备降级到Socket.IO');
      }
    } catch (error) {
      console.warn('⚠️ [NBStore-CloudDocStorage] 云存储管理器推送失败，降级到Socket.IO');
      console.warn('  🔍 错误详情:', error);
    }
    
    // 降级到原始Socket.IO方法
    
    if (!this.connection.inner.socket?.connected) {
      console.error('❌ [NBStore-CloudDocStorage] Socket未连接，无法保存文档');
      console.error('  🔍 连接详情:', {
        socket: !!this.connection.inner.socket,
        connected: this.connection.inner.socket?.connected,
        readyState: this.connection.inner.socket?.connected ? 'connected' : 'disconnected'
      });
      throw new Error('Socket.IO connection not established');
    }
    
    try {
      console.log('  📤 使用Socket.IO推送文档更新...');
      const requestData = {
        spaceType: this.options.type,
        spaceId: this.spaceId,
        docId: docId,
        update: updateBase64
      };
      console.log('  📋 Socket.IO请求数据:', {
        ...requestData,
        update: `${updateBase64.substring(0, 50)}...(${updateBase64.length}字符)`
      });
      
      const result = await this.connection.inner.socket.emitWithAck('space:push-doc-update', requestData);
      
      console.log('  📥 收到Socket.IO服务器响应:', result);
      
      if ('error' in result) {
        console.error('❌ [NBStore-CloudDocStorage] Socket.IO服务器返回错误:', result.error);
        throw new Error(`Socket.IO error: ${result.error.message}`);
      }
      
      console.log('✅ [NBStore-CloudDocStorage] Socket.IO文档更新推送成功');
      console.log('  📊 推送结果: timestamp =', result.timestamp);
      
    } catch (error) {
      console.error('💥 [NBStore-CloudDocStorage] Socket.IO推送失败');
      console.error('  🔍 错误类型:', error?.constructor?.name);
      console.error('  📋 错误消息:', error?.message);
      console.error('  📚 完整错误:', error);
      throw error;
    }
  }

  /**
   * Just a rough implementation, cloud doc storage should not need this method.
   */
  override async getDocTimestamp(docId: string): Promise<DocClock | null> {
    // 使用HTTP REST API获取文档时间戳
    const oldDocId = this.idConverter.newIdToOldId(docId);
    
    const response = await fetch(`${this.options.serverBaseUrl}/api/workspaces/${this.spaceId}/docs/${oldDocId}/timestamp`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-affine-version': '0.17.0',
      },
      credentials: 'include',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to get doc timestamp: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to get doc timestamp');
    }

    return {
      docId,
      timestamp: new Date(data.timestamp),
    };
  }

  override async getDocTimestamps(after?: Date) {
    // 使用HTTP REST API获取文档时间戳列表
    const url = new URL(`${this.options.serverBaseUrl}/api/workspaces/${this.spaceId}/docs/timestamps`);
    
    if (after) {
      url.searchParams.set('after', after.getTime().toString());
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-affine-version': '0.17.0',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to get doc timestamps: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'Failed to get doc timestamps');
    }

    return Object.entries(data.timestamps).reduce((ret, [docId, timestamp]) => {
      ret[this.idConverter.oldIdToNewId(docId)] = new Date(timestamp as number);
      return ret;
    }, {} as DocClocks);
  }

  override async deleteDoc(docId: string) {
    // 使用HTTP REST API删除文档
    const oldDocId = this.idConverter.newIdToOldId(docId);
    
    const response = await fetch(`${this.options.serverBaseUrl}/api/workspaces/${this.spaceId}/docs/${oldDocId}`, {
      method: 'DELETE',
      headers: {
        'x-affine-version': '0.17.0',
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
    // 为Socket.IO连接使用专用端口9092
    const socketUrl = options.serverBaseUrl.replace(':8080', ':9092');
    super(socketUrl, options.isSelfHosted);
  }

  idConverter: IdConverter | null = null;

  override async doConnect(signal?: AbortSignal) {
    const { socket, disconnect } = await super.doConnect(signal);

    try {
      const res = await socket.emitWithAck('space:join', {
        spaceType: this.options.type,
        spaceId: this.options.id,
        clientVersion: BUILD_CONFIG.appVersion,
      });

      if ('error' in res) {
        throw new Error(res.error.message);
      }

      if (!this.idConverter) {
        this.idConverter = await this.getIdConverter(socket);
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

          return base64ToUint8Array(response.data.missing);
        },
      },
      this.options.id
    );
  }
}
