import { type Doc, DocsService } from '@affine/core/modules/doc';
import type { Editor } from '@affine/core/modules/editor';
import { EditorsService } from '@affine/core/modules/editor';
import { ViewService } from '@affine/core/modules/workbench/services/view';
import { WorkspaceService } from '@affine/core/modules/workspace';
import { FrameworkScope, useLiveData, useService } from '@toeverything/infra';
import {
  type PropsWithChildren,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';

const useLoadDoc = (pageId: string) => {
  const currentWorkspace = useService(WorkspaceService).workspace;
  const docsService = useService(DocsService);
  const docRecordList = docsService.list;
  const docListReady = useLiveData(docRecordList.isReady$);
  const docRecord = useLiveData(docRecordList.doc$(pageId));
  const viewService = useService(ViewService);

  console.log('🔍 [useLoadDoc] pageId:', pageId);
  console.log('🔍 [useLoadDoc] docListReady:', docListReady);
  console.log('🔍 [useLoadDoc] docRecord:', docRecord);
  console.log('🔍 [useLoadDoc] workspaceId:', currentWorkspace.id);

  const [doc, setDoc] = useState<Doc | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);

  useLayoutEffect(() => {
    console.log('🚀 [useLoadDoc] useLayoutEffect 开始执行');
    console.log('🚀 [useLoadDoc] docRecord 存在:', !!docRecord);
    
    // 如果 docRecord 存在，直接打开文档
    if (docRecord) {
      console.log('✅ [useLoadDoc] docRecord 存在，直接打开文档');
      try {
        const { doc, release } = docsService.open(pageId);
        console.log('✅ [useLoadDoc] 成功打开文档:', doc);
        setDoc(doc);
        const editor = doc.scope.get(EditorsService).createEditor();
        const unbind = editor.bindWorkbenchView(viewService.view);
        setEditor(editor);
        console.log('✅ [useLoadDoc] 成功创建编辑器');
        return () => {
          console.log('🧹 [useLoadDoc] 清理资源');
          unbind();
          editor.dispose();
          release();
        };
      } catch (error) {
        console.error('❌ [useLoadDoc] 打开文档失败:', pageId, error);
        return;
      }
    }
    
    // 如果 docRecord 不存在，尝试监听其变化（解决服务器模式下的同步延迟问题）
    console.log('⏳ [useLoadDoc] docRecord 不存在，开始监听变化');
    const subscription = docRecordList.doc$(pageId).subscribe(record => {
      console.log('📡 [useLoadDoc] 监听到 docRecord 变化:', record);
      if (record) {
        try {
          console.log('✅ [useLoadDoc] 延迟打开文档');
          const { doc, release } = docsService.open(pageId);
          setDoc(doc);
          const editor = doc.scope.get(EditorsService).createEditor();
          const unbind = editor.bindWorkbenchView(viewService.view);
          setEditor(editor);
          console.log('✅ [useLoadDoc] 延迟创建编辑器成功');
          // 清理之前的订阅
          subscription.unsubscribe();
        } catch (error) {
          console.error('❌ [useLoadDoc] 延迟打开文档失败:', pageId, error);
        }
      }
    });

    return () => {
      console.log('🧹 [useLoadDoc] 清理订阅');
      subscription.unsubscribe();
    };
  }, [docRecord, docsService, pageId, viewService.view, docRecordList]);

  // set sync engine priority target
  useEffect(() => {
    console.log('🎯 [useLoadDoc] 设置同步引擎优先级 pageId:', pageId);
    console.log('🎯 [useLoadDoc] 工作空间引擎状态:', currentWorkspace.engine.doc);
    
    const dispose = currentWorkspace.engine.doc.addPriority(pageId, 10);
    
    console.log('🎯 [useLoadDoc] 成功设置同步引擎优先级');
    
    return () => {
      console.log('🎯 [useLoadDoc] 清理同步引擎优先级');
      dispose();
    };
  }, [currentWorkspace, pageId]);

  const isInTrash = useLiveData(doc?.meta$.map(meta => meta.trash));

  useEffect(() => {
    if (doc && isInTrash) {
      console.log('🗑️ [useLoadDoc] 文档在回收站，设置为只读');
      doc.blockSuiteDoc.readonly = true;
    }
  }, [doc, isInTrash]);

  console.log('🔍 [useLoadDoc] 返回状态 - doc:', !!doc, 'editor:', !!editor, 'docListReady:', docListReady);

  return {
    doc,
    editor,
    docListReady,
  };
};

/**
 * A common wrapper for detail page for both mobile and desktop page.
 * It only contains the logic for page loading, context setup, but not the page content.
 */
export const DetailPageWrapper = ({
  pageId,
  children,
  skeleton,
  notFound,
  canAccess,
}: PropsWithChildren<{
  pageId: string;
  skeleton: ReactNode;
  notFound: ReactNode;
  canAccess?: boolean;
}>) => {
  console.log('🎭 [DetailPageWrapper] 渲染开始 pageId:', pageId);
  console.log('🎭 [DetailPageWrapper] canAccess:', canAccess);
  
  const { doc, editor, docListReady } = useLoadDoc(pageId);
  
  console.log('🎭 [DetailPageWrapper] 从 useLoadDoc 获取的状态:');
  console.log('  - doc:', !!doc);
  console.log('  - editor:', !!editor);
  console.log('  - docListReady:', docListReady);
  
  // if sync engine has been synced and the page is null, show 404 page.
  if (docListReady && !doc) {
    console.log('🚫 [DetailPageWrapper] 文档列表已就绪但文档不存在，显示 404');
    return notFound;
  }

  if (canAccess === undefined || !doc || !editor) {
    console.log('🔄 [DetailPageWrapper] 显示加载骨架屏，原因:');
    console.log('  - canAccess === undefined:', canAccess === undefined);
    console.log('  - !doc:', !doc);
    console.log('  - !editor:', !editor);
    return skeleton;
  } else if (!canAccess) {
    console.log('🚫 [DetailPageWrapper] 无权限访问，显示 404');
    return notFound;
  }

  console.log('✅ [DetailPageWrapper] 渲染文档内容');
  return (
    <FrameworkScope scope={doc.scope}>
      <FrameworkScope scope={editor.scope}>{children}</FrameworkScope>
    </FrameworkScope>
  );
};
