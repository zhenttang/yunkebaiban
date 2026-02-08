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

// ====== NEW-2：自动备份机制 ======

const MAX_BACKUPS_PER_WORKSPACE = 7;
const BACKUP_DIR_NAME = 'backups';

/**
 * 获取备份根目录
 */
async function getBackupsBasePath() {
  const { getAppDataPath } = await import('./meta');
  return path.join(await getAppDataPath(), BACKUP_DIR_NAME);
}

/**
 * 获取指定工作区的备份目录
 */
async function getWorkspaceBackupPath(workspaceId: string) {
  return path.join(await getBackupsBasePath(), workspaceId);
}

export interface BackupInfo {
  id: string;
  workspaceId: string;
  timestamp: number;
  size: number;
  filename: string;
  path: string;
}

/**
 * 创建工作区的数据库备份
 */
export async function createWorkspaceBackup(
  workspaceId: string
): Promise<BackupInfo | null> {
  try {
    // 查找工作区的 storage.db 文件
    const workspacesBase = await getWorkspacesBasePath();
    let dbPath = '';

    // 遍历 peer 目录查找 storage.db
    if (await fs.pathExists(workspacesBase)) {
      const peers = await fs.readdir(workspacesBase);
      for (const peer of peers) {
        const candidate = path.join(
          workspacesBase,
          peer,
          workspaceId,
          'storage.db'
        );
        if (await fs.pathExists(candidate)) {
          dbPath = candidate;
          break;
        }
      }
    }

    if (!dbPath) {
      logger.warn('createWorkspaceBackup: storage.db not found', {
        workspaceId,
      });
      return null;
    }

    const backupDir = await getWorkspaceBackupPath(workspaceId);
    await fs.ensureDir(backupDir);

    const timestamp = Date.now();
    const filename = `backup_${timestamp}.db`;
    const backupPath = path.join(backupDir, filename);

    // 复制数据库文件
    await fs.copy(dbPath, backupPath);

    // 同时复制 WAL 文件（如果存在）
    const walPath = dbPath + '-wal';
    if (await fs.pathExists(walPath)) {
      await fs.copy(walPath, backupPath + '-wal');
    }

    const stats = await fs.stat(backupPath);

    logger.info('createWorkspaceBackup: success', {
      workspaceId,
      backupPath,
      size: stats.size,
    });

    // 清理旧备份
    await cleanOldBackups(workspaceId);

    return {
      id: `${workspaceId}_${timestamp}`,
      workspaceId,
      timestamp,
      size: stats.size,
      filename,
      path: backupPath,
    };
  } catch (error) {
    logger.error('createWorkspaceBackup failed', error);
    return null;
  }
}

/**
 * 备份所有工作区
 */
export async function createAllWorkspaceBackups(): Promise<{
  succeeded: number;
  failed: number;
  backups: BackupInfo[];
}> {
  const workspacesBase = await getWorkspacesBasePath();
  const backups: BackupInfo[] = [];
  let failed = 0;

  if (!(await fs.pathExists(workspacesBase))) {
    return { succeeded: 0, failed: 0, backups };
  }

  const peers = await fs.readdir(workspacesBase).catch(() => [] as string[]);
  const workspaceIds = new Set<string>();

  for (const peer of peers) {
    const peerPath = path.join(workspacesBase, peer);
    const peerStat = await fs.stat(peerPath).catch(() => null);
    if (!peerStat?.isDirectory()) continue;

    const ids = await fs.readdir(peerPath).catch(() => [] as string[]);
    for (const id of ids) {
      const dbPath = path.join(peerPath, id, 'storage.db');
      if (await fs.pathExists(dbPath)) {
        workspaceIds.add(id);
      }
    }
  }

  for (const wsId of workspaceIds) {
    const backup = await createWorkspaceBackup(wsId);
    if (backup) {
      backups.push(backup);
    } else {
      failed++;
    }
  }

  logger.info('createAllWorkspaceBackups', {
    succeeded: backups.length,
    failed,
  });

  return { succeeded: backups.length, failed, backups };
}

/**
 * 列出工作区的所有备份
 */
