import path from 'node:path';

import { DocStorage } from '@yunke/native';
import {
  parseUniversalId,
  type SpaceType,
  universalId as generateUniversalId,
} from '@yunke/nbstore';
import fs from 'fs-extra';
import { applyUpdate, Doc as YDoc } from 'yjs';

import { logger } from '../logger';
import { mainRPC } from '../main-rpc';
import { getDocStoragePool } from '../nbstore';
import { ensureSQLiteDisconnected } from '../nbstore/v1/ensure-db';
import { WorkspaceSQLiteDB } from '../nbstore/v1/workspace-db-adapter';
import type { WorkspaceMeta } from '../type';
import {
  getDeletedWorkspacesBasePath,
  getSpaceDBPath,
  getWorkspaceBasePathV1,
  getWorkspaceMeta,
  getWorkspacesBasePath,
} from './meta';

async function deleteWorkspaceV1(workspaceId: string) {
  try {
    await ensureSQLiteDisconnected('workspace', workspaceId);
    const basePath = await getWorkspaceBasePathV1('workspace', workspaceId);
    await fs.rmdir(basePath, { recursive: true });
  } catch (error) {
    logger.error('deleteWorkspaceV1', error);
  }
}

/**
 * Permanently delete the workspace data
 */
export async function deleteWorkspace(universalId: string) {
  const { peer, type, id } = parseUniversalId(universalId);
  await deleteWorkspaceV1(id);

  const dbPath = await getSpaceDBPath(peer, type, id);
  try {
    await getDocStoragePool().disconnect(universalId);
    await fs.rmdir(path.dirname(dbPath), { recursive: true });
  } catch (e) {
    logger.error('deleteWorkspace', e);
  }
}

/**
 * Move the workspace folder to `deleted-workspaces`
 * At the same time, permanently delete the v1 workspace folder if it's id exists in nbstore,
 * because trashing always happens after full sync from v1 to nbstore.
 */
export async function trashWorkspace(universalId: string) {
  const { peer, type, id } = parseUniversalId(universalId);
  await deleteWorkspaceV1(id);

  const dbPath = await getSpaceDBPath(peer, type, id);
  const basePath = await getDeletedWorkspacesBasePath();
  const movedPath = path.join(basePath, `${id}`);
  try {
    const storage = new DocStorage(dbPath);
    if (await storage.validate()) {
      const pool = getDocStoragePool();
      await pool.checkpoint(universalId);
      await pool.disconnect(universalId);
    }
    await fs.ensureDir(movedPath);
    // todo(@pengx17): it seems the db file is still being used at the point
    // 在Windows上无法移动。我们将回退到复制目录。
    await fs.copy(path.dirname(dbPath), movedPath, {
      overwrite: true,
    });
    await fs.rmdir(path.dirname(dbPath), { recursive: true });
  } catch (error) {
    logger.error('trashWorkspace', error);
  }
}

export async function storeWorkspaceMeta(
  workspaceId: string,
  meta: Partial<WorkspaceMeta>
) {
  try {
    const basePath = await getWorkspaceBasePathV1('workspace', workspaceId);
    await fs.ensureDir(basePath);
    const metaPath = path.join(basePath, 'meta.json');
    const currentMeta = await getWorkspaceMeta('workspace', workspaceId);
    const newMeta = {
      ...currentMeta,
      ...meta,
    };
    await fs.writeJSON(metaPath, newMeta);
  } catch (err) {
    logger.error('storeWorkspaceMeta failed', err);
  }
}

type WorkspaceDocMeta = {
  id: string;
  name: string;
  avatar: Uint8Array | null;
  fileSize: number;
  updatedAt: Date;
  createdAt: Date;
  docCount: number;
  dbPath: string;
};

async function getWorkspaceDocMetaV1(
  workspaceId: string,
  dbPath: string
): Promise<WorkspaceDocMeta | null> {
  try {
    await using db = new WorkspaceSQLiteDB(dbPath, workspaceId);
    await db.init();
    await db.checkpoint();
    const meta = await db.getWorkspaceMeta();
    const dbFileSize = await fs.stat(dbPath);
    return {
      id: workspaceId,
      name: meta.name,
      avatar: await db.getBlob(meta.avatar),
      fileSize: dbFileSize.size,
      updatedAt: dbFileSize.mtime,
      createdAt: dbFileSize.birthtime,
      docCount: meta.pages.length,
      dbPath,
    };
  } catch {
    // ignore
  }
  return null;
}

