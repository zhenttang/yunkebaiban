import { TagService } from '@yunke/core/modules/tag';
import { WorkspaceService } from '@yunke/core/modules/workspace';
import { inferOpenMode } from '@yunke/core/utils';
import { useI18n } from '@yunke/i18n';
import { AllDocsIcon } from '@blocksuite/icons/rc';
import { useLiveData, useService } from '@toeverything/infra';
import { type MouseEvent, useCallback } from 'react';

import { usePageHelper } from '../../../blocksuite/block-suite-page-list/utils';
import { ActionButton } from './action-button';
import docsIllustrationDark from './assets/docs.dark.png';
import docsIllustrationLight from './assets/docs.light.png';
import emptyStateIllustration from './assets/empty_4zx0.svg';
import { EmptyLayout } from './layout';
import type { UniversalEmptyProps } from './types';

export interface EmptyDocsProps extends UniversalEmptyProps {
  type?: 'all' | 'trash';
  /**
   * Used for "New doc", if provided, new doc will be created with this tag.
   */
  tagId?: string;
}

export const EmptyDocs = ({
  type = 'all',
  tagId,
  ...props
}: EmptyDocsProps) => {
  const t = useI18n();
  const tagService = useService(TagService);
  const currentWorkspace = useService(WorkspaceService).workspace;
  const pageHelper = usePageHelper(currentWorkspace.docCollection);
  const tag = useLiveData(tagService.tagList.tagByTagId$(tagId));

  const showActionButton = type !== 'trash'; // && !BUILD_CONFIG.isMobileEdition;

  const onCreate = useCallback(
    (e: MouseEvent) => {
      const doc = pageHelper.createPage(undefined, {
        at: inferOpenMode(e),
      });

      if (tag) tag.tag(doc.id);
    },
    [pageHelper, tag]
  );

  return (
    <EmptyLayout
      illustrationLight={emptyStateIllustration}
      illustrationDark={emptyStateIllustration}
      title={t['com.yunke.empty.docs.title']()}
      description={
        type === 'trash'
          ? t['com.yunke.empty.docs.trash-description']()
          : t['com.yunke.empty.docs.all-description']()
      }
      action={
        showActionButton ? (
          <ActionButton onClick={onCreate} prefix={<AllDocsIcon />}>
            {t['com.yunke.empty.docs.action.new-doc']()}
          </ActionButton>
        ) : null
      }
      {...props}
    />
  );
};
