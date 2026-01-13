import { usePromptModal } from '@yunke/component';
import { useNavigateHelper } from '@yunke/core/components/hooks/use-navigate-helper';
import { CollectionService } from '@yunke/core/modules/collection';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { useI18n } from '@yunke/i18n';
import { ViewLayersIcon } from '@blocksuite/icons/rc';
import { useService } from '@toeverything/infra';
import { useCallback } from 'react';

import { ActionButton } from './action-button';
import collectionListDark from './assets/collection-list.dark.png';
import collectionListLight from './assets/collection-list.light.png';
import todoListIllustration from './assets/to-do-list.svg';
import { EmptyLayout } from './layout';
import type { UniversalEmptyProps } from './types';

export const EmptyCollections = (props: UniversalEmptyProps) => {
  const t = useI18n();
  const collectionService = useService(CollectionService);
  const currentWorkspace = useService(WorkspaceService).workspace;

  const navigateHelper = useNavigateHelper();
  const { openPromptModal } = usePromptModal();

  const showAction = true;

  const handleCreateCollection = useCallback(() => {
    openPromptModal({
      title: t['com.yunke.editCollection.saveCollection'](),
      label: t['com.yunke.editCollectionName.name'](),
      inputOptions: {
        placeholder: t['com.yunke.editCollectionName.name.placeholder'](),
      },
      children: t['com.yunke.editCollectionName.createTips'](),
      confirmText: t['com.yunke.editCollection.save'](),
      cancelText: t['com.yunke.editCollection.button.cancel'](),
      confirmButtonOptions: {
        variant: 'primary',
      },
      onConfirm(name) {
        const id = collectionService.createCollection({ name });
        navigateHelper.jumpToCollection(currentWorkspace.id, id);
      },
    });
  }, [
    collectionService,
    currentWorkspace.id,
    navigateHelper,
    openPromptModal,
    t,
  ]);

  return (
    <EmptyLayout
      illustrationLight={todoListIllustration}
      illustrationDark={todoListIllustration}
      title={t['com.yunke.empty.collections.title']()}
      description={t['com.yunke.empty.collections.description']()}
      action={
        showAction ? (
          <ActionButton
            prefix={<ViewLayersIcon />}
            onClick={handleCreateCollection}
          >
            {t['com.yunke.empty.collections.action.new-collection']()}
          </ActionButton>
        ) : null
      }
      {...props}
    />
  );
};
