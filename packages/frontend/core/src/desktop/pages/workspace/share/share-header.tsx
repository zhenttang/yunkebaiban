import { BlocksuiteHeaderTitle } from '@yunke/core/blocksuite/block-suite-header/title';
import { EditorModeSwitch } from '@yunke/core/blocksuite/block-suite-mode-switch';
import ShareHeaderRightItem from '@yunke/core/components/cloud/share-header-right-item';
import { TemporaryUserCursor } from '@yunke/core/modules/temporary-user/components/temporary-user-cursor';
import type { DocMode } from '@blocksuite/yunke/model';

import * as styles from './share-header.css';

export function ShareHeader({
  publishMode,
  isTemplate,
  templateName,
  snapshotUrl,
  workspaceId,
  docId,
}: {
  pageId: string;
  publishMode: DocMode;
  isTemplate?: boolean;
  templateName?: string;
  snapshotUrl?: string;
  workspaceId?: string;
  docId?: string;
}) {
  return (
    <div className={styles.header}>
      <EditorModeSwitch />
      <BlocksuiteHeaderTitle />
      <div className={styles.spacer} />
      {/* 临时用户协作指示器 */}
      {workspaceId && docId && (
        <TemporaryUserCursor
          workspaceId={workspaceId}
          docId={docId}
        />
      )}
      <ShareHeaderRightItem
        publishMode={publishMode}
        isTemplate={isTemplate}
        snapshotUrl={snapshotUrl}
        templateName={templateName}
      />
    </div>
  );
}
