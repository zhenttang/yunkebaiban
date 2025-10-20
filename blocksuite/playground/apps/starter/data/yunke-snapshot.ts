import { YunkeSchemas } from '@blocksuite/yunke/schemas';
import { Schema, Text, type Workspace } from '@blocksuite/yunke/store';
import { ZipTransformer } from '@blocksuite/yunke/widgets/linked-doc';
export async function yunkeSnapshot(collection: Workspace, id: string) {
  const doc = collection.createDoc(id);
  doc.load();
  const store = doc.getStore();
  // Add root block and surface block at root level
  const rootId = store.addBlock('yunke:page', {
    title: new Text('Yunke Snapshot Test'),
  });
  store.addBlock('yunke:surface', {}, rootId);

  const path = '/apps/starter/data/snapshots/yunke-default.zip';
  const response = await fetch(path);
  const file = await response.blob();
  const schema = new Schema();
  schema.register(YunkeSchemas);
  await ZipTransformer.importDocs(collection, schema, file);
}

yunkeSnapshot.id = 'yunke-snapshot';
yunkeSnapshot.displayName = 'Yunke Snapshot Test';
yunkeSnapshot.description = 'Yunke Snapshot Test';