async function getWorkspaceDocMeta(
  workspaceId: string,
  dbPath: string
): Promise<WorkspaceDocMeta | null> {
  const pool = getDocStoragePool();
  const universalId = generateUniversalId({
    peer: 'deleted-local',
    type: 'workspace',
    id: workspaceId,
  });
  try {
    await pool.connect(universalId, dbPath);
    await pool.checkpoint(universalId);
    const snapshot = await pool.getDocSnapshot(universalId, workspaceId);
    const pendingUpdates = await pool.getDocUpdates(universalId, workspaceId);
    if (snapshot) {
      const updates = snapshot.bin;
      const ydoc = new YDoc();
      applyUpdate(ydoc, updates);
      pendingUpdates.forEach(update => {
        applyUpdate(ydoc, update.bin);
      });
      const meta = ydoc.getMap('meta').toJSON();
      const dbFileStat = await fs.stat(dbPath);
      const blob = meta.avatar
        ? await pool.getBlob(universalId, meta.avatar)
        : null;
      return {
        id: workspaceId,
        name: meta.name,
        avatar: blob ? blob.data : null,
        fileSize: dbFileStat.size,
        updatedAt: dbFileStat.mtime,
        createdAt: dbFileStat.birthtime,
        docCount: meta.pages.length,
        dbPath,
      };
    }
  } catch {
    // try using v1
    return await getWorkspaceDocMetaV1(workspaceId, dbPath);
  } finally {
    await pool.disconnect(universalId);
  }
  return null;
}

export async function getWorkspaceStoragePath(
  peer: string,
  spaceType: SpaceType,
  id: string
) {
  return getSpaceDBPath(peer, spaceType, id);
}

/**
 * 获取默认数据存储目录
 */
export async function getDefaultDataPath() {
  try {
    const basePath = await getWorkspacesBasePath();
    logger.info('[getDefaultDataPath] 获取数据目录', { basePath });
    return {
      path: basePath,
      localPath: path.join(basePath, 'local'),
    };
  } catch (error) {
    logger.error('[getDefaultDataPath] 获取数据目录失败', error);
    // 返回一个默认值，避免前端显示"暂不可用"
    const fallbackPath = path.join(
      process.env.APPDATA || process.env.HOME || '',
      'YUNKE-canary',
      'workspaces'
    );
    return {
      path: fallbackPath,
      localPath: path.join(fallbackPath, 'local'),
    };
  }
}

/**
 * 迁移所有本地数据到新目录
 * 流程：
 * 1. 复制数据到新目录
 * 2. 更新配置文件（config.json）
 * 3. 返回结果，提示用户重启
 */
export async function migrateAllDataToPath(targetPath: string) {
  if (!targetPath) {
    return { error: 'TARGET_PATH_INVALID' as const, message: '目标路径无效' };
  }
  
  const currentBasePath = await getWorkspacesBasePath();
  const targetBasePath = path.join(targetPath, 'workspaces');
  
  if (path.resolve(currentBasePath) === path.resolve(targetBasePath)) {
    return { skipped: true, message: '目标路径与当前路径相同' };
  }
  
  try {
    // 1. 复制数据到新目录（如果当前有数据）
    if (await fs.pathExists(currentBasePath)) {
      logger.info('[migrate] 开始复制数据', {
        from: currentBasePath,
        to: targetBasePath,
      });
      
      await fs.ensureDir(targetBasePath);
      await fs.copy(currentBasePath, targetBasePath, { overwrite: true });
      
      logger.info('[migrate] 数据复制完成');
    } else {
      logger.info('[migrate] 当前目录没有数据，仅更新配置');
      await fs.ensureDir(targetBasePath);
    }
    
    // 2. 更新配置文件
    const userDataPath = await mainRPC.getPath('userData');
    const configPath = path.join(userDataPath, 'config.json');
    
    let config: Record<string, any> = {};
    if (await fs.pathExists(configPath)) {
      try {
        config = await fs.readJson(configPath);
      } catch {
        config = {};
      }
    }
    
    // 更新 offline 配置
    config.offline = {
      ...config.offline,
      enabled: true,
      dataPath: targetPath,
    };
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    
    logger.info('[migrate] 配置文件已更新', {
      configPath,
      newDataPath: targetPath,
    });
    
    return {
      success: true,
      fromPath: currentBasePath,
      toPath: targetBasePath,
      configUpdated: true,
      message: '数据迁移完成，请重启应用使设置生效',
    };
  } catch (error) {
    logger.error('[migrate] 数据迁移失败', error);
    return {
      error: 'MIGRATION_FAILED' as const,
      message: (error as Error).message,
    };
  }
}

