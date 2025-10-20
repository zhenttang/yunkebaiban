import { Text, type Workspace } from '@blocksuite/yunke/store';

import type { InitFn } from './utils.js';

export const embed: InitFn = (collection: Workspace, id: string) => {
  const doc = collection.getDoc(id) ?? collection.createDoc(id);
  const store = doc.getStore();
  doc.clear();

  doc.load(() => {
    // Add root block and surface block at root level
    const rootId = store.addBlock('yunke:page', {
      title: new Text(),
    });

    const surfaceId = store.addBlock('yunke:surface', {}, rootId);

    // Add note block inside root block
    const noteId = store.addBlock('yunke:note', {}, rootId);
    // Add paragraph block inside note block
    store.addBlock('yunke:paragraph', {}, noteId);

    store.addBlock(
      'yunke:embed-github',
      {
        url: 'https://github.com/toeverything/YUNKE/pull/5453',
      },
      noteId
    );
    store.addBlock(
      'yunke:embed-github',
      {
        url: 'https://www.github.com/toeverything/blocksuite/pull/5927',
        style: 'vertical',
        xywh: '[0, 400, 364, 390]',
      },
      surfaceId
    );
    store.addBlock(
      'yunke:embed-github',
      {
        url: 'https://github.com/Milkdown/milkdown/pull/1215',
        xywh: '[500, 400, 752, 116]',
      },
      surfaceId
    );
    store.addBlock('yunke:paragraph', {}, noteId);
  });

  store.resetHistory();
};

embed.id = 'embed';
embed.displayName = 'Example for embed blocks';
embed.description = 'Example for embed blocks';
