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
};
