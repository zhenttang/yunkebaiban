export type PluginPermission =
  | 'ui:toolbar'
  | 'ui:panel'
  | 'command:register'
  | 'doc:read'
  | 'doc:write'
  | 'storage:local'
  | 'net:fetch';

export type PluginEngine = {
  minVersion: string;
  apiVersion: string;
};

export type PluginToolbarContribution = {
  id: string;
  label: string;
  icon?: string;
  command?: string;
  scope?: 'page' | 'edgeless' | 'global';
};

export type PluginCommandContribution = {
  id: string;
  label: string;
};

export type PluginSettingContribution = {
  id: string;
  label: string;
};

export type PluginContributes = {
  toolbar?: PluginToolbarContribution[];
  command?: PluginCommandContribution[];
  setting?: PluginSettingContribution[];
};

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  entry: string;
  engine: PluginEngine;
  permissions: PluginPermission[];
  contributes?: PluginContributes;
};

export type PluginRecord = {
  manifest: PluginManifest;
  enabled: boolean;
  installedAt: string;
  updatedAt?: string;
  source: 'local' | 'builtin';
  entrySource?: string;
};

export type PluginInstallOptions = {
  enabled?: boolean;
  source?: PluginRecord['source'];
  entrySource?: string;
};
