// import { ServerDeploymentType } from '@affine/graphql';
import { ServerDeploymentType } from '../../cloud/types';
import {
  IndexedDBDocStorage,
  IndexedDBDocSyncStorage,
} from '@affine/nbstore/idb';
import { SqliteDocStorage, SqliteDocSyncStorage } from '@affine/nbstore/sqlite';
import type { StoreClient } from '@affine/nbstore/worker/client';
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

    // 简洁调试：确认 userspace 远端 CloudDocStorage 配置是否生效
    try {
      // 仅打印一行关键信息，避免刷屏
      // eslint-disable-next-line no-console
      console.log(
        `[UserDBEngine] init remotes: CloudDocStorage serverBaseUrl=${serverService.server.baseUrl} type=userspace userId=${this.userId}`
      );
    } catch {}

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
        // ⚠️ UserDB 不使用云存储 - 用户设置只存本地
        // 工作空间文档才需要云同步
        remotes: {},
      }
    );
    this.client = store;
    this.client.docFrontend.start();
    this.disposables.push(() => dispose());
  }
}
