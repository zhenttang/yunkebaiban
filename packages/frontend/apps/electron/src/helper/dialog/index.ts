import {
  loadDBFile,
  saveDBFileAs,
  selectDBFilePath,
  selectDBFileLocation,
  setFakeDialogResult,
} from './dialog';

export const dialogHandlers = {
  loadDBFile: async (dbFilePath?: string) => {
    return loadDBFile(dbFilePath);
  },
  saveDBFileAs: async (universalId: string, name: string) => {
    return saveDBFileAs(universalId, name);
  },
  selectDBFileLocation: async () => {
    return selectDBFileLocation();
  },
  selectDBFilePath: async (name: string, id: string) => {
    return selectDBFilePath(name, id);
  },
  setFakeDialogResult: async (
    result: Parameters<typeof setFakeDialogResult>[0]
  ) => {
    return setFakeDialogResult(result);
  },
};
