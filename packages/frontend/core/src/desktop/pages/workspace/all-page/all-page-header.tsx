import { type MenuProps } from '@yunke/component';
import { usePageHelper } from '@yunke/core/blocksuite/block-suite-page-list/utils';
import { ExplorerDisplayMenuButton } from '@yunke/core/components/explorer/display-menu';
import { ViewToggle } from '@yunke/core/components/explorer/display-menu/view-toggle';
import type { DocListItemView } from '@yunke/core/components/explorer/docs-view/doc-list-item';
import { ExplorerNavigation } from '@yunke/core/components/explorer/header/navigation';
import type { ExplorerDisplayPreference } from '@yunke/core/components/explorer/types';
import { PageListNewPageButton } from '@yunke/core/components/page-list/docs/page-list-new-page-button';
import { WorkspaceDialogService } from '@yunke/core/modules/dialogs';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { inferOpenMode } from '@yunke/core/utils';
import { useI18n } from '@yunke/i18n';
import track from '@yunke/track';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import * as styles from './all-page-header.css';

const menuProps: Partial<MenuProps> = {
  contentOptions: {
    side: 'bottom',
    align: 'end',
    alignOffset: 0,
    sideOffset: 8,
  },
};
export const AllDocsHeader = ({
  displayPreference,
  onDisplayPreferenceChange,
  view,
  onViewChange,
}: {
  displayPreference: ExplorerDisplayPreference;
  onDisplayPreferenceChange: (
    displayPreference: ExplorerDisplayPreference
  ) => void;
  view: DocListItemView;
  onViewChange: (view: DocListItemView) => void;
}) => {
  const t = useI18n();
  const workspaceService = useService(WorkspaceService);
  const workspaceDialogService = useService(WorkspaceDialogService);
  const workbenchService = useService(WorkbenchService);
  const workbench = workbenchService.workbench;
  const { createEdgeless, createPage } = usePageHelper(
    workspaceService.workspace.docCollection
  );

  const handleOpenDocs = useCallback(
    (result: {
      docIds: string[];
      entryId?: string;
      isWorkspaceFile?: boolean;
    }) => {
      const { docIds, entryId, isWorkspaceFile } = result;
      // If the imported file is a workspace file, open the entry page.
      if (isWorkspaceFile && entryId) {
        workbench.openDoc(entryId);
      } else if (!docIds.length) {
        return;
      }
      // Open all the docs when there are multiple docs imported.
      if (docIds.length > 1) {
        workbench.openAll();
      } else {
        // Otherwise, open the only doc.
        workbench.openDoc(docIds[0]);
      }
    },
    [workbench]
  );

  const onImportFile = useCallback(() => {
    track.$.header.importModal.open();
    workspaceDialogService.open('import', undefined, payload => {
      if (!payload) {
        return;
      }
      handleOpenDocs(payload);
    });
  }, [workspaceDialogService, handleOpenDocs]);

  return (
    <div className={styles.headerContainer}>
      <div className={styles.headerLeft}>
        <ExplorerNavigation active="docs" />
      </div>

      <div className={styles.headerRight}>
        <div className={styles.viewControls}>
          <ViewToggle view={view} onViewChange={onViewChange} />
          <div className={styles.divider} />
          <ExplorerDisplayMenuButton
            menuProps={menuProps}
            displayPreference={displayPreference}
            onDisplayPreferenceChange={onDisplayPreferenceChange}
          />
        </div>

        <div className={styles.actionGroup}>
          <PageListNewPageButton
            size="small"
            onCreateEdgeless={e => createEdgeless({ at: inferOpenMode(e) })}
            onCreatePage={e => createPage('page', { at: inferOpenMode(e) })}
            onCreateDoc={e => createPage(undefined, { at: inferOpenMode(e) })}
            onImportFile={onImportFile}
            data-testid="new-page-button-trigger"
            className={styles.newPageButton}
          >
            <span className={styles.newPageButtonLabel}>{t['New Page']()}</span>
          </PageListNewPageButton>
        </div>
      </div>
    </div>
  );
};
