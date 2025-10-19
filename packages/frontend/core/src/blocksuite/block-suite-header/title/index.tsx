import type { InlineEditProps } from '@yunke/component';
import { InlineEdit } from '@yunke/component';
import { useGuard } from '@yunke/core/components/guard';
import { useAsyncCallback } from '@yunke/core/components/hooks/affine-async-hooks';
import { DocService, DocsService } from '@yunke/core/modules/doc';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { track } from '@yunke/track';
import { useLiveData, useService } from '@toeverything/infra';
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
  const docService = useService(DocService);
  const docTitle = useLiveData(docService.doc.record.title$);

  const onChange = useAsyncCallback(
    async (v: string) => {
      await docsService.changeDocTitle(docService.doc.id, v);
      track.$.header.actions.renameDoc();
    },
    [docService.doc.id, docsService]
  );

  const canEdit = useGuard('Doc_Update', docService.doc.id);

  return (
    <InlineEdit
      className={clsx(styles.title, props.className)}
      value={docTitle}
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
