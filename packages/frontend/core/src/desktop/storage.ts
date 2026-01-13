import { DesktopApiService } from '@yunke/core/modules/desktop-api';
import {
  CacheStorage,
  GlobalCache,
  GlobalState,
} from '@yunke/core/modules/storage';
import {
  ElectronGlobalCache,
  ElectronGlobalState,
} from '@yunke/core/modules/storage/impls/electron';
import { IDBGlobalState } from '@yunke/core/modules/storage/impls/storage';
import type { Framework } from '@toeverything/infra';

export function configureElectronStateStorageImpls(framework: Framework) {
  framework.impl(GlobalCache, ElectronGlobalCache, [DesktopApiService]);
  framework.impl(GlobalState, ElectronGlobalState, [DesktopApiService]);
  framework.impl(CacheStorage, IDBGlobalState);
}
