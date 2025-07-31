import {
  type DocClock,
  type DocClocks,
  type DocRecord,
  DocStorageBase,
  type DocStorageOptions,
  type DocUpdate,
} from '../../storage';
import { HttpConnection } from './http';

interface CloudDocStorageOptions extends DocStorageOptions {
  serverBaseUrl: string;
}

export class StaticCloudDocStorage extends DocStorageBase<CloudDocStorageOptions> {
  static readonly identifier = 'StaticCloudDocStorage';

  constructor(options: CloudDocStorageOptions) {
    super({ ...options, readonlyMode: true });
  }

  override connection = new HttpConnection(this.options.serverBaseUrl);
  override async pushDocUpdate(
    update: DocUpdate,
    _origin?: string
  ): Promise<DocClock> {
    // http is readonly
    return { docId: update.docId, timestamp: new Date() };
  }
  override async getDocTimestamp(docId: string): Promise<DocClock | null> {
    // http doesn't support this, so we just return a new timestamp
    return {
      docId,
      timestamp: new Date(),
    };
  }
  override async getDocTimestamps(): Promise<DocClocks> {
    // http doesn't support this
    return {};
  }
  override deleteDoc(_docId: string): Promise<void> {
    // http is readonly
    return Promise.resolve();
  }
  protected override async getDocSnapshot(
    docId: string
  ): Promise<DocRecord | null> {
    console.log('🏛️ [StaticCloudDocStorage] 开始获取文档快照 (HTTP):', {
      docId: docId,
      spaceId: this.spaceId,
      baseUrl: this.options.serverBaseUrl,
      url: `/api/workspaces/${this.spaceId}/docs/${docId}`,
      timestamp: new Date().toISOString()
    });

    try {
      const arrayBuffer = await this.connection.fetchArrayBuffer(
        `/api/workspaces/${this.spaceId}/docs/${docId}`,
        {
          priority: 'high',
          headers: {
            Accept: 'application/octet-stream', // this is necessary for ios native fetch to return arraybuffer
          },
        }
      );

      console.log('🏛️ [StaticCloudDocStorage] HTTP响应结果:', {
        docId: docId,
        hasArrayBuffer: !!arrayBuffer,
        bufferSize: arrayBuffer?.byteLength || 0,
        bufferHex: arrayBuffer ? 
          Array.from(new Uint8Array(arrayBuffer).slice(0, 20))
            .map(b => b.toString(16).padStart(2, '0')).join(' ') : 'null'
      });

      if (!arrayBuffer) {
        console.warn('⚠️ [StaticCloudDocStorage] HTTP返回空数据:', { docId });
        return null;
      }

      const result = {
        docId: docId,
        bin: new Uint8Array(arrayBuffer),
        timestamp: new Date(),
      };

      console.log('✅ [StaticCloudDocStorage] 文档快照获取成功:', {
        docId: docId,
        binSize: result.bin.length,
        binHex: Array.from(result.bin.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '),
        timestamp: result.timestamp
      });

      return result;
    } catch (error) {
      console.error('❌ [StaticCloudDocStorage] HTTP请求失败:', {
        docId: docId,
        error: error,
        url: `/api/workspaces/${this.spaceId}/docs/${docId}`
      });
      return null;
    }
  }
  protected override setDocSnapshot(
    _snapshot: DocRecord,
    _prevSnapshot: DocRecord | null
  ): Promise<boolean> {
    // http is readonly
    return Promise.resolve(false);
  }
  protected override getDocUpdates(_docId: string): Promise<DocRecord[]> {
    return Promise.resolve([]);
  }
  protected override markUpdatesMerged(
    _docId: string,
    _updates: DocRecord[]
  ): Promise<number> {
    return Promise.resolve(0);
  }
}
