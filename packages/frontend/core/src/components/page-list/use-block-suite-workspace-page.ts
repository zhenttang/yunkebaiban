import { DebugLogger } from '@yunke/debug';
import { DisposableGroup } from '@blocksuite/yunke/global/disposable';
import type { Store, Workspace } from '@blocksuite/yunke/store';
import { useEffect, useState } from 'react';

const logger = new DebugLogger('useBlockSuiteWorkspacePage');

export function useDocCollectionPage(
  docCollection: Workspace,
  pageId: string | null
): Store | null {
  const [page, setPage] = useState<Store | null>(
    pageId ? (docCollection.getDoc(pageId)?.getStore() ?? null) : null
  );

  useEffect(() => {
    const group = new DisposableGroup();
    group.add(
      docCollection.slots.docListUpdated.subscribe(() => {
        if (!pageId) {
          setPage(null);
        } else {
          setPage(docCollection.getDoc(pageId)?.getStore() ?? null);
        }
      })
    );
    return () => {
      group.dispose();
    };
  }, [docCollection, pageId]);

  useEffect(() => {
    if (page && !page.loaded) {
      try {
        page.load();
      } catch (err) {
        logger.error('加载页面失败', err);
      }
    }
  }, [page]);

  useEffect(() => {
    if (page?.id !== pageId) {
      setPage(
        pageId ? (docCollection.getDoc(pageId)?.getStore() ?? null) : null
      );
    }
  }, [docCollection, page?.id, pageId]);

  return page;
}
