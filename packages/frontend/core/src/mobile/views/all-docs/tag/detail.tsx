import { Wrapper } from '@yunke/component';
import { EmptyDocs } from '@yunke/core/components/affine/empty';
import {
  createDocExplorerContext,
  DocExplorerContext,
} from '@yunke/core/components/explorer/context';
import { DocsExplorer } from '@yunke/core/components/explorer/docs-view/docs-list';
import { Page } from '@yunke/core/mobile/components/page';
import { CollectionRulesService } from '@yunke/core/modules/collection-rules';
import type { Tag } from '@yunke/core/modules/tag';
import { useLiveData, useService } from '@toeverything/infra';
import { useEffect, useState } from 'react';

import { TagDetailHeader } from './detail-header';

const TagDocs = ({ tag }: { tag: Tag }) => {
  const [explorerContextValue] = useState(() =>
    createDocExplorerContext({
      quickFavorite: true,
      displayProperties: ['createdAt', 'updatedAt', 'tags'],
      view: 'masonry',
      showDragHandle: false,
      groupBy: undefined,
      orderBy: undefined,
    })
  );
  const collectionRulesService = useService(CollectionRulesService);
  const groups = useLiveData(explorerContextValue.groups$);
  const isEmpty =
    groups.length === 0 ||
    (groups.length && groups.every(group => !group.items.length));

  useEffect(() => {
    const subscription = collectionRulesService
      .watch({
        filters: [
          { type: 'system', key: 'trash', method: 'is', value: 'false' },
          {
            type: 'system',
            key: 'tags',
            method: 'include-all',
            value: tag.id,
          },
        ],
        extraFilters: [
          { type: 'system', key: 'trash', method: 'is', value: 'false' },
          {
            type: 'system',
            key: 'empty-journal',
            method: 'is',
            value: 'false',
          },
        ],
        orderBy: {
          type: 'system',
          key: 'updatedAt',
          desc: true,
        },
      })
      .subscribe({
        next: result => {
          explorerContextValue.groups$.next(result.groups);
        },
        error: console.error,
      });
    return () => subscription.unsubscribe();
  }, [collectionRulesService, explorerContextValue.groups$, tag.id]);

  if (isEmpty) {
    return (
      <>
        <EmptyDocs absoluteCenter tagId={tag.id} />
        <Wrapper height={0} flexGrow={1} />
      </>
    );
  }

  return (
    <DocExplorerContext.Provider value={explorerContextValue}>
      <DocsExplorer masonryItemWidthMin={150} />
    </DocExplorerContext.Provider>
  );
};

export const TagDetail = ({ tag }: { tag: Tag }) => {
  return (
    <Page header={<TagDetailHeader tag={tag} />} tab>
      <TagDocs tag={tag} />
    </Page>
  );
};
