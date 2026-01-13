import { Entity, LiveData } from '@toeverything/infra';

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
    const docId = this.docScope.props?.docId;
    if (!docId) {
      throw new Error(
        'DocScope props is undefined. ' +
        'DocBacklinks must be resolved within a DocScope created with props.'
      );
    }
    return docId;
  }

  backlinks$ = LiveData.from<Backlink[]>(
    this.docsSearchService.watchRefsTo(this.docId),
    []
  );
}
