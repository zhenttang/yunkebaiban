import { type Framework } from '@toeverything/infra';

import { ServersService } from '../cloud/services/servers';
import { GlobalState } from '../storage';
import { WorkspaceFlavoursProvider } from '../workspace';
import { CloudWorkspaceFlavoursProvider } from './impls/cloud';
import {
  LOCAL_WORKSPACE_LOCAL_STORAGE_KEY,
  LocalWorkspaceFlavoursProvider,
} from './impls/local';

export { base64ToUint8Array, uint8ArrayToBase64 } from './utils/base64';

export function configureBrowserWorkspaceFlavours(framework: Framework) {
  framework
    // ❌ [纯云存储模式] 禁用本地工作区，只使用云存储
    // .impl(WorkspaceFlavoursProvider('LOCAL'), LocalWorkspaceFlavoursProvider)
    .impl(WorkspaceFlavoursProvider('CLOUD'), CloudWorkspaceFlavoursProvider, [
      GlobalState,
      ServersService,
    ]);
}

/**
 * 直接将本地工作区添加到工作区列表的hack方法
 * Used after copying sqlite database file to appdata folder
 */
export function _addLocalWorkspace(id: string) {
  const allWorkspaceIDs: string[] = JSON.parse(
    localStorage.getItem(LOCAL_WORKSPACE_LOCAL_STORAGE_KEY) ?? '[]'
  );
  allWorkspaceIDs.push(id);
  localStorage.setItem(
    LOCAL_WORKSPACE_LOCAL_STORAGE_KEY,
    JSON.stringify(allWorkspaceIDs)
  );
}
