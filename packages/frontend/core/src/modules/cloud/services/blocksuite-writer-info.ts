import { WriterInfoServiceExtension } from '@blocksuite/yunke/shared/services';
import { OnEvent, Service } from '@toeverything/infra';
import { getOrCreateSessionId } from '@yunke/nbstore';

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
      const sessionId = getOrCreateSessionId();
      doc.awarenessStore.awareness.setLocalStateField('user', {
        id: account?.id,
        name: account?.label,
        rawName: account?.label,
        sessionId,
        clientId: doc.awarenessStore.awareness.doc.clientID,
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
    const subscription = workspace.docCollection.meta.docMetaAdded.subscribe(
      docId => {
        const doc = workspace.docCollection.docs.get(docId) as DocImpl;
        setWriterInfo(doc);
      }
    );
    this.disposables.push(() => subscription.unsubscribe.bind(subscription));
  }
}
