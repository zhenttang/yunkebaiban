import type { YunkeTextAttributes } from '@blocksuite/yunke/shared/types';
import {
  type DeltaInsert,
  Text,
  type Workspace,
} from '@blocksuite/yunke/store';
import { useCallback } from 'react';

export function useReferenceLinkHelper(docCollection: Workspace) {
  const addReferenceLink = useCallback(
    (pageId: string, referenceId: string) => {
      const page = docCollection?.getDoc(pageId)?.getStore();
      if (!page) {
        return;
      }
      const text = new Text([
        {
          insert: ' ',
          attributes: {
            reference: {
              type: 'Subpage',
              pageId: referenceId,
            },
          },
        },
      ] as DeltaInsert<YunkeTextAttributes>[]);
      const [frame] = page.getModelsByFlavour('yunke:note');

      frame && page.addBlock('yunke:paragraph', { text }, frame.id);
    },
    [docCollection]
  );

  return {
    addReferenceLink,
  };
}
