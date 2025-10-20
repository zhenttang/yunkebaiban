import {
  MenuItem,
  MenuSeparator,
  MenuSub,
  toast,
  useConfirmModal,
} from '@yunke/component';
import { usePageHelper } from '@yunke/core/blocksuite/block-suite-page-list/utils';
import { Guard } from '@yunke/core/components/guard';
import { useBlockSuiteMetaHelper } from '@yunke/core/components/hooks/yunke/use-block-suite-meta-helper';
import { useAsyncCallback } from '@yunke/core/components/hooks/yunke-async-hooks';
import { IsFavoriteIcon } from '@yunke/core/components/pure/icons';
import type { NodeOperation } from '@yunke/core/desktop/components/navigation-panel';
import { DocsService } from '@yunke/core/modules/doc';
import { CompatibleFavoriteItemsAdapter } from '@yunke/core/modules/favorite';
import { WorkbenchService } from '@yunke/core/modules/workbench';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { preventDefault } from '@yunke/core/utils';
import { useI18n } from '@yunke/i18n';
import { track } from '@yunke/track';
import {
  DeleteIcon,
  DuplicateIcon,
  InformationIcon,
  LinkedPageIcon,
  OpenInNewIcon,
} from '@blocksuite/icons/rc';
import { useLiveData, useService, useServices } from '@toeverything/infra';
import { useCallback, useMemo } from 'react';

import { DocFrameScope, DocInfoSheet } from '../../../doc-info';
import { DocRenameSubMenu } from './dialog';

export const useNavigationPanelDocNodeOperations = (
  docId: string,
  options: {
    openNodeCollapsed: () => void;
  }
) => {
  const t = useI18n();
  const {
    workbenchService,
    workspaceService,
    docsService,
    compatibleFavoriteItemsAdapter,
  } = useServices({
    DocsService,
    WorkbenchService,
    WorkspaceService,
    CompatibleFavoriteItemsAdapter,
  });

  const { openConfirmModal } = useConfirmModal();

  const docRecord = useLiveData(docsService.list.doc$(docId));

  const { createPage } = usePageHelper(
    workspaceService.workspace.docCollection
  );

  const favorite = useLiveData(
    useMemo(() => {
      return compatibleFavoriteItemsAdapter.isFavorite$(docId, 'doc');
    }, [docId, compatibleFavoriteItemsAdapter])
  );

  const { duplicate } = useBlockSuiteMetaHelper();
  const handleDuplicate = useCallback(() => {
    duplicate(docId, true);
    track.$.navigationPanel.docs.createDoc();
  }, [docId, duplicate]);

  const handleMoveToTrash = useCallback(() => {
    if (!docRecord) {
      return;
    }
    openConfirmModal({
      title: t['com.yunke.moveToTrash.title'](),
      description: t['com.yunke.moveToTrash.confirmModal.description']({
        title: docRecord.title$.value,
      }),
      confirmText: t['com.yunke.moveToTrash.confirmModal.confirm'](),
      cancelText: t['com.yunke.moveToTrash.confirmModal.cancel'](),
      confirmButtonOptions: {
        variant: 'error',
      },
      onConfirm() {
        docRecord.moveToTrash();
        track.$.navigationPanel.docs.deleteDoc({
          control: 'button',
        });
        toast(t['com.yunke.toastMessage.movedTrash']());
      },
    });
  }, [docRecord, openConfirmModal, t]);

  const handleOpenInNewTab = useCallback(() => {
    workbenchService.workbench.openDoc(docId, {
      at: 'new-tab',
    });
    track.$.navigationPanel.organize.openInNewTab({
      type: 'doc',
    });
  }, [docId, workbenchService]);

  const handleOpenInSplitView = useCallback(() => {
    workbenchService.workbench.openDoc(docId, {
      at: 'beside',
    });
    track.$.navigationPanel.organize.openInSplitView({
      type: 'doc',
    });
  }, [docId, workbenchService.workbench]);

  const handleAddLinkedPage = useAsyncCallback(async () => {
    const newDoc = createPage();
    // TODO: handle timeout & error
    await docsService.addLinkedDoc(docId, newDoc.id);
    track.$.navigationPanel.docs.createDoc({ control: 'linkDoc' });
    track.$.navigationPanel.docs.linkDoc({ control: 'createDoc' });
    options.openNodeCollapsed();
  }, [createPage, docId, docsService, options]);

  const handleToggleFavoriteDoc = useCallback(() => {
    compatibleFavoriteItemsAdapter.toggle(docId, 'doc');
    track.$.navigationPanel.organize.toggleFavorite({
      type: 'doc',
    });
  }, [docId, compatibleFavoriteItemsAdapter]);

  const handleRename = useAsyncCallback(
    async (newName: string) => {
      await docsService.changeDocTitle(docId, newName);
      track.$.navigationPanel.organize.renameOrganizeItem({ type: 'doc' });
    },
    [docId, docsService]
  );

  return useMemo(
    () => ({
      favorite,
      handleAddLinkedPage,
      handleDuplicate,
      handleToggleFavoriteDoc,
      handleOpenInSplitView,
      handleOpenInNewTab,
      handleMoveToTrash,
      handleRename,
    }),
    [
      favorite,
      handleAddLinkedPage,
      handleDuplicate,
      handleMoveToTrash,
      handleOpenInNewTab,
      handleOpenInSplitView,
      handleRename,
      handleToggleFavoriteDoc,
    ]
  );
};

