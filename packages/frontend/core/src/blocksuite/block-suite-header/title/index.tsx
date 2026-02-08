import type { InlineEditProps } from '@yunke/component';
import { InlineEdit } from '@yunke/component';
import { useGuard } from '@yunke/core/components/guard';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { DocsService } from '@yunke/core/modules/doc';
import { EditorService } from '@yunke/core/modules/editor';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { track } from '@yunke/track';
import { useLiveData, useService, useServiceOptional } from '@toeverything/infra';
import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

import * as styles from './style.css';

export interface BlockSuiteHeaderTitleProps {
  /** 如果设置，标题无法编辑 */
  inputHandleRef?: InlineEditProps['handleRef'];
  className?: string;
}

const inputAttrs = {
  'data-testid': 'title-content',
} as HTMLAttributes<HTMLInputElement>;
export const BlocksuiteHeaderTitle = (props: BlockSuiteHeaderTitleProps) => {
  const { inputHandleRef } = props;
  const workspaceService = useService(WorkspaceService);
  const isSharedMode = workspaceService.workspace.openOptions.isSharedMode;
  const docsService = useService(DocsService);
  // 使用 useServiceOptional 避免在没有 EditorScope 时报错
  const editorService = useServiceOptional(EditorService);
  
  // ✅ 安全地获取文档ID：使用可选链和 try-catch 保护
  const editor = editorService?.editor;
  let docId: string | undefined;
  
  // 尝试安全地访问 editor.doc.id
  try {
    // editor.doc 是 getter，可能会抛出错误如果 DocScope 未初始化
    // 使用可选链处理 editor 可能为 undefined 的情况
    docId = editor?.doc?.id;
  } catch (error) {
    // Editor.doc 访问失败（DocScope 未初始化），docId 保持 undefined
    // 这是正常的，组件会在 DocScope 初始化后重新渲染
  }
  
  if (!docId) {
    // 文档未加载或 DocScope 未初始化，返回空标题（等待 DocScope 初始化）
    return (
      <InlineEdit
        className={clsx(styles.title, props.className)}
        value=""
        onChange={async () => {}}
        editable={false}
        exitible={true}
        placeholder="无标题"
        data-testid="title-edit-button"
        handleRef={inputHandleRef}
        inputAttrs={inputAttrs}
      />
    );
  }

  // ✅ 使用 DocsService 获取文档标题（不依赖 DocScope）
  const docRecord = docsService.list.doc$(docId).value;
  const docTitle = useLiveData(docRecord?.title$ || '');

  const onChange = useAsyncCallback(
    async (v: string) => {
      if (!docId) return;
      await docsService.changeDocTitle(docId, v);
      track.$.header.actions.renameDoc();
    },
    [docId, docsService]
  );

  const canEdit = useGuard('Doc_Update', docId);

  return (
    <InlineEdit
      className={clsx(styles.title, props.className)}
      value={docTitle || ''}
      onChange={onChange}
      editable={!isSharedMode && canEdit}
      exitible={true}
      placeholder="无标题"
      data-testid="title-edit-button"
      handleRef={inputHandleRef}
      inputAttrs={inputAttrs}
    />
  );
};