export async function listWorkspaceBackups(
  workspaceId?: string
): Promise<BackupInfo[]> {
  const backupsBase = await getBackupsBasePath();
  if (!(await fs.pathExists(backupsBase))) {
    return [];
  }

  const results: BackupInfo[] = [];
  const dirs = workspaceId
    ? [workspaceId]
    : await fs.readdir(backupsBase).catch(() => [] as string[]);

  for (const wsId of dirs) {
    const wsBackupDir = path.join(backupsBase, wsId);
    if (!(await fs.pathExists(wsBackupDir))) continue;

    const stat = await fs.stat(wsBackupDir).catch(() => null);
    if (!stat?.isDirectory()) continue;

    const files = await fs.readdir(wsBackupDir).catch(() => [] as string[]);
    for (const file of files) {
      if (!file.startsWith('backup_') || !file.endsWith('.db')) continue;
      // 排除 WAL/SHM 文件
      if (file.endsWith('-wal') || file.endsWith('-shm')) continue;

      const match = file.match(/^backup_(\d+)\.db$/);
      if (!match) continue;

      const timestamp = parseInt(match[1], 10);
      const filePath = path.join(wsBackupDir, file);
      const fileStat = await fs.stat(filePath).catch(() => null);

      results.push({
        id: `${wsId}_${timestamp}`,
        workspaceId: wsId,
        timestamp,
        size: fileStat?.size ?? 0,
        filename: file,
        path: filePath,
      });
    }
  }

  return results.sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * 从备份恢复工作区
 */
export async function restoreWorkspaceFromBackup(
  backupId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [workspaceId, timestampStr] = backupId.split('_');
    if (!workspaceId || !timestampStr) {
      return { success: false, error: '无效的备份 ID' };
    }

    const backupDir = await getWorkspaceBackupPath(workspaceId);
    const backupPath = path.join(backupDir, `backup_${timestampStr}.db`);

    if (!(await fs.pathExists(backupPath))) {
      return { success: false, error: '备份文件不存在' };
    }

    // 查找目标 storage.db
    const workspacesBase = await getWorkspacesBasePath();
    let targetDbPath = '';

    const peers = await fs.readdir(workspacesBase).catch(() => [] as string[]);
    for (const peer of peers) {
      const candidate = path.join(
        workspacesBase,
        peer,
        workspaceId,
        'storage.db'
      );
      if (await fs.pathExists(candidate)) {
        targetDbPath = candidate;
        break;
      }
    }

    if (!targetDbPath) {
      return { success: false, error: '找不到目标工作区' };
    }

    // 先断开数据库连接
    try {
      await ensureSQLiteDisconnected('workspace', workspaceId);
    } catch {
      // 忽略断开连接错误
    }

    // 创建当前数据库的安全备份
    const safetyBackup = targetDbPath + `.pre-restore-${Date.now()}`;
    await fs.copy(targetDbPath, safetyBackup);

    // 用备份文件覆盖
    await fs.copy(backupPath, targetDbPath, { overwrite: true });

    // 如果有 WAL 文件也恢复
    const walBackup = backupPath + '-wal';
    if (await fs.pathExists(walBackup)) {
      await fs.copy(walBackup, targetDbPath + '-wal', { overwrite: true });
    } else {
      // 删除旧的 WAL 文件（防止不一致）
      await fs.remove(targetDbPath + '-wal').catch(() => {});
      await fs.remove(targetDbPath + '-shm').catch(() => {});
    }

    logger.info('restoreWorkspaceFromBackup: success', {
      backupId,
      from: backupPath,
      to: targetDbPath,
    });

    return { success: true };
  } catch (error) {
    logger.error('restoreWorkspaceFromBackup failed', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 删除指定备份
 */
export async function deleteWorkspaceBackup(
  backupId: string
): Promise<boolean> {
  try {
    const [workspaceId, timestampStr] = backupId.split('_');
    if (!workspaceId || !timestampStr) return false;

    const backupDir = await getWorkspaceBackupPath(workspaceId);
    const backupPath = path.join(backupDir, `backup_${timestampStr}.db`);
    const walPath = backupPath + '-wal';
    const shmPath = backupPath + '-shm';

    await fs.remove(backupPath).catch(() => {});
    await fs.remove(walPath).catch(() => {});
    await fs.remove(shmPath).catch(() => {});

    logger.info('deleteWorkspaceBackup', { backupId });
    return true;
  } catch (error) {
    logger.error('deleteWorkspaceBackup failed', error);
    return false;
  }
}

/**
 * 清理旧备份，保留最近 N 份
 */
async function cleanOldBackups(workspaceId: string) {
  const backups = await listWorkspaceBackups(workspaceId);
  if (backups.length <= MAX_BACKUPS_PER_WORKSPACE) return;

  const toDelete = backups.slice(MAX_BACKUPS_PER_WORKSPACE);
  for (const backup of toDelete) {
    await deleteWorkspaceBackup(backup.id);
    logger.info('cleanOldBackups: removed old backup', {
      id: backup.id,
      timestamp: backup.timestamp,
    });
  }
}

// ====== 自动备份调度 ======
let autoBackupTimer: ReturnType<typeof setInterval> | null = null;
const AUTO_BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 小时

/**
 * 启动自动备份调度
 */
export function startAutoBackup() {
  if (autoBackupTimer) return;
  logger.info('startAutoBackup: scheduling every 24h');

  autoBackupTimer = setInterval(async () => {
    logger.info('autoBackup: running scheduled backup');
    await createAllWorkspaceBackups();
  }, AUTO_BACKUP_INTERVAL_MS);

  // 首次启动延迟 5 分钟后执行一次
  setTimeout(async () => {
    logger.info('autoBackup: running initial backup (5min after start)');
    await createAllWorkspaceBackups();
  }, 5 * 60 * 1000);
}

/**
 * 停止自动备份调度
 */
export function stopAutoBackup() {
  if (autoBackupTimer) {
    clearInterval(autoBackupTimer);
    autoBackupTimer = null;
    logger.info('stopAutoBackup: stopped');
  }
}

/**
 * 获取自动备份状态
 */
export function getAutoBackupStatus() {
  return {
    enabled: autoBackupTimer !== null,
    intervalMs: AUTO_BACKUP_INTERVAL_MS,
  };
}
