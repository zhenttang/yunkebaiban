import { WriterInfoServiceExtension } from '@blocksuite/yunke/shared/services';
import { OnEvent, Service } from '@toeverything/infra';
import { getOrCreateSessionId } from '@yunke/nbstore';

import { TemporaryUserCollaboration } from '../../temporary-user/utils/collaboration';

import { type Workspace, WorkspaceInitialized } from '../../workspace';
import type { DocImpl } from '../../workspace/impls/doc';
import type { WorkspaceServerService } from './workspace-server';

/**
 * This service is used to set the writer info for the blocksuite editor.
 */
@OnEvent(WorkspaceInitialized, i => i.onWorkspaceInitialized)
export class BlocksuiteWriterInfoService extends Service {
  constructor(private readonly workspaceServerService: WorkspaceServerService) {
    super();
  }

  onWorkspaceInitialized(workspace: Workspace) {
    // 在共享模式下不启用，避免与临时用户服务冲突
    if (workspace.openOptions.isSharedMode) {
      return;
    }

    const setWriterInfo = (doc: DocImpl) => {
      const account = this.workspaceServerService.server?.account$.value;
      if (!account?.id) {
        console.warn('[Presence] 未找到登录用户，跳过 writer info 设置');
        return;
      }
      const sessionId = getOrCreateSessionId();
      const color = account?.id
        ? TemporaryUserCollaboration.generateUserColor(account.id)
        : '#85C1E9';
      doc.awarenessStore.awareness.setLocalStateField('user', {
        id: account?.id,
        name: account?.label,
        rawName: account?.label,
        avatar: account?.avatar,
        color,
        sessionId,
        clientId: doc.awarenessStore.awareness.doc.clientID,
      });

      console.info('[Presence] 设置协作身份', {
        docId: doc.id,
        userId: account.id,
        name: account.label,
        sessionId,
        color,
      });
      
      // 检查是否已有WriterInfo扩展，避免重复添加
      const hasWriterInfo = doc.storeExtensions.some(ext => 
        ext.setup && ext.setup.toString().includes('yunke-writer-info-service')
      );

      if (!hasWriterInfo) {
        doc.storeExtensions.push(
          WriterInfoServiceExtension({
            getWriterInfo: () => {
              if (!account) {
                return null;
              }
              return {
                id: account.id,
                name: account.label,
                avatar: account.avatar,
              };
            },
          })
        );
      }
    };

    // 确保已有文档也设置 writer info（否则初始协作气泡缺失）
    workspace.docCollection.docs.forEach(doc => {
      if (doc) {
        setWriterInfo(doc as DocImpl);
      }
    });

    const subscription = workspace.docCollection.meta.docMetaAdded.subscribe(
      docId => {
        const doc = workspace.docCollection.docs.get(docId) as DocImpl;
        setWriterInfo(doc);
      }
    );
    this.disposables.push(() => subscription.unsubscribe());
  }
}
