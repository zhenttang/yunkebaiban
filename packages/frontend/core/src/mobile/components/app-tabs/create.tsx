import { usePageHelper } from '@affine/core/blocksuite/block-suite-page-list/utils';
import { useAsyncCallback } from '@affine/core/components/hooks/affine-async-hooks';
import { DocsService } from '@affine/core/modules/doc';
import { TemplateDocService } from '@affine/core/modules/template-doc';
import { WorkbenchService } from '@affine/core/modules/workbench';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { useConfirmModal } from '@affine/component';
import track from '@affine/track';
import { EditIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { useCallback } from 'react';

import type { AppTabCustomFCProps } from './data';
import { TabItem } from './tab-item';

export const AppTabCreate = ({ tab }: AppTabCustomFCProps) => {
  const workbench = useService(WorkbenchService).workbench;
  const workspaceService = useService(WorkspaceService);
  const templateDocService = useService(TemplateDocService);
  const docsService = useService(DocsService);
  const { openConfirmModal } = useConfirmModal();

  const currentWorkspace = workspaceService.workspace;
  const pageHelper = usePageHelper(currentWorkspace.docCollection);
  const enablePageTemplate = useLiveData(
    templateDocService.setting.enablePageTemplate$
  );
  const pageTemplateDocId = useLiveData(
    templateDocService.setting.pageTemplateDocId$
  );

  // 判断文档是否为空白文档
  const isBlankDocument = useCallback((docRecord: any) => {
    if (!docRecord) return false;
    
    // 获取文档标题
    const title = docRecord.title$.value || '';
    
    // 判断标题是否为空或为默认值
    const hasEmptyTitle = !title.trim() || title === 'Untitled' || title === '无标题';
    
    // 检查文档是否是最近创建的（5分钟内）
    const createDate = docRecord.meta$.value?.createDate;
    const isRecentlyCreated = createDate && (Date.now() - createDate) < 5 * 60 * 1000;
    
    return hasEmptyTitle && isRecentlyCreated;
  }, []);

  // 查找现有的空白文档
  const findExistingBlankDoc = useCallback(() => {
    const allDocs = docsService.list.docs$.value;
    return allDocs.find(doc => isBlankDocument(doc));
  }, [docsService.list.docs$, isBlankDocument]);

  // 显示确认对话框
  const showBlankDocConfirm = useCallback((existingDoc: any) => {
    return new Promise<boolean>((resolve) => {
      openConfirmModal({
        title: '检测到空白文档',
        description: '您有一个最近创建的空白文档，是否要打开现有文档而不是创建新文档？',
        confirmText: '打开现有文档',
        cancelText: '创建新文档',
        confirmButtonOptions: {
          type: 'primary',
        },
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }, [openConfirmModal]);

  const createPage = useAsyncCallback(
    async (isActive: boolean) => {
      if (isActive) return;
      
      // 如果不是使用模板，检查是否存在空白文档
      if (!enablePageTemplate || !pageTemplateDocId) {
        const existingBlankDoc = findExistingBlankDoc();
        
        if (existingBlankDoc) {
          const useExisting = await showBlankDocConfirm(existingBlankDoc);
          if (useExisting) {
            // 打开现有的空白文档
            workbench.openDoc({ docId: existingBlankDoc.id, fromTab: 'true' });
            track.$.navigationPanel.$.createDoc();
            return;
          }
        }
      }
      
      // 原有的创建逻辑
      if (enablePageTemplate && pageTemplateDocId) {
        const docId =
          await docsService.duplicateFromTemplate(pageTemplateDocId);
        workbench.openDoc({ docId, fromTab: 'true' });
      } else {
        const doc = pageHelper.createPage(undefined, { show: false });
        workbench.openDoc({ docId: doc.id, fromTab: 'true' });
      }
      track.$.navigationPanel.$.createDoc();
    },
    [docsService, enablePageTemplate, pageHelper, pageTemplateDocId, workbench, findExistingBlankDoc, showBlankDocConfirm]
  );

  return (
    <TabItem id={tab.key} onClick={createPage} label="新建页面">
      <EditIcon />
    </TabItem>
  );
};
