import { DebugLogger } from '@yunke/debug';
import {
  type BlobStorage,
  type DocStorage,
  type ListedBlobRecord,
  universalId,
} from '@yunke/nbstore';
import {
  IndexedDBBlobStorage,
  IndexedDBBlobSyncStorage,
  IndexedDBDocStorage,
  IndexedDBDocSyncStorage,
} from '@yunke/nbstore/idb';
import {
  IndexedDBV1BlobStorage,
  IndexedDBV1DocStorage,
} from '@yunke/nbstore/idb/v1';
import {
  SqliteBlobStorage,
  SqliteBlobSyncStorage,
  SqliteDocStorage,
  SqliteDocSyncStorage,
} from '@yunke/nbstore/sqlite';
import {
  SqliteV1BlobStorage,
  SqliteV1DocStorage,
} from '@yunke/nbstore/sqlite/v1';
import type { WorkerInitOptions } from '@yunke/nbstore/worker/client';
import type { FrameworkProvider } from '@toeverything/infra';
import { LiveData, Service } from '@toeverything/infra';
import { isEqual } from 'lodash-es';
import { nanoid } from 'nanoid';
import { Observable } from 'rxjs';
import { Doc as YDoc, encodeStateAsUpdate } from 'yjs';

import { DesktopApiService } from '../../desktop-api';
import { appConfigStorage } from '../../../components/hooks/use-app-config-storage';
import type {
  WorkspaceFlavourProvider,
  WorkspaceFlavoursProvider,
  WorkspaceMetadata,
  WorkspaceProfileInfo,
} from '../../workspace';
import { WorkspaceImpl } from '../../workspace/impls/workspace';
import { getWorkspaceProfileWorker } from './out-worker';
import { isFileSystemAccessSupported } from '../../storage/offline-file-handle';

export const LOCAL_WORKSPACE_LOCAL_STORAGE_KEY = 'yunke-local-workspace';
const LOCAL_WORKSPACE_CHANGED_BROADCAST_CHANNEL_KEY =
  'yunke-local-workspace-changed';

const logger = new DebugLogger('local-workspace');

export function getLocalWorkspaceIds(): string[] {
  try {
    return JSON.parse(
      localStorage.getItem(LOCAL_WORKSPACE_LOCAL_STORAGE_KEY) ?? '[]'
    );
  } catch (e) {
    logger.error('获取本地工作区ID失败', e);
    return [];
  }
}

export function setLocalWorkspaceIds(
  idsOrUpdater: string[] | ((ids: string[]) => string[])
) {
  localStorage.setItem(
    LOCAL_WORKSPACE_LOCAL_STORAGE_KEY,
    JSON.stringify(
      typeof idsOrUpdater === 'function'
        ? idsOrUpdater(getLocalWorkspaceIds())
        : idsOrUpdater
    )
  );
}

class LocalWorkspaceFlavourProvider implements WorkspaceFlavourProvider {
  constructor(private readonly framework: FrameworkProvider) {
    // console.log('📍 [LocalWorkspace] 存储类型配置:', {
    //   BUILD_CONFIG_isWeb: BUILD_CONFIG.isWeb,
    //   BUILD_CONFIG_isElectron: BUILD_CONFIG.isElectron,
    //   BUILD_CONFIG_isIOS: BUILD_CONFIG.isIOS,
    //   BUILD_CONFIG_isAndroid: BUILD_CONFIG.isAndroid,
    //   selectedDocStorageType: this.DocStorageType.name || 'IndexedDBDocStorage',
    //   selectedBlobStorageType: this.BlobStorageType.name || 'IndexedDBBlobStorage'
    // });
    logger.info('storage selection', {
      isElectron: BUILD_CONFIG.isElectron,
      isWeb: BUILD_CONFIG.isWeb,
      isIOS: BUILD_CONFIG.isIOS,
      isAndroid: BUILD_CONFIG.isAndroid,
      offlineConfig: appConfigStorage.get('offline'),
      fileSqliteEnabled: this.fileSqliteEnabled,
      docStorage: this.DocStorageType.name,
      blobStorage: this.BlobStorageType.name,
    });
  }

  private readonly fileSqliteEnabled =
    BUILD_CONFIG.isElectron ||
    BUILD_CONFIG.isIOS ||
    BUILD_CONFIG.isAndroid ||
    (BUILD_CONFIG.isWeb &&
      isFileSystemAccessSupported() &&
      Boolean(appConfigStorage.get('offline')?.enabled) &&
      Boolean(appConfigStorage.get('offline')?.dataPath));

  readonly flavour = 'local';
  readonly notifyChannel = new BroadcastChannel(
    LOCAL_WORKSPACE_CHANGED_BROADCAST_CHANNEL_KEY
  );

