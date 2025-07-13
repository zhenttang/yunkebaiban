import type { DesktopApiProvider } from '../provider';

// Web环境下的桌面API空实现
export class WebDesktopApiImpl implements DesktopApiProvider {
  handler = {
    ui: {
      pingAppLayoutReady: async () => {},
      restartApp: async () => {},
    },
    updater: {
      quitAndInstall: async () => {},
    },
    workspace: {
      getBackupWorkspaces: async () => [],
      deleteBackupWorkspace: async () => {},
    },
    dialog: {
      loadDBFile: async () => {},
    },
    recording: {
      setupRecordingFeature: async () => {},
      getCurrentRecording: async () => null,
      disableRecordingFeature: async () => {},
      checkRecordingAvailable: async () => false,
      checkMeetingPermissions: async () => false,
      showRecordingPermissionSetting: async () => {},
      askForMeetingPermission: async () => false,
      showSavedRecordings: async () => {},
    },
  };

  events = { on: () => {}, off: () => {} };
  sharedStorage = { get: () => null, set: () => {}, clear: () => {} };
  appInfo = {
    platform: 'web',
    version: '0.0.0',
    isElectron: false,
  };

  isElectron = false;
} 