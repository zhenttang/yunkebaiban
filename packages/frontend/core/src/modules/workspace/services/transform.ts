import { Service } from '@toeverything/infra';
import { applyUpdate } from 'yjs';

import { transformWorkspaceDBLocalToCloud } from '../../db/utils';
import type { Workspace } from '../entities/workspace';
import type { WorkspaceMetadata } from '../metadata';
import type { WorkspaceDestroyService } from './destroy';
import type { WorkspaceFactoryService } from './factory';

export class WorkspaceTransformService extends Service {
  constructor(
    private readonly factory: WorkspaceFactoryService,
    private readonly destroy: WorkspaceDestroyService
  ) {
    super();
  }

  /**
   * helper function to transform local workspace to cloud workspace
   *
   * @param accountId - all local user data will be transformed to this account
   */
  transformLocalToCloud = async (
    local: Workspace,
    accountId: string,
    flavour: string
  ): Promise<WorkspaceMetadata> => {
    if (local.flavour !== 'local') {
      throw new Error(
        '只有本地工作空间可以转换为云工作空间'
      );
    }

    const localDocStorage = local.engine.doc.storage;
    const localDocList = Array.from(local.docCollection.docs.keys());
    console.log('🔧 [Transform] 开始本地->云 初始数据准备', {
      rootDocId: local.docCollection.doc.guid,
      subdocCount: localDocList.length,
    });

    const newMetadata = await this.factory.create(
      flavour,
      async (docCollection, blobStorage, docStorage) => {
        // 在 provider 的临时工作空间阶段（用于读取名称），跳过重度迁移逻辑
        if (docCollection.id?.startsWith?.('temp-')) {
          console.log('⏭️ [Transform] 检测到临时工作空间，跳过数据迁移，仅进行名称准备');
          return;
        }
        const rootDocBinary = (
          await localDocStorage.getDoc(local.docCollection.doc.guid)
        )?.bin;

        if (rootDocBinary) {
          console.log('🔧 [Transform] 应用 Root 文档快照');
          applyUpdate(docCollection.doc, rootDocBinary);
        }

        // 将所有子文档应用到新集合；若不存在则先创建
        console.log('🔧 [Transform] 开始应用子文档到新集合');
        let applied = 0;
        for (const subdocId of localDocList) {
          const subdocBinary = (await localDocStorage.getDoc(subdocId))?.bin;
          if (!subdocBinary) continue;

          let doc = docCollection.getDoc(subdocId);
          if (!doc) {
            try {
              doc = docCollection.createDoc(subdocId);
            } catch {
              // 若已存在或创建失败，尝试再次获取
              doc = docCollection.getDoc(subdocId);
            }
          }
          if (!doc) continue;

          doc.load();
          applyUpdate(doc.spaceDoc, subdocBinary);
          applied++;

          // 每处理一批文档，让出事件循环，避免页面卡顿
          if (applied % 50 === 0) {
            console.log('🔧 [Transform] 子文档应用进度', {
              applied,
              total: localDocList.length,
            });
            await new Promise(r => setTimeout(r, 0));
          }
        }
        console.log('🔧 [Transform] 子文档应用完成');

        // transform db
        console.log('🗄️ [Transform] 开始迁移 DB 元数据');
        await transformWorkspaceDBLocalToCloud(
          local.id,
          docCollection.id,
          localDocStorage,
          docStorage,
          accountId
        );
        console.log('🗄️ [Transform] 迁移 DB 元数据完成');

        const blobList = await local.engine.blob.storage.list();
        console.log('🖼️ [Transform] 开始迁移 Blob 资源', { count: blobList.length });

        for (const { key } of blobList) {
          const blob = await local.engine.blob.storage.get(key);
          if (blob) {
            await blobStorage.set(blob);
          }
        }
        console.log('🖼️ [Transform] 迁移 Blob 资源完成');
      }
    );

    await this.destroy.deleteWorkspace(local.meta);

    return newMetadata;
  };
}
