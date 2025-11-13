import {
  type AwarenessRecord,
  AwarenessStorageBase,
} from '../../storage/awareness';
import type { SpaceType } from '../../utils/universal-id';
import {
  base64ToUint8Array,
  SocketConnection,
  uint8ArrayToBase64,
} from './socket';
import { getSocketIOUrl } from '@yunke/config';

/**
 * 将API基础URL转换为Socket.IO URL
 * 修复 Bug #4: 使用传入的 serverBaseUrl 而不是硬编码的全局URL
 */
function convertToSocketIOUrl(baseUrl: string): string {
  try {
    // 如果提供了自定义 serverBaseUrl，从中推导 Socket.IO URL
    if (baseUrl) {
      const url = new URL(baseUrl);

      // 转换协议: http -> ws, https -> wss
      url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';

      // Socket.IO 路径通常是 /socket.io
      url.pathname = '/socket.io';

      return url.toString();
    }

    // 降级到全局配置（仅当没有提供 baseUrl 时）
    return getSocketIOUrl();
  } catch (error) {
    console.error('Failed to convert serverBaseUrl to Socket.IO URL:', baseUrl, error);
    // 出错时降级到全局配置
    return getSocketIOUrl();
  }
}

interface CloudAwarenessStorageOptions {
  isSelfHosted: boolean;
  serverBaseUrl: string;
  type: SpaceType;
  id: string;
}

export class CloudAwarenessStorage extends AwarenessStorageBase {
  static readonly identifier = 'CloudAwarenessStorage';

  constructor(private readonly options: CloudAwarenessStorageOptions) {
    super();
  }

  connection = new SocketConnection(
    // 使用统一的端口转换逻辑
    convertToSocketIOUrl(this.options.serverBaseUrl),
    this.options.isSelfHosted
  );

  private get socket() {
    return this.connection.inner.socket;
  }

  override async update(record: AwarenessRecord): Promise<void> {
    const encodedUpdate = await uint8ArrayToBase64(record.bin);
    this.socket.emit('space:update-awareness', {
      spaceType: this.options.type,
      spaceId: this.options.id,
      docId: record.docId,
      awarenessUpdate: encodedUpdate,
    });
  }

  override subscribeUpdate(
    id: string,
    onUpdate: (update: AwarenessRecord, origin?: string) => void,
    onCollect: () => Promise<AwarenessRecord | null>
  ): () => void {
    // leave awareness
    const leave = () => {
      if (this.connection.status !== 'connected') return;
      this.socket.off('space:collect-awareness', handleCollectAwareness);
      this.socket.off(
        'space:broadcast-awareness-update',
        handleBroadcastAwarenessUpdate
      );
      this.socket.emit('space:leave-awareness', {
        spaceType: this.options.type,
        spaceId: this.options.id,
        docId: id,
      });
    };

    // join awareness, and collect awareness from others
    const joinAndCollect = async () => {
      this.socket.on('space:collect-awareness', handleCollectAwareness);
      this.socket.on(
        'space:broadcast-awareness-update',
        handleBroadcastAwarenessUpdate
      );
      await this.socket.emitWithAck('space:join-awareness', {
        spaceType: this.options.type,
        spaceId: this.options.id,
        docId: id,
        clientVersion: BUILD_CONFIG.appVersion,
      });
      this.socket.emit('space:load-awarenesses', {
        spaceType: this.options.type,
        spaceId: this.options.id,
        docId: id,
      });
    };

    const handleCollectAwareness = ({
      spaceId,
      spaceType,
      docId,
    }: {
      spaceId: string;
      spaceType: string;
      docId: string;
    }) => {
      if (
        spaceId === this.options.id &&
        spaceType === this.options.type &&
        docId === id
      ) {
        (async () => {
          const record = await onCollect();
          if (record) {
            const encodedUpdate = await uint8ArrayToBase64(record.bin);
            this.socket.emit('space:update-awareness', {
              spaceType: this.options.type,
              spaceId: this.options.id,
              docId: record.docId,
              awarenessUpdate: encodedUpdate,
            });
          }
        })().catch(err => console.error('awareness upload failed', err));
      }
    };

    const handleBroadcastAwarenessUpdate = ({
      spaceType,
      spaceId,
      docId,
      awarenessUpdate,
    }: {
      spaceType: string;
      spaceId: string;
      docId: string;
      awarenessUpdate: string;
    }) => {
      if (
        spaceId === this.options.id &&
        spaceType === this.options.type &&
        docId === id
      ) {
        onUpdate({
          bin: base64ToUint8Array(awarenessUpdate),
          docId: id,
        });
      }
    };

    if (this.connection.status === 'connected') {
      joinAndCollect().catch(err =>
        console.error('awareness join failed', err)
      );
    }

    const unsubscribeConnectionStatusChanged = this.connection.onStatusChanged(
      status => {
        if (status === 'connected') {
          joinAndCollect().catch(err =>
            console.error('awareness join failed', err)
          );
        }
      }
    );

    return () => {
      leave();

      unsubscribeConnectionStatusChanged();
    };
  }
}