export const useNavigationPanelDocNodeOperationsMenu = (
  docId: string,
  options: {
    openInfoModal: () => void;
    openNodeCollapsed: () => void;
  }
): NodeOperation[] => {
  const t = useI18n();
  const {
    favorite,
    handleAddLinkedPage,
    handleDuplicate,
    handleToggleFavoriteDoc,
    handleOpenInNewTab,
    handleMoveToTrash,
    handleRename,
  } = useNavigationPanelDocNodeOperations(docId, options);

  const docService = useService(DocsService);
  const docRecord = useLiveData(docService.list.doc$(docId));
  const title = useLiveData(docRecord?.title$);

  return useMemo(
    () => [
      {
        index: 10,
        view: (
          <Guard docId={docId} permission="Doc_Update">
            {canEdit => (
              <DocRenameSubMenu
                onConfirm={handleRename}
                initialName={title}
                disabled={!canEdit}
              />
            )}
          </Guard>
        ),
      },
      {
        index: 11,
        view: <MenuSeparator />,
      },
      {
        index: 50,
        view: (
          <MenuSub
            triggerOptions={{
              prefixIcon: <InformationIcon />,
              onClick: preventDefault,
            }}
            title={title ?? t['unnamed']()}
            items={
              <DocFrameScope docId={docId}>
                <DocInfoSheet docId={docId} />
              </DocFrameScope>
            }
          >
            <span>{t['com.yunke.page-properties.page-info.view']()}</span>
          </MenuSub>
        ),
      },
      {
        index: 97,
        view: (
          <Guard docId={docId} permission="Doc_Update">
            {canEdit => (
              <MenuItem
                prefixIcon={<LinkedPageIcon />}
                onClick={handleAddLinkedPage}
                disabled={!canEdit}
              >
                {t['com.yunke.page-operation.add-linked-page']()}
              </MenuItem>
            )}
          </Guard>
        ),
      },
      {
        index: 98,
        view: (
          <MenuItem prefixIcon={<DuplicateIcon />} onClick={handleDuplicate}>
            {t['com.yunke.header.option.duplicate']()}
          </MenuItem>
        ),
      },
      {
        index: 99,
        view: (
          <MenuItem prefixIcon={<OpenInNewIcon />} onClick={handleOpenInNewTab}>
            {t['com.yunke.workbench.tab.page-menu-open']()}
          </MenuItem>
        ),
      },
      {
        index: 199,
        view: (
          <MenuItem
            prefixIcon={<IsFavoriteIcon favorite={favorite} />}
            onClick={handleToggleFavoriteDoc}
          >
            {favorite
              ? t['com.yunke.favoritePageOperation.remove']()
              : t['com.yunke.favoritePageOperation.add']()}
          </MenuItem>
        ),
      },
      {
        index: 9999,
        view: <MenuSeparator key="menu-separator" />,
      },
      {
        index: 10000,
        view: (
          <Guard docId={docId} permission="Doc_Trash">
            {canMoveToTrash => (
              <MenuItem
                type={'danger'}
                prefixIcon={<DeleteIcon />}
                onClick={handleMoveToTrash}
                disabled={!canMoveToTrash}
              >
                {t['com.yunke.moveToTrash.title']()}
              </MenuItem>
            )}
          </Guard>
        ),
      },
    ],
    [
      docId,
      favorite,
      handleAddLinkedPage,
      handleDuplicate,
      handleMoveToTrash,
      handleOpenInNewTab,
      handleRename,
      handleToggleFavoriteDoc,
      t,
      title,
    ]
  );
};