export async function showWorkspaceStorageInFolder(
  peer: string,
  spaceType: SpaceType,
  id: string
) {
  const filePath = await getSpaceDBPath(peer, spaceType, id);
  await mainRPC.showItemInFolder(filePath);
  return { filePath };
}

export async function migrateWorkspaceStoragePath(
  peer: string,
  spaceType: SpaceType,
  id: string,
  targetPath: string
) {
  if (!targetPath) {
    return { error: 'DB_FILE_PATH_INVALID' as const };
  }
  const currentPath = await getSpaceDBPath(peer, spaceType, id);
  if (path.resolve(currentPath) === path.resolve(targetPath)) {
    return { filePath: currentPath, skipped: true };
  }

  const universalId = generateUniversalId({
    peer,
    type: spaceType,
    id,
  });
  const pool = getDocStoragePool();
  try {
    await pool.connect(universalId, currentPath);
    await pool.checkpoint(universalId);
  } catch (error) {
    logger.error('migrateWorkspaceStoragePath checkpoint failed', error);
  } finally {
    await pool.disconnect(universalId).catch(() => {});
  }

  await fs.ensureDir(path.dirname(targetPath));
  await fs.copy(currentPath, targetPath, { overwrite: true });
  await storeWorkspaceMeta(id, { id, mainDBPath: targetPath });
  return { filePath: targetPath, oldPath: currentPath };
}

export async function deleteWorkspaceStorageFile(filePath: string) {
  if (!filePath) {
    return { error: 'DB_FILE_PATH_INVALID' as const };
  }
  const resolved = path.resolve(filePath);
  const candidates = [resolved, `${resolved}-wal`, `${resolved}-shm`];
  try {
    const existing = await Promise.all(
      candidates.map(async candidate => ({
        path: candidate,
        exists: await fs.pathExists(candidate),
      }))
    );
    const targets = existing.filter(item => item.exists).map(item => item.path);
    if (targets.length === 0) {
      return { skipped: true };
    }
    await Promise.all(targets.map(target => fs.remove(target)));
    return { deleted: true };
  } catch (error) {
    logger.error('deleteWorkspaceStorageFile failed', error);
    return { error: 'UNKNOWN_ERROR' as const };
  }
}

export async function getDeletedWorkspaces() {
  const basePath = await getDeletedWorkspacesBasePath();
  const directories = await fs.readdir(basePath);
  const workspaceEntries = await Promise.all(
    directories.map(async dir => {
      const stats = await fs.stat(path.join(basePath, dir));
      if (!stats.isDirectory()) {
        return null;
      }
      const dbfileStats = await fs.stat(path.join(basePath, dir, 'storage.db'));
      return {
        id: dir,
        mtime: new Date(dbfileStats.mtime),
      };
    })
  );

  const workspaceIds = workspaceEntries
    .filter(v => v !== null)
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())
    .map(entry => entry.id);

  const items: WorkspaceDocMeta[] = [];

  // todo(@pengx17): add cursor based pagination
  for (const id of workspaceIds) {
    const meta = await getWorkspaceDocMeta(
      id,
      path.join(basePath, id, 'storage.db')
    );
    if (meta) {
      items.push(meta);
    } else {
      logger.warn('getDeletedWorkspaces', `No meta found for ${id}`);
    }
  }

  return {
    items: items,
  };
}

export async function deleteBackupWorkspace(id: string) {
  const basePath = await getDeletedWorkspacesBasePath();
  const workspacePath = path.join(basePath, id);
  await fs.rmdir(workspacePath, { recursive: true });
  logger.info(
    'deleteBackupWorkspace',
    `Deleted backup workspace: ${workspacePath}`
  );
}
