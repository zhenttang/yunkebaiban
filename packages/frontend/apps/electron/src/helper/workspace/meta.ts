import path from 'node:path';

import { appConfigSchema, defaultAppConfig } from '@toeverything/infra';
import { type SpaceType } from '@yunke/nbstore';
import fs from 'fs-extra';

import { isWindows } from '../../shared/utils';
import { logger } from '../logger';
import { mainRPC } from '../main-rpc';
import type { WorkspaceMeta } from '../type';

const fallbackOfflineConfig = {
  enabled: false,
  dataPath: '',
};

let _appDataPath = '';
let _offlineConfig:
  | (typeof defaultAppConfig)['offline']
  | typeof fallbackOfflineConfig
  | null = null;

async function getAppConfigPath() {
  const userDataPath = await mainRPC.getPath('userData');
  return path.join(userDataPath, 'config.json');
}

async function getOfflineConfig() {
  if (_offlineConfig) {
    return _offlineConfig;
  }
  try {
    const configPath = await getAppConfigPath();
    if (await fs.pathExists(configPath)) {
      const raw = await fs.readJson(configPath);
      const rawOffline = raw?.offline;
      if (rawOffline && typeof rawOffline === 'object') {
        _offlineConfig = {
          ...fallbackOfflineConfig,
          ...(defaultAppConfig as typeof fallbackOfflineConfig | any).offline,
          enabled:
            typeof (rawOffline as { enabled?: unknown }).enabled === 'boolean'
              ? (rawOffline as { enabled?: boolean }).enabled ?? false
              : fallbackOfflineConfig.enabled,
          dataPath:
            typeof (rawOffline as { dataPath?: unknown }).dataPath === 'string'
              ? (rawOffline as { dataPath?: string }).dataPath ?? ''
              : fallbackOfflineConfig.dataPath,
        };
        logger.info('[offline] loaded config from file', {
          path: configPath,
          offline: _offlineConfig,
        });
        return _offlineConfig;
      }
      const parsed = appConfigSchema.safeParse(raw);
      if (parsed.success) {
        _offlineConfig =
          parsed.data.offline ?? (defaultAppConfig as any).offline ?? fallbackOfflineConfig;
        logger.info('[offline] loaded config (schema)', {
          path: configPath,
          offline: _offlineConfig,
        });
        return _offlineConfig;
      }
    }
  } catch {
    // ignore and fallback to default
  }
  _offlineConfig =
    (defaultAppConfig as any).offline ?? fallbackOfflineConfig;
  logger.info('[offline] loaded config fallback', { offline: _offlineConfig });
  return _offlineConfig;
}

export async function getAppDataPath() {
  if (_appDataPath) {
    return _appDataPath;
  }
  const offlineConfig = await getOfflineConfig();
  if (offlineConfig?.enabled) {
    const configuredPath = offlineConfig.dataPath?.trim();
    if (configuredPath) {
      _appDataPath = configuredPath;
      logger.info('[offline] app data path (configured)', { path: _appDataPath });
      return _appDataPath;
    }
    _appDataPath = path.join(await mainRPC.getPath('sessionData'), 'offline');
    logger.info('[offline] app data path (sessionData/offline)', {
      path: _appDataPath,
    });
    return _appDataPath;
  }
  _appDataPath = await mainRPC.getPath('sessionData');
  logger.info('[offline] app data path (sessionData)', { path: _appDataPath });
  return _appDataPath;
}

export async function getWorkspacesBasePath() {
  return path.join(await getAppDataPath(), 'workspaces');
}

export async function getWorkspaceBasePathV1(
  spaceType: SpaceType,
  workspaceId: string
) {
  return path.join(
    await getAppDataPath(),
    spaceType === 'userspace' ? 'userspaces' : 'workspaces',
    isWindows() ? workspaceId.replace(':', '_') : workspaceId
  );
}

export async function getSpaceBasePath(spaceType: SpaceType) {
  return path.join(
    await getAppDataPath(),
    spaceType === 'userspace' ? 'userspaces' : 'workspaces'
  );
}

export function escapeFilename(name: string) {
  // replace all special characters with '_' and replace repeated '_' with a single '_' and remove trailing '_'
  return name
    .replaceAll(/[\\/!@#$%^&*()+~`"':;,?<>|]/g, '_')
    .split('_')
    .filter(Boolean)
    .join('_');
}

export async function getSpaceDBPath(
  peer: string,
  spaceType: SpaceType,
  id: string
) {
  if (peer === 'local') {
    const meta = await readWorkspaceMetaFile(spaceType, id);
    if (meta?.mainDBPath) {
      logger.info('[offline] using meta mainDBPath', {
        peer,
        spaceType,
        id,
        path: meta.mainDBPath,
      });
      return meta.mainDBPath;
    }
  }
  const computed = path.join(
    await getSpaceBasePath(spaceType),
    escapeFilename(peer),
    id,
    'storage.db'
  );
  logger.info('[offline] using computed db path', {
    peer,
    spaceType,
    id,
    path: computed,
  });
  return computed;
}

export async function getDeletedWorkspacesBasePath() {
  return path.join(await getAppDataPath(), 'deleted-workspaces');
}

export async function getWorkspaceDBPath(
  spaceType: SpaceType,
  workspaceId: string
) {
  return path.join(
    await getWorkspaceBasePathV1(spaceType, workspaceId),
    'storage.db'
  );
}

export async function getWorkspaceMetaPath(
  spaceType: SpaceType,
  workspaceId: string
) {
  return path.join(
    await getWorkspaceBasePathV1(spaceType, workspaceId),
    'meta.json'
  );
}

/**
 * Get workspace meta, create one if not exists
 * This function will also migrate the workspace if needed
 */
export async function getWorkspaceMeta(
  spaceType: SpaceType,
  workspaceId: string
): Promise<WorkspaceMeta> {
  const meta = await readWorkspaceMetaFile(spaceType, workspaceId);
  if (meta?.mainDBPath) {
    return {
      ...meta,
      id: workspaceId,
    };
  }
  const dbPath = await getWorkspaceDBPath(spaceType, workspaceId);

  return {
    mainDBPath: dbPath,
    id: workspaceId,
  };
}

async function readWorkspaceMetaFile(
  spaceType: SpaceType,
  workspaceId: string
) {
  try {
    const metaPath = await getWorkspaceMetaPath(spaceType, workspaceId);
    if (!(await fs.pathExists(metaPath))) return null;
    const meta = (await fs.readJson(metaPath)) as Partial<WorkspaceMeta>;
    if (!meta.mainDBPath) return null;
    logger.info('[offline] loaded workspace meta', {
      spaceType,
      workspaceId,
      metaPath,
      mainDBPath: meta.mainDBPath,
    });
    return meta as WorkspaceMeta;
  } catch {
    return null;
  }
}
