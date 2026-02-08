/**
 * 文档级同步状态 Hook
 *
 * 提供单个文档的同步状态信息，用于在编辑器状态栏或文档列表中显示。
 *
 * 状态含义：
 *   - synced:   ✅ 已同步到云端
 *   - syncing:  🔄 正在同步
 *   - pending:  ⏳ 有待上传的本地更改
 *   - error:    ❌ 同步失败
 *   - offline:  📴 离线模式（无网络）
 *   - local:    💾 纯本地（未启用云同步）
 */
import { useLiveData, useService } from '@toeverything/infra';
import { useMemo } from 'react';

import { WorkspaceService } from '../../modules/workspace';
import { useSystemOnline } from './use-system-online';

export type DocSyncStatusType =
  | 'synced'
  | 'syncing'
  | 'pending'
  | 'error'
  | 'offline'
  | 'local';

export interface DocSyncStatus {
  status: DocSyncStatusType;
  label: string;
  icon: string;
  errorMessage: string | null;
}

const STATUS_CONFIG: Record<DocSyncStatusType, { label: string; icon: string }> = {
  synced: { label: '已同步', icon: '✅' },
  syncing: { label: '同步中', icon: '🔄' },
  pending: { label: '待上传', icon: '⏳' },
  error: { label: '同步失败', icon: '❌' },
  offline: { label: '离线', icon: '📴' },
  local: { label: '本地', icon: '💾' },
};

/**
 * 获取文档的实时同步状态
 *
 * @param docId 文档 ID
 * @returns DocSyncStatus 对象
 */
export function useDocSyncStatus(docId: string | null): DocSyncStatus {
  const isOnline = useSystemOnline();
  const workspaceService = useService(WorkspaceService);

  const docState$ = useMemo(() => {
    if (!docId) return null;
    try {
      return workspaceService.workspace.engine.doc.docState$(docId);
    } catch {
      return null;
    }
  }, [docId, workspaceService]);

  const docState = useLiveData(docState$);

  return useMemo<DocSyncStatus>(() => {
    // 无文档 ID
    if (!docId || !docState) {
      const cfg = STATUS_CONFIG.local;
      return { status: 'local', ...cfg, errorMessage: null };
    }

    // 离线
    if (!isOnline) {
      const cfg = STATUS_CONFIG.offline;
      return { status: 'offline', ...cfg, errorMessage: null };
    }

    // 同步错误
    if (docState.syncErrorMessage) {
      const cfg = STATUS_CONFIG.error;
      return { status: 'error', ...cfg, errorMessage: docState.syncErrorMessage };
    }

    // 正在同步
    if (docState.syncing) {
      const cfg = STATUS_CONFIG.syncing;
      return { status: 'syncing', ...cfg, errorMessage: null };
    }

    // 有待保存的本地更新
    if (docState.updating) {
      const cfg = STATUS_CONFIG.pending;
      return { status: 'pending', ...cfg, errorMessage: null };
    }

    // 已同步
    if (docState.synced) {
      const cfg = STATUS_CONFIG.synced;
      return { status: 'synced', ...cfg, errorMessage: null };
    }

    // 已加载但未同步（本地模式）
    if (docState.loaded) {
      const cfg = STATUS_CONFIG.local;
      return { status: 'local', ...cfg, errorMessage: null };
    }

    // 默认
    const cfg = STATUS_CONFIG.local;
    return { status: 'local', ...cfg, errorMessage: null };
  }, [docId, docState, isOnline]);
}
