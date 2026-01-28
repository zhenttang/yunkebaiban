import { Entity, LiveData } from '@toeverything/infra';
import { EMPTY, switchMap } from 'rxjs';

import type { DocScope } from '../../doc';
import type { DocsSearchService } from '../../docs-search';

export interface Link {
  docId: string;
  title: string;
  params?: URLSearchParams;
}

export class DocLinks extends Entity {
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
  links$ = LiveData.from<Link[]>(
    new LiveData(this.docId).pipe(
      switchMap(docId => {
        if (!docId) return EMPTY;
        return this.docsSearchService.watchRefsFrom(docId);
      })
    ),
    []
  );
}
