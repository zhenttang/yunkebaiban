import path from 'node:path';

import { DocStoragePool } from '@yunke/native';
import { parseUniversalId } from '@yunke/nbstore';
import type { NativeDBApis } from '@yunke/nbstore/sqlite';
import fs from 'fs-extra';

import { logger } from '../logger';
import { getSpaceDBPath } from '../workspace/meta';

// 🔍 调试：打印 native-mock 状态
logger.info('[offline] DocStoragePool imported from @yunke/native');

const POOL = new DocStoragePool();
logger.info('[offline] DocStoragePool created');

export function getDocStoragePool() {
  return POOL;
}

export const nbstoreHandlers: NativeDBApis = {
  connect: async (universalId: string) => {
    const { peer, type, id } = parseUniversalId(universalId);
    logger.info('[offline] nbstore connect 开始', {
      universalId,
      peer,
      type,
      id,
    });
    const dbPath = await getSpaceDBPath(peer, type, id);
    logger.info('[offline] nbstore connect dbPath 计算完成', {
      dbPath,
      dirExists: await fs.pathExists(path.dirname(dbPath)),
    });
    await fs.ensureDir(path.dirname(dbPath));
    logger.info('[offline] nbstore connect 目录已创建', {
      dbPath,
      dirExists: await fs.pathExists(path.dirname(dbPath)),
    });
    await POOL.connect(universalId, dbPath);
    logger.info('[offline] nbstore connect POOL.connect 完成', {
      universalId,
      dbPath,
    });
    await POOL.setSpaceId(universalId, id);
    logger.info('[offline] nbstore connect 全部完成', {
      universalId,
      dbPath,
      fileExists: await fs.pathExists(dbPath),
    });
  },
  disconnect: async (universalId: string) => {
    logger.info('[offline] nbstore disconnect', { universalId });
    await POOL.disconnect(universalId);
  },
  pushUpdate: POOL.pushUpdate.bind(POOL),
  getDocSnapshot: POOL.getDocSnapshot.bind(POOL),
  setDocSnapshot: POOL.setDocSnapshot.bind(POOL),
  getDocUpdates: POOL.getDocUpdates.bind(POOL),
  markUpdatesMerged: POOL.markUpdatesMerged.bind(POOL),
  deleteDoc: POOL.deleteDoc.bind(POOL),
  getDocClocks: POOL.getDocClocks.bind(POOL),
  getDocClock: POOL.getDocClock.bind(POOL),
  getBlob: POOL.getBlob.bind(POOL),
  setBlob: POOL.setBlob.bind(POOL),
  deleteBlob: POOL.deleteBlob.bind(POOL),
  releaseBlobs: POOL.releaseBlobs.bind(POOL),
  listBlobs: POOL.listBlobs.bind(POOL),
  getPeerRemoteClocks: POOL.getPeerRemoteClocks.bind(POOL),
  getPeerRemoteClock: POOL.getPeerRemoteClock.bind(POOL),
  setPeerRemoteClock: POOL.setPeerRemoteClock.bind(POOL),
  getPeerPulledRemoteClocks: POOL.getPeerPulledRemoteClocks.bind(POOL),
  getPeerPulledRemoteClock: POOL.getPeerPulledRemoteClock.bind(POOL),
  setPeerPulledRemoteClock: POOL.setPeerPulledRemoteClock.bind(POOL),
  getPeerPushedClocks: POOL.getPeerPushedClocks.bind(POOL),
  getPeerPushedClock: POOL.getPeerPushedClock.bind(POOL),
  setPeerPushedClock: POOL.setPeerPushedClock.bind(POOL),
  clearClocks: POOL.clearClocks.bind(POOL),
  setBlobUploadedAt: POOL.setBlobUploadedAt.bind(POOL),
  getBlobUploadedAt: POOL.getBlobUploadedAt.bind(POOL),
};
