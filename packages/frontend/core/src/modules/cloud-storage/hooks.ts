/**
 * 🔧 性能优化：CloudStorage 细粒度 Hooks
 * 
 * 这些 hooks 基于 useCloudStorage 实现，但使用 useMemo 分离出不同类型的状态，
 * 帮助消费者更精确地选择需要的数据，减少不必要的重新渲染。
 * 
 * 使用建议：
 * - 只需要连接状态 → useCloudStorageConnection
 * - 只需要同步状态 → useCloudStorageSync
 * - 只需要会话信息 → useCloudStorageSession
 * - 只需要操作方法 → useCloudStorageActions
 * - 需要完整状态 → useCloudStorage（原有 hook）
 * 
 * 详见: docs/design/CLOUD-STORAGE-CONTEXT-REFACTOR.md
 */

import { useMemo } from 'react';
import type { Socket } from 'socket.io-client';
import { useCloudStorage } from './provider';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 连接状态类型
 * 变化频率：中（网络状态变化时）
 */
export interface CloudStorageConnection {
  isConnected: boolean;
  storageMode: 'detecting' | 'local' | 'cloud' | 'error';
  isOnline: boolean;
  socket: Socket | null;
}

/**
 * 同步状态类型
 * 变化频率：高（每次同步操作）
 */
export interface CloudStorageSync {
  lastSync: Date | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  pendingOperationsCount: number;
  offlineOperationsCount: number;
}

/**
 * 会话信息类型
 * 变化频率：低（用户加入/离开时）
 */
export interface CloudStorageSession {
  sessionId: string;
  clientId: string | null;
  sessions: Array<{
    sessionId: string;
    label: string;
    clientId: string | null;
    isLocal: boolean;
    lastSeen: number;
  }>;
  currentWorkspaceId: string | null;
}

/**
 * 操作方法类型
 * 变化频率：几乎不变（函数引用稳定）
 */
export interface CloudStorageActions {
  reconnect: () => Promise<void>;
  pushDocUpdate: (docId: string, update: Uint8Array) => Promise<number>;
  syncOfflineOperations: () => Promise<void>;
  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (enabled: boolean) => void;
}

// ============================================================================
// Hooks 实现
// ============================================================================

/**
 * 🔧 性能优化：只获取连接状态
 * 
 * 适用场景：
 * - 显示连接状态指示器
 * - 根据连接状态显示/隐藏 UI 元素
 * 
 * @example
 * ```tsx
 * const { isConnected, storageMode } = useCloudStorageConnection();
 * return <StatusBadge connected={isConnected} mode={storageMode} />;
 * ```
 */
export const useCloudStorageConnection = (): CloudStorageConnection => {
  const ctx = useCloudStorage();
  
  return useMemo(() => ({
    isConnected: ctx.isConnected,
    storageMode: ctx.storageMode,
    isOnline: ctx.isOnline,
    socket: ctx.socket,
  }), [ctx.isConnected, ctx.storageMode, ctx.isOnline, ctx.socket]);
};

/**
 * 🔧 性能优化：只获取同步状态
 * 
 * 适用场景：
 * - 显示同步进度
 * - 显示待处理操作数
 * - 显示最后同步时间
 * 
 * @example
 * ```tsx
 * const { syncStatus, pendingOperationsCount } = useCloudStorageSync();
 * return <SyncProgress status={syncStatus} pending={pendingOperationsCount} />;
 * ```
 */
export const useCloudStorageSync = (): CloudStorageSync => {
  const ctx = useCloudStorage();
  
  return useMemo(() => ({
    lastSync: ctx.lastSync,
    syncStatus: ctx.syncStatus,
    syncError: ctx.syncError,
    pendingOperationsCount: ctx.pendingOperationsCount,
    offlineOperationsCount: ctx.offlineOperationsCount,
  }), [ctx.lastSync, ctx.syncStatus, ctx.syncError, ctx.pendingOperationsCount, ctx.offlineOperationsCount]);
};

/**
 * 🔧 性能优化：只获取会话信息
 * 
 * 适用场景：
 * - 显示协作者列表
 * - 显示当前工作区信息
 * 
 * @example
 * ```tsx
 * const { sessions } = useCloudStorageSession();
 * return <CollaboratorList sessions={sessions} />;
 * ```
 */
export const useCloudStorageSession = (): CloudStorageSession => {
  const ctx = useCloudStorage();
  
  return useMemo(() => ({
    sessionId: ctx.sessionId,
    clientId: ctx.clientId,
    sessions: ctx.sessions,
    currentWorkspaceId: ctx.currentWorkspaceId,
  }), [ctx.sessionId, ctx.clientId, ctx.sessions, ctx.currentWorkspaceId]);
};

/**
 * 🔧 性能优化：只获取操作方法
 * 
 * 适用场景：
 * - 需要调用 reconnect、pushDocUpdate 等方法
 * - 不需要监听状态变化
 * 
 * @example
 * ```tsx
 * const { reconnect, pushDocUpdate } = useCloudStorageActions();
 * const handleSave = () => pushDocUpdate(docId, update);
 * ```
 */
export const useCloudStorageActions = (): CloudStorageActions => {
  const ctx = useCloudStorage();
  
  return useMemo(() => ({
    reconnect: ctx.reconnect,
    pushDocUpdate: ctx.pushDocUpdate,
    syncOfflineOperations: ctx.syncOfflineOperations,
    cloudSyncEnabled: ctx.cloudSyncEnabled,
    setCloudSyncEnabled: ctx.setCloudSyncEnabled,
  }), [ctx.reconnect, ctx.pushDocUpdate, ctx.syncOfflineOperations, ctx.cloudSyncEnabled, ctx.setCloudSyncEnabled]);
};
