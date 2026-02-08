import type { MainEventRegister } from '../type';
import {
  deleteBackupWorkspace,
  deleteWorkspaceStorageFile,
  deleteWorkspace,
  getDefaultDataPath,
  getWorkspaceStoragePath,
  getDeletedWorkspaces,
  migrateAllDataToPath,
  migrateWorkspaceStoragePath,
  showWorkspaceStorageInFolder,
  trashWorkspace,
  // NEW-2: 自动备份
  createWorkspaceBackup,
  createAllWorkspaceBackups,
  listWorkspaceBackups,
  restoreWorkspaceFromBackup,
  deleteWorkspaceBackup as deleteWsBackup,
  startAutoBackup,
  stopAutoBackup,
  getAutoBackupStatus,
} from './handlers';

export * from './handlers';
export * from './subjects';

export const workspaceEvents = {} as Record<string, MainEventRegister>;

export const workspaceHandlers = {
  delete: deleteWorkspace,
  moveToTrash: trashWorkspace,
  getBackupWorkspaces: async () => {
    return getDeletedWorkspaces();
  },
  deleteBackupWorkspace: async (id: string) => deleteBackupWorkspace(id),
  getStoragePath: getWorkspaceStoragePath,
  showStorageInFolder: showWorkspaceStorageInFolder,
  migrateStoragePath: migrateWorkspaceStoragePath,
  deleteStorageFile: deleteWorkspaceStorageFile,
  getDefaultDataPath: getDefaultDataPath,
  migrateAllDataToPath: migrateAllDataToPath,
  // NEW-2: 自动备份 API
  createBackup: async (workspaceId: string) => createWorkspaceBackup(workspaceId),
  createAllBackups: async () => createAllWorkspaceBackups(),
  listBackups: async (workspaceId?: string) => listWorkspaceBackups(workspaceId),
  restoreFromBackup: async (backupId: string) => restoreWorkspaceFromBackup(backupId),
  deleteBackup: async (backupId: string) => deleteWsBackup(backupId),
  startAutoBackup: async () => startAutoBackup(),
  stopAutoBackup: async () => stopAutoBackup(),
  getAutoBackupStatus: async () => getAutoBackupStatus(),
};
