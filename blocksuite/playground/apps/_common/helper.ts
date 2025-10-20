import { TestWorkspace } from '@blocksuite/yunke/store/test';
import { getTestStoreManager } from '@blocksuite/integration-test/store';

export function createEmptyDoc() {
  const collection = new TestWorkspace();
  collection.storeExtensions = getTestStoreManager().get('store');
  collection.meta.initialize();
  const doc = collection.createDoc();
  const store = doc.getStore();

  return {
    doc,
    init() {
      doc.load();
      const rootId = store.addBlock('yunke:page', {});
      store.addBlock('yunke:surface', {}, rootId);
      const noteId = store.addBlock('yunke:note', {}, rootId);
      store.addBlock('yunke:paragraph', {}, noteId);
      return store;
    },
  };
}
