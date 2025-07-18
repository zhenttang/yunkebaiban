import { useDocMetaHelper } from '@affine/core/components/hooks/use-block-suite-page-meta';
import { useDocCollectionPage } from '@affine/core/components/hooks/use-block-suite-workspace-page';
import { FetchService } from '@affine/core/modules/cloud';
import {
  type WorkspaceFlavourProvider,
  WorkspaceService,
  WorkspacesService,
} from '@affine/core/modules/workspace';
import { WorkspaceImpl } from '@affine/core/modules/workspace/impls/workspace';
import { DebugLogger } from '@affine/debug';
import { i18nTime } from '@affine/i18n';
import type { Workspace } from '@blocksuite/affine/store';
import { useService } from '@toeverything/infra';
import { useEffect, useMemo, useState, useCallback } from 'react';
import useSWRImmutable from 'swr/immutable';
import {
  applyUpdate,
  Doc as YDoc,
  encodeStateAsUpdate,
  encodeStateVector,
  UndoManager,
} from 'yjs';

import { useMutation } from '../../../components/hooks/use-mutation';

const logger = new DebugLogger('page-history');

// 定义Java后端API的类型
interface DocHistory {
  id: string;
  timestamp: string;
  workspaceId: string;
  pageDocId: string;
  version: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

interface ListHistoryResponse {
  histories: DocHistory[];
  total: number;
  hasMore: boolean;
}

// Java后端API调用函数
const fetchHistoryList = async (
  fetchService: FetchService,
  workspaceId: string,
  pageDocId: string,
  before?: string,
  take: number = 10
): Promise<ListHistoryResponse> => {
  const params = new URLSearchParams({
    workspaceId,
    pageDocId,
    take: take.toString(),
  });
  
  if (before) {
    params.append('before', before);
  }

  const response = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs/${pageDocId}/histories?${params}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch history list');
  }
  
  return response.json();
};

const recoverDocumentVersion = async (
  fetchService: FetchService,
  workspaceId: string,
  docId: string,
  timestamp: string
): Promise<void> => {
  const response = await fetchService.fetch(`/api/workspaces/${workspaceId}/docs/${docId}/recover`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timestamp,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to recover document version');
  }
};

