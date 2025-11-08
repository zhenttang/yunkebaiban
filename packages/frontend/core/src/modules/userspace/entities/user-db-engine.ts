// import { ServerDeploymentType } from '@yunke/graphql';
import { ServerDeploymentType } from '../../cloud/types';
import {
  IndexedDBDocStorage,
  IndexedDBDocSyncStorage,
} from '@yunke/nbstore/idb';
import { SqliteDocStorage, SqliteDocSyncStorage } from '@yunke/nbstore/sqlite';
import type { StoreClient } from '@yunke/nbstore/worker/client';
import { Entity } from '@toeverything/infra';

import type { ServerService } from '../../cloud';
import type { NbstoreService } from '../../storage';

export class UserDBEngine extends Entity<{
  userId: string;
}> {
  private readonly userId = this.props.userId;
  readonly client: StoreClient;

  DocStorageType =
    // Android Capacitor应用强制使用IndexedDB
    (BUILD_CONFIG.isAndroid && typeof window !== 'undefined' && (window as any).Capacitor) 
      ? IndexedDBDocStorage
    : BUILD_CONFIG.isElectron || BUILD_CONFIG.isIOS || BUILD_CONFIG.isAndroid
      ? SqliteDocStorage
      : IndexedDBDocStorage;
  DocSyncStorageType =
    // Android Capacitor应用强制使用IndexedDB
    (BUILD_CONFIG.isAndroid && typeof window !== 'undefined' && (window as any).Capacitor) 
      ? IndexedDBDocSyncStorage
    : BUILD_CONFIG.isElectron || BUILD_CONFIG.isIOS || BUILD_CONFIG.isAndroid
      ? SqliteDocSyncStorage
      : IndexedDBDocSyncStorage;

  canGracefulStop() {
    // TODO(@eyhn): Implement this
    return true;
  }

  constructor(
    private readonly nbstoreService: NbstoreService,
    serverService: ServerService
  ) {
    super();

    const serverBaseUrl = serverService.server.serverMetadata.baseUrl;
    const isSelfHosted = serverService.server.serverMetadata.type === ServerDeploymentType.Selfhosted;

    const { store, dispose } = this.nbstoreService.openStore(
      `userspace:${serverService.server.id},${this.userId}`,
      {
        local: {
          doc: {
            name: this.DocStorageType.identifier,
            opts: {
              type: 'userspace',
              flavour: serverService.server.id,
              id: this.userId,
            },
          },
          docSync: {
            name: this.DocSyncStorageType.identifier,
            opts: {
              type: 'userspace',
              flavour: serverService.server.id,
              id: this.userId,
            },
          },
        },
        // ✅ UserDB 也使用云端存储
        remotes: {
          [`cloud:${serverService.server.id}`]: {
            doc: {
              name: 'CloudDocStorage',
              opts: {
                type: 'userspace',
                id: this.userId,
                serverBaseUrl: serverBaseUrl,
                isSelfHosted: isSelfHosted,
              },
            },
          },
        },
      }
    );
    this.client = store;
    this.client.docFrontend.start();
    this.disposables.push(() => dispose());
  }
}
