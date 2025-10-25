import type { Socket } from 'socket.io-client';
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
    sessions: Array<{
        sessionId: string;
        label: string;
        clientId: string | null;
        isLocal: boolean;
        lastSeen: number;
    }>;
}
export declare const useCloudStorage: () => CloudStorageStatus;
interface CloudStorageProviderProps {
    children: React.ReactNode;
    serverUrl?: string;
}
export declare const CloudStorageProvider: ({ children, serverUrl }: CloudStorageProviderProps) => import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=cloud-storage-manager.d.ts.map
