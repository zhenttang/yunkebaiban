import { BlocksuiteHeaderTitle } from '@yunke/core/blocksuite/block-suite-header/title';
import { EditorModeSwitch } from '@yunke/core/blocksuite/block-suite-mode-switch';
import ShareHeaderRightItem from '@yunke/core/components/cloud/share-header-right-item';
import type { DocMode } from '@blocksuite/yunke/model';

import * as styles from './share-header.css';

export function ShareHeader({
  publishMode,
  isTemplate,
  templateName,
  snapshotUrl,
}: {
  pageId: string;
  publishMode: DocMode;
  isTemplate?: boolean;
  templateName?: string;
  snapshotUrl?: string;
}) {
  return (
    <div className={styles.header}>
      <EditorModeSwitch />
      <BlocksuiteHeaderTitle />
      <div className={styles.spacer} />
      <ShareHeaderRightItem
        publishMode={publishMode}
        isTemplate={isTemplate}
        snapshotUrl={snapshotUrl}
        templateName={templateName}
      />
    </div>
  );
}
