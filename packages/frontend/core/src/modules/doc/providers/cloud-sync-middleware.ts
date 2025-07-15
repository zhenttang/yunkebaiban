import { DebugLogger } from '@affine/debug';
import { Service } from '@toeverything/infra';

import type { WorkspaceService } from '../../workspace';
import type { DocProvider } from '../../cloud/provider/doc';
import type { DocCreateMiddleware } from './doc-create-middleware';
import type { DocCreateOptions } from '../types';
import type { DocRecord } from '../entities/record';

const logger = new DebugLogger('CloudSyncMiddleware');

/**
 * 云端同步中间件
 * 负责在文档创建后同步到后端服务器
 */
export class CloudSyncMiddleware extends Service implements DocCreateMiddleware {
  constructor(
    private readonly workspaceService: WorkspaceService,
    private readonly docProvider: DocProvider
  ) {
    super();
  }

  beforeCreate(options: DocCreateOptions): DocCreateOptions {
    // 创建前不需要特殊处理
    return options;
  }

  afterCreate(docRecord: DocRecord, options: DocCreateOptions): void {
    // 异步同步到云端，不阻塞本地创建
    this.syncToCloud(docRecord, options).catch(error => {
      logger.error('同步文档到云端失败', {
        docId: docRecord.id,
        error,
      });
    });
  }

  private async syncToCloud(docRecord: DocRecord, options: DocCreateOptions): Promise<void> {
    try {
      // 检查网络状态
      const isOnline = typeof navigator !== 'undefined' && navigator.onLine;
      if (!isOnline) {
        logger.info('离线状态，跳过云端同步', { docId: docRecord.id });
        return;
      }

      // 获取当前工作空间ID
      const workspaceId = this.workspaceService.workspace.id;
      if (!workspaceId) {
        logger.warn('无法获取工作空间ID，跳过云端同步', { docId: docRecord.id });
        return;
      }

      // 准备创建请求 - 后端只需要title字段
      const createRequest = {
        title: docRecord.title$.value || '无标题',
      };

      logger.info('开始同步文档到云端', {
        docId: docRecord.id,
        workspaceId,
        request: createRequest,
      });

      // 调用后端API创建文档
      const cloudDoc = await this.docProvider.createDoc(workspaceId, createRequest);
      
      logger.info('文档同步到云端成功', {
        docId: docRecord.id,
        cloudDoc,
      });

      // TODO: 可以在这里更新本地文档的云端状态
      // docRecord.setCloudSynced(true);

    } catch (error) {
      logger.error('同步文档到云端时发生错误', {
        docId: docRecord.id,
        error: error instanceof Error ? error.message : String(error),
      });
      
      // 不抛出错误，避免影响本地创建流程
      // 用户仍能正常使用本地功能，稍后可能会重试同步
    }
  }
}