export const useDocSnapshotList = (workspaceId: string, pageDocId: string) => {
  const fetchService = useService(FetchService);
  const [histories, setHistories] = useState<DocHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 10;

  const loadHistories = useCallback(async (before?: string) => {
    if (loading) return;
    
    setLoading(true);
    try {
      const response = await fetchHistoryList(fetchService, workspaceId, pageDocId, before, pageSize);
      
      if (before) {
        // 加载更多
        setHistories(prev => [...prev, ...response.histories]);
      } else {
        // 初始加载
        setHistories(response.histories);
      }
      
      setHasMore(response.hasMore);
    } catch (error) {
      console.error('Failed to load histories:', error);
      setHistories([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchService, workspaceId, pageDocId, loading]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && histories.length > 0) {
      const lastHistory = histories[histories.length - 1];
      loadHistories(lastHistory.timestamp);
    }
  }, [hasMore, loading, histories, loadHistories]);

  // 初始加载
  useEffect(() => {
    loadHistories();
  }, [workspaceId, pageDocId]); // 注意：不包含 loadHistories 以避免无限循环

  return [histories, hasMore ? loadMore : false, loading] as const;
};

const snapshotFetcher = async (
  [fetchService, workspaceId, pageDocId, ts]: [
    FetchService,
    workspaceId: string,
    pageDocId: string,
    ts: string,
  ] // timestamp is the key to the history/snapshot
) => {
  if (!ts) {
    return null;
  }
  const res = await fetchService.fetch(
    `/api/workspaces/${workspaceId}/docs/${pageDocId}/histories/${ts}`
  );

  if (!res.ok) {
    throw new Error('获取快照失败');
  }

  const snapshot = await res.arrayBuffer();
  if (!snapshot) {
    throw new Error('无效快照');
  }
  return snapshot;
};

// attach the Page shown in the modal to a temporary workspace
// so that we do not need to worry about providers etc
// TODO(@Peng): fix references to the page (the referenced page will shown as deleted)
// if we simply clone the current workspace, it maybe time consuming right?
const docCollectionMap = new Map<string, Workspace>();

// assume the workspace is a cloud workspace since the history feature is only enabled for cloud workspace
const getOrCreateShellWorkspace = (
  workspaceId: string,
  flavourProvider?: WorkspaceFlavourProvider
) => {
  let docCollection = docCollectionMap.get(workspaceId);
  if (!docCollection) {
    docCollection = new WorkspaceImpl({
      id: workspaceId,
      rootDoc: new YDoc({ guid: workspaceId }),
      blobSource: {
        name: 'cloud',
        readonly: true,
        async get(key) {
          return flavourProvider?.getWorkspaceBlob(workspaceId, key) ?? null;
        },
        set() {
          return Promise.resolve('');
        },
        delete() {
          return Promise.resolve();
        },
        list() {
          return Promise.resolve([]);
        },
      },
    });
    docCollectionMap.set(workspaceId, docCollection);
    docCollection.doc.emit('sync', [true, docCollection.doc]);
  }
  return docCollection;
};

// workspace id + page id + timestamp -> snapshot (update binary)
export const usePageHistory = (
  workspaceId: string,
  pageDocId: string,
  ts?: string
) => {
  const fetchService = useService(FetchService);
  // snapshot should be immutable. so we use swr immutable to disable revalidation
  const { data } = useSWRImmutable<ArrayBuffer | null>(
    [fetchService, workspaceId, pageDocId, ts],
    {
      fetcher: snapshotFetcher,
      suspense: false,
    }
  );
  return data ?? undefined;
};

// workspace id + page id + timestamp + snapshot -> Page (to be used for rendering in blocksuite editor)
export const useSnapshotPage = (
  docCollection: Workspace,
  pageDocId: string,
  ts?: string
) => {
  const affineWorkspace = useService(WorkspaceService).workspace;
  const workspacesService = useService(WorkspacesService);
  const fetchService = useService(FetchService);
  const snapshot = usePageHistory(docCollection.id, pageDocId, ts);
  const page = useMemo(() => {
    if (!ts) {
      return;
    }
    const pageId = pageDocId + '-' + ts;
    const historyShellWorkspace = getOrCreateShellWorkspace(
      docCollection.id,
      workspacesService.getWorkspaceFlavourProvider(affineWorkspace.meta)
    );
    let page = historyShellWorkspace.getDoc(pageId)?.getStore();
    if (!page && snapshot) {
      page = historyShellWorkspace.createDoc(pageId).getStore();
      page.readonly = true;
      const spaceDoc = page.spaceDoc;
      page.load(() => {
        applyUpdate(spaceDoc, new Uint8Array(snapshot));
      }); // must load before applyUpdate
    }
    return page ?? undefined;
  }, [
    ts,
    pageDocId,
    docCollection.id,
    workspacesService,
    affineWorkspace.meta,
    snapshot,
  ]);

  useEffect(() => {
    const historyShellWorkspace = getOrCreateShellWorkspace(
      docCollection.id,
      workspacesService.getWorkspaceFlavourProvider(affineWorkspace.meta)
    );
    // apply the rootdoc's update to the current workspace
    // this makes sure the page reference links are not deleted ones in the preview
    const update = encodeStateAsUpdate(docCollection.doc);
    applyUpdate(historyShellWorkspace.doc, update);
  }, [
    affineWorkspace.meta,
    docCollection,
    fetchService,
    workspacesService,
  ]);

  return page;
};

export const historyListGroupByDay = (histories: DocHistory[]) => {
  const map = new Map<string, DocHistory[]>();
  for (const history of histories) {
    const day = i18nTime(history.timestamp, {
      relative: {
        max: [1, 'week'],
        accuracy: 'day',
        weekday: true,
      },
      absolute: {
        accuracy: 'day',
        noYear: true,
      },
    });
    const list = map.get(day) ?? [];
    list.push(history);
    map.set(day, list);
  }
  return [...map.entries()];
};

export function revertUpdate(
  doc: YDoc,
  snapshotUpdate: Uint8Array,
  getMetadata: (key: string) => 'Text' | 'Map' | 'Array'
) {
  const snapshotDoc = new YDoc();
  applyUpdate(snapshotDoc, snapshotUpdate);

  const currentStateVector = encodeStateVector(doc);
  const snapshotStateVector = encodeStateVector(snapshotDoc);

  const changesSinceSnapshotUpdate = encodeStateAsUpdate(
    doc,
    snapshotStateVector
  );
  const undoManager = new UndoManager(
    // oxlint-disable array-callback-return
    [...snapshotDoc.share.keys()].map(key => {
      const type = getMetadata(key);
      if (type === 'Text') {
        return snapshotDoc.getText(key);
      } else if (type === 'Map') {
        return snapshotDoc.getMap(key);
      } else if (type === 'Array') {
        return snapshotDoc.getArray(key);
      }

      throw new Error('Unknown type');
    })
  );
  applyUpdate(snapshotDoc, changesSinceSnapshotUpdate);
  undoManager.undo();
  const revertChangesSinceSnapshotUpdate = encodeStateAsUpdate(
    snapshotDoc,
    currentStateVector
  );
  applyUpdate(doc, revertChangesSinceSnapshotUpdate);
}

export const useRestorePage = (docCollection: Workspace, pageId: string) => {
  const page = useDocCollectionPage(docCollection, pageId);
  const fetchService = useService(FetchService);
  const { trigger: recover, isMutating } = useMutation({
    mutationFn: async (variables: { docId: string; timestamp: string; workspaceId: string }) => {
      return recoverDocumentVersion(fetchService, variables.workspaceId, variables.docId, variables.timestamp);
    },
  });
  const { getDocMeta, setDocTitle } = useDocMetaHelper();

  const onRestore = useMemo(() => {
    return async (version: string, update: Uint8Array) => {
      if (!page) {
        return;
      }
      const pageDocId = page.spaceDoc.guid;
      revertUpdate(page.spaceDoc, update, key => {
        if (key !== 'blocks') {
          throw new Error('Only expect this value is "blocks"');
        }
        return 'Map';
      });

      // should also update the page title, since it may be changed in the history
      const title = page.meta?.title ?? '';

      if (getDocMeta(pageId)?.title !== title) {
        setDocTitle(pageId, title);
      }

      await recover({
        docId: pageDocId,
        timestamp: version,
        workspaceId: docCollection.id,
      });

      // 刷新历史记录列表（使用Java后端的缓存清理）
      // 这里可能需要调用其他API来刷新缓存
      
      logger.info('页面已恢复', pageDocId, version);
    };
  }, [
    getDocMeta,
    page,
    pageId,
    recover,
    setDocTitle,
    docCollection.id,
  ]);

  return {
    onRestore,
    isMutating,
  };
};
