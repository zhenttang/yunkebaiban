import type { Socket } from 'socket.io-client';

/**
 * Electron SharedStorage 类型声明（用于跨进程状态共享）
 */
export interface SharedStorageGlobal {
  __sharedStorage?: {
    globalState?: {
      get: (key: string) => string | null;
      set: (key: string, value: string) => void;
      del: (key: string) => void;
    };
  };
}

/**
 * 会话显示信息
 */
export interface SessionDisplayInfo {
  sessionId: string;
  label: string;
  clientId: string | null;
  isLocal: boolean;
  lastSeen: number;
}

/**
 * 全局调试变量类型声明（用于 DevTools 调试）
 */
export interface CloudStorageDebugWindow {
  __CLOUD_STORAGE_MANAGER__?: CloudStorageStatus;
  __NBSTORE_SESSION_ID__?: string;
}

/**
 * 云存储状态接口
 */
export interface CloudStorageStatus {
  isConnected: boolean;
  storageMode: 'detecting' | 'local' | 'cloud' | 'error';
  lastSync: Date | null;
  socket: Socket | null;
  reconnect: () => Promise<void>;
  pushDocUpdate: (docId: string, update: Uint8Array) => Promise<number>;
  currentWorkspaceId: string | null;
  isOnline: boolean;
  pendingOperationsCount: number;
  offlineOperationsCount: number;
  syncOfflineOperations: () => Promise<void>;
  sessionId: string;
  clientId: string | null;
  sessions: SessionDisplayInfo[];
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  syncError: string | null;
  cloudSyncEnabled: boolean;
  setCloudSyncEnabled: (enabled: boolean) => void;
}

/**
 * CloudStorageProvider 组件属性
 */
export interface CloudStorageProviderProps {
  children: React.ReactNode;
  serverUrl?: string;
  autoConnect?: boolean;
  workspaceId?: string;
}