  DocStorageType =
    // Android Capacitor应用强制使用IndexedDB
    (BUILD_CONFIG.isAndroid && typeof window !== 'undefined' && (window as any).Capacitor) 
      ? IndexedDBDocStorage
    : this.fileSqliteEnabled
      ? SqliteDocStorage
      : IndexedDBDocStorage;
  
  DocStorageV1Type = BUILD_CONFIG.isElectron
    ? SqliteV1DocStorage
    : BUILD_CONFIG.isWeb || BUILD_CONFIG.isMobileWeb
      ? IndexedDBV1DocStorage
      : undefined;
  BlobStorageType =
    // Android Capacitor应用强制使用IndexedDB
    (BUILD_CONFIG.isAndroid && typeof window !== 'undefined' && (window as any).Capacitor) 
      ? IndexedDBBlobStorage
    : this.fileSqliteEnabled
      ? SqliteBlobStorage
      : IndexedDBBlobStorage;
  BlobStorageV1Type = BUILD_CONFIG.isElectron
    ? SqliteV1BlobStorage
    : BUILD_CONFIG.isWeb || BUILD_CONFIG.isMobileWeb
      ? IndexedDBV1BlobStorage
      : undefined;
  DocSyncStorageType =
    // Android Capacitor应用强制使用IndexedDB
    (BUILD_CONFIG.isAndroid && typeof window !== 'undefined' && (window as any).Capacitor) 
      ? IndexedDBDocSyncStorage
    : this.fileSqliteEnabled
      ? SqliteDocSyncStorage
      : IndexedDBDocSyncStorage;
  BlobSyncStorageType =
    // Android Capacitor应用强制使用IndexedDB
    (BUILD_CONFIG.isAndroid && typeof window !== 'undefined' && (window as any).Capacitor) 
      ? IndexedDBBlobSyncStorage
    : this.fileSqliteEnabled
      ? SqliteBlobSyncStorage
      : IndexedDBBlobSyncStorage;

  async deleteWorkspace(id: string): Promise<void> {
    setLocalWorkspaceIds(ids => ids.filter(x => x !== id));

    // TODO(@forehalo): indexeddb工作区的删除逻辑
    if (BUILD_CONFIG.isElectron) {
      const electronApi = this.framework.get(DesktopApiService);
      await electronApi.handler.workspace.moveToTrash(
        universalId({ peer: 'local', type: 'workspace', id })
      );
    }
    // notify all browser tabs, so they can update their workspace list
    this.notifyChannel.postMessage(id);
  }
  async createWorkspace(
    initial: (
      docCollection: WorkspaceImpl,
      blobStorage: BlobStorage,
      docStorage: DocStorage
    ) => Promise<void>
  ): Promise<WorkspaceMetadata> {
    const id = nanoid();

    // save the initial state to local storage, then sync to cloud
    const docStorage = new this.DocStorageType({
      id: id,
      flavour: this.flavour,
      type: 'workspace',
    });
    docStorage.connection.connect();
    await docStorage.connection.waitForConnected();
    const blobStorage = new this.BlobStorageType({
      id: id,
      flavour: this.flavour,
      type: 'workspace',
    });
    blobStorage.connection.connect();
    await blobStorage.connection.waitForConnected();

    const docList = new Set<YDoc>();

    const docCollection = new WorkspaceImpl({
      id: id,
      rootDoc: new YDoc({ guid: id }),
      blobSource: {
        get: async key => {
          const record = await blobStorage.get(key);
          return record ? new Blob([record.data], { type: record.mime }) : null;
        },
        delete: async () => {
          return;
        },
        list: async () => {
          return [];
        },
        set: async (id, blob) => {
          await blobStorage.set({
            key: id,
            data: new Uint8Array(await blob.arrayBuffer()),
            mime: blob.type,
          });
          return id;
        },
        name: 'blob',
        readonly: false,
      },
      onLoadDoc(doc) {
        docList.add(doc);
      },
    });

    try {
      // apply initial state
      await initial(docCollection, blobStorage, docStorage);

      for (const subdocs of docList) {
        await docStorage.pushDocUpdate({
          docId: subdocs.guid,
          bin: encodeStateAsUpdate(subdocs),
        });
      }

      docStorage.connection.disconnect();
      blobStorage.connection.disconnect();

      // save workspace id to local storage
      setLocalWorkspaceIds(ids => [...ids, id]);

      // notify all browser tabs, so they can update their workspace list
      this.notifyChannel.postMessage(id);
    } finally {
      docCollection.dispose();
    }

    return { id, flavour: 'local' };
  }
  workspaces$ = LiveData.from(
    new Observable<WorkspaceMetadata[]>(subscriber => {
      let last: WorkspaceMetadata[] | null = null;
      const emit = () => {
        const ids = getLocalWorkspaceIds();
        // console.log('📁 [LocalWorkspace] 读取本地工作区ID列表:', {
        //   count: ids.length,
        //   ids
        // });
        
        const value = ids.map(id => ({
          id,
          flavour: 'local',
        }));
        
        // console.log('📁 [LocalWorkspace] 构造工作区元数据列表:', {
        //   count: value.length,
        //   workspaces: value.map(w => ({ id: w.id, flavour: w.flavour }))
        // });
        
        if (isEqual(last, value)) {
          // console.log('📁 [LocalWorkspace] 工作区列表未变化，跳过发送');
          return;
        }
        
        // console.log('📁 [LocalWorkspace] 工作区列表已变化，发送更新');
        subscriber.next(value);
        last = value;
      };

      emit();
      const channel = new BroadcastChannel(
        LOCAL_WORKSPACE_CHANGED_BROADCAST_CHANNEL_KEY
      );
      channel.addEventListener('message', emit);

      return () => {
        channel.removeEventListener('message', emit);
        channel.close();
      };
    }),
    []
  );
  isRevalidating$ = new LiveData(false);
  revalidate(): void {
    // notify livedata to re-scan workspaces
    this.notifyChannel.postMessage(null);
  }

