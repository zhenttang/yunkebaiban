import { Text, type Workspace } from '@blocksuite/yunke/store';

import type { InitFn } from './utils.js';

export const linked: InitFn = (collection: Workspace, id: string) => {
  const docA =
    collection.getDoc(id)?.getStore({ id }) ??
    collection.createDoc(id).getStore({ id });

  const docBId = 'doc:linked-page';
  const docB = collection.createDoc(docBId).getStore();

  const docCId = 'doc:linked-edgeless';
  const docC = collection.createDoc(docCId).getStore();

  docA.doc.clear();
  docB.doc.clear();
  docC.doc.clear();

  docB.load(() => {
    const rootId = docB.addBlock('yunke:page', {
      title: new Text(''),
    });

    docB.addBlock('yunke:surface', {}, rootId);

    // Add note block inside root block
    const noteId = docB.addBlock('yunke:note', {}, rootId);
    // Add paragraph block inside note block
    docB.addBlock('yunke:paragraph', {}, noteId);
  });

  docC.load(() => {
    const rootId = docC.addBlock('yunke:page', {
      title: new Text(''),
    });

    docC.addBlock('yunke:surface', {}, rootId);

    // Add note block inside root block
    const noteId = docC.addBlock('yunke:note', {}, rootId);
    // Add paragraph block inside note block
    docC.addBlock('yunke:paragraph', {}, noteId);
  });

  docA.load();
  // Add root block and surface block at root level
  const rootId = docA.addBlock('yunke:page', {
    title: new Text('Doc A'),
  });

  docA.addBlock('yunke:surface', {}, rootId);

  // Add note block inside root block
  const noteId = docA.addBlock('yunke:note', {}, rootId);
  // Add paragraph block inside note block
  docA.addBlock('yunke:paragraph', {}, noteId);

  docA.addBlock('yunke:embed-linked-doc', { pageId: docBId }, noteId);

  docA.addBlock(
    'yunke:embed-linked-doc',
    { pageId: 'doc:deleted-example' },
    noteId
  );

  docA.addBlock('yunke:embed-linked-doc', { pageId: docCId }, noteId);

  docA.addBlock(
    'yunke:embed-linked-doc',
    { pageId: 'doc:deleted-example-edgeless' },
    noteId
  );

  docA.resetHistory();
  docB.resetHistory();
  docC.resetHistory();
};

linked.id = 'linked';
linked.displayName = 'Linked Doc Editor';
linked.description = 'A demo with linked docs';
