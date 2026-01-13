import {
  createDocExplorerContext,
  DocExplorerContext,
} from '@yunke/core/components/explorer/context';
import { DocsExplorer } from '@yunke/core/components/explorer/docs-view/docs-list';
import { SelectorLayout } from '@yunke/core/components/page-list/selector/selector-layout';
import { DocsService } from '@yunke/core/modules/doc';
import { useI18n } from '@yunke/i18n';
import { useLiveData, useService } from '@toeverything/infra';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

export interface SelectPageProps {
  init: string[];
  onChange?: (ids: string[]) => void;
  onConfirm?: (ids: string[]) => void;
  onCancel?: () => void;
  header?: ReactNode;
  buttons?: ReactNode;
}

export const SelectPage = ({
  init,
  onChange,
  onConfirm,
  onCancel,
  header,
  buttons,
}: SelectPageProps) => {
  const t = useI18n();
  const docsService = useService(DocsService);

  const [selection, setSelection] = useState<string[]>(init);
  const [keyword, setKeyword] = useState('');

  const allDocIds = useLiveData(docsService.list.nonTrashDocsIds$);

  // 创建文档浏览器上下文
  const [explorerContextValue] = useState(() =>
    createDocExplorerContext({
      quickFavorite: true,
      quickSelect: true,
      displayProperties: ['system:createdAt', 'system:updatedAt', 'system:tags'],
      view: 'list',
      showDragHandle: false,
      showMoreOperation: false,
      groupBy: undefined,
      orderBy: {
        type: 'system',
        key: 'updatedAt',
        desc: true,
      },
    })
  );

  // 过滤文档
  const filteredDocIds = useMemo(() => {
    if (!keyword.trim()) {
      return allDocIds;
    }

    const lowerKeyword = keyword.toLowerCase();
    return allDocIds.filter(docId => {
      const doc = docsService.list.doc$(docId).value;
      if (!doc) return false;

      const title = doc.title$.value?.toLowerCase() || '';
      return title.includes(lowerKeyword);
    });
  }, [allDocIds, keyword, docsService.list]);

  // 更新浏览器上下文
  useEffect(() => {
    explorerContextValue.selectMode$?.next(true);
  }, [explorerContextValue]);

  useEffect(() => {
    explorerContextValue.selectedDocIds$.next(selection);
  }, [selection, explorerContextValue]);

  useEffect(() => {
    explorerContextValue.groups$.next([
      {
        key: 'all-docs',
        items: filteredDocIds,
      },
    ]);
  }, [filteredDocIds, explorerContextValue]);

  // 监听选择变化
  useEffect(() => {
    const subscription = explorerContextValue.selectedDocIds$.subscribe(
      ids => {
        setSelection(ids);
        onChange?.(ids);
      }
    );
    return () => subscription.unsubscribe();
  }, [explorerContextValue, onChange]);

  const handleConfirm = useCallback(() => {
    onConfirm?.(selection);
  }, [selection, onConfirm]);

  const handleClear = useCallback(() => {
    setSelection([]);
    explorerContextValue.selectedDocIds$.next([]);
  }, [explorerContextValue]);

  // 如果提供了自定义的 header 和 buttons（用于集合编辑器）
  if (header && buttons) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: '16px 16px 0' }}>{header}</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <DocExplorerContext.Provider value={explorerContextValue}>
            <DocsExplorer />
          </DocExplorerContext.Provider>
        </div>
        <div
          style={{
            padding: '16px',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            borderTop: '1px solid var(--yunke-divider-color)',
          }}
        >
          {buttons}
        </div>
      </div>
    );
  }

  // 默认使用 SelectorLayout（用于对话框）
  return (
    <SelectorLayout
      searchPlaceholder={t['com.yunke.selectPage.search.placeholder']()}
      selectedCount={selection.length}
      onSearch={setKeyword}
      onClear={handleClear}
      onCancel={onCancel}
      onConfirm={handleConfirm}
    >
      <DocExplorerContext.Provider value={explorerContextValue}>
        <DocsExplorer />
      </DocExplorerContext.Provider>
    </SelectorLayout>
  );
};

export default SelectPage;