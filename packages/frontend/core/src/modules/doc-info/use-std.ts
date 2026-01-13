import { getViewManager } from '@yunke/core/blocksuite/manager/view';
import { DebugLogger } from '@yunke/debug';
import { BlockStdScope } from '@blocksuite/yunke/std';
import type { Store } from '@blocksuite/yunke/store';
import { useMemo } from 'react';

const logger = new DebugLogger('doc-info');
// todo(pengx17): use rc pool?
export function createBlockStdScope(doc: Store) {
  logger.debug('创建块标准作用域', doc.id);
  const std = new BlockStdScope({
    store: doc,
    extensions: getViewManager().config.init().value.get('page'),
  });
  return std;
}

export function useBlockStdScope(doc: Store) {
  return useMemo(() => createBlockStdScope(doc), [doc]);
}
