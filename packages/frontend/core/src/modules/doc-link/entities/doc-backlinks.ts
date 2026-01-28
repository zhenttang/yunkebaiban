import { Entity, LiveData } from '@toeverything/infra';
import { EMPTY, switchMap } from 'rxjs';

import type { DocScope } from '../../doc';
import type { DocsSearchService } from '../../docs-search';

export interface Backlink {
  docId: string;
  blockId: string;
  title: string;
  noteBlockId?: string;
  displayMode?: string;
  parentBlockId?: string;
  parentFlavour?: string;
  markdownPreview?: string;
}

export class DocBacklinks extends Entity {
  constructor(
    private readonly docsSearchService: DocsSearchService,
    private readonly docScope: DocScope
  ) {
    super();
  }

  private get docId() {
    return this.docScope.props?.docId;
  }

  // 使用延迟计算，避免在 docScope.props 未初始化时抛出错误
  backlinks$ = LiveData.from<Backlink[]>(
    new LiveData(this.docId).pipe(
      switchMap(docId => {
        if (!docId) return EMPTY;
        return this.docsSearchService.watchRefsTo(docId);
      })
    ),
    []
  );
}