  async getWorkspaceProfile(
    id: string
  ): Promise<WorkspaceProfileInfo | undefined> {
    const docStorage = new this.DocStorageType({
      id: id,
      flavour: this.flavour,
      type: 'workspace',
      readonlyMode: true,
    });
    docStorage.connection.connect();
    await docStorage.connection.waitForConnected();
    const localData = await docStorage.getDoc(id);

    docStorage.connection.disconnect();

    if (!localData) {
      return {
        isOwner: true,
      };
    }

    const client = getWorkspaceProfileWorker();

    const result = await client.call(
      'renderWorkspaceProfile',
      [localData.bin].filter(Boolean) as Uint8Array[]
    );

    return {
      name: result.name,
      avatar: result.avatar,
      isOwner: true,
    };
  }

  async getWorkspaceBlob(id: string, blobKey: string): Promise<Blob | null> {
    const storage = new this.BlobStorageType({
      id: id,
      flavour: this.flavour,
      type: 'workspace',
    });
    storage.connection.connect();
    await storage.connection.waitForConnected();
    const blob = await storage.get(blobKey);
    return blob ? new Blob([blob.data], { type: blob.mime }) : null;
  }

  async listBlobs(id: string): Promise<ListedBlobRecord[]> {
    const storage = new this.BlobStorageType({
      id: id,
      flavour: this.flavour,
      type: 'workspace',
    });
    storage.connection.connect();
    await storage.connection.waitForConnected();

    return storage.list();
  }

  async deleteBlob(
    id: string,
    blob: string,
    permanent: boolean
  ): Promise<void> {
    const storage = new this.BlobStorageType({
      id: id,
      flavour: this.flavour,
      type: 'workspace',
    });
    storage.connection.connect();
    await storage.connection.waitForConnected();
    await storage.delete(blob, permanent);
  }

  getEngineWorkerInitOptions(workspaceId: string): WorkerInitOptions {
    return {
      local: {
        doc: {
          name: this.DocStorageType.identifier,
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
        blob: {
          name: this.BlobStorageType.identifier,
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
        blobSync: {
          name: this.BlobSyncStorageType.identifier,
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
        docSync: {
          name: this.DocSyncStorageType.identifier,
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
        awareness: {
          name: 'BroadcastChannelAwarenessStorage',
          opts: {
            id: workspaceId,
          },
        },
        indexer: {
          name: 'IndexedDBIndexerStorage',
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
        indexerSync: {
          name: 'IndexedDBIndexerSyncStorage',
          opts: {
            flavour: this.flavour,
            type: 'workspace',
            id: workspaceId,
          },
        },
      },
      remotes: {
        v1: {
          doc: this.DocStorageV1Type
            ? {
                name: this.DocStorageV1Type.identifier,
                opts: {
                  id: workspaceId,
                  type: 'workspace',
                },
              }
            : undefined,
          blob: this.BlobStorageV1Type
            ? {
                name: this.BlobStorageV1Type.identifier,
                opts: {
                  id: workspaceId,
                  type: 'workspace',
                },
              }
            : undefined,
        },
      },
    };
  }
}

export class LocalWorkspaceFlavoursProvider
  extends Service
  implements WorkspaceFlavoursProvider
{
  constructor() {
    super();
  }

  workspaceFlavours$ = new LiveData<WorkspaceFlavourProvider[]>([
    new LocalWorkspaceFlavourProvider(this.framework),
  ]);
}
