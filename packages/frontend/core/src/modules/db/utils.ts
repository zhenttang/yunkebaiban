import type { DocStorage } from '@affine/nbstore';

import {
  AFFiNE_WORKSPACE_DB_SCHEMA,
  AFFiNE_WORKSPACE_USERDATA_DB_SCHEMA,
} from './schema';

export async function transformWorkspaceDBLocalToCloud(
  _localWorkspaceId: string,
  _cloudWorkspaceId: string,
  localDocStorage: DocStorage,
  cloudDocStorage: DocStorage,
  accountId: string
) {
  console.log('🗄️ [DB] 开始迁移工作区数据库', {
    localWorkspaceId: _localWorkspaceId,
    cloudWorkspaceId: _cloudWorkspaceId,
  });
  // 确保目标云端存储连接已就绪，避免“连接尚未建立”的时序问题
  try {
    // @ts-ignore optional: 仅在实现了 connection 的存储上等待
    if (cloudDocStorage?.connection?.waitForConnected) {
      console.log('[DB] 等待云端存储连接就绪');
      // @ts-ignore
      await cloudDocStorage.connection.waitForConnected();
      console.log('[DB] 云端存储连接就绪');
    }
  } catch (e) {
    // 即使等待失败，也不影响后续由具体实现抛出更明确错误
    console.warn('[transformWorkspaceDBLocalToCloud] 等待云端存储连接时出错:', (e as Error).message);
  }

  for (const tableName of Object.keys(AFFiNE_WORKSPACE_DB_SCHEMA)) {
    const localDocName = `db$${tableName}`;
    console.log('[DB] 迁移表(工作区):', tableName, '=>', localDocName);
    const localDoc = await localDocStorage.getDoc(localDocName);
    if (localDoc) {
      const cloudDocName = `db$${tableName}`;
      await cloudDocStorage.pushDocUpdate({
        docId: cloudDocName,
        bin: localDoc.bin,
      });
      console.log('[DB] 已迁移表(工作区):', tableName, '大小:', localDoc.bin.length);
    } else {
      console.log('[DB] 跳过表(工作区，无本地数据):', tableName);
    }
  }

  for (const tableName of Object.keys(AFFiNE_WORKSPACE_USERDATA_DB_SCHEMA)) {
    const localDocName = `userdata$__local__$${tableName}`;
    console.log('[DB] 迁移表(用户数据):', tableName, '=>', localDocName);
    const localDoc = await localDocStorage.getDoc(localDocName);
    if (localDoc) {
      const cloudDocName = `userdata$${accountId}$${tableName}`;
      await cloudDocStorage.pushDocUpdate({
        docId: cloudDocName,
        bin: localDoc.bin,
      });
      console.log('[DB] 已迁移表(用户数据):', tableName, '大小:', localDoc.bin.length);
    } else {
      console.log('[DB] 跳过表(用户数据，无本地数据):', tableName);
    }
  }
  console.log('🗄️ [DB] 工作区数据库迁移完成');
}
