import { Entity, LiveData } from '@toeverything/infra';

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
    const docId = this.docScope.props?.docId;
    if (!docId) {
      throw new Error(
        'DocScope props is undefined. ' +
        'DocLinks must be resolved within a DocScope created with props.'
      );
    }
    return docId;
  }

  links$ = LiveData.from<Link[]>(
    this.docsSearchService.watchRefsFrom(this.docId),
    []
  );
}
