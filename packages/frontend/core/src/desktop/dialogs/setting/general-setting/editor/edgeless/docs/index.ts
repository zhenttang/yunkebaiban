// Edgeless docs functionality - reimplemented without GraphQL dependency
import { AffineSchemas } from '@blocksuite/yunke/schemas';
import { nanoid, Schema } from '@blocksuite/yunke/store';
import { type DocCollectionOptions, TestWorkspace } from '@blocksuite/yunke/store/test';
import { MemoryBlobSource } from '@blocksuite/yunke/sync';
import { getInternalStoreExtensions } from '@blocksuite/yunke/extensions/store';
import { StoreExtensionManager } from '@blocksuite/yunke/ext-loader';

export type DocName = 
  | 'note'
  | 'connector'
  | 'shape'
  | 'text'
  | 'pen'
  | 'frame'
  | 'mind-map'
  | 'mindmap'; // 别名，与 mind-map 相同

// 创建 store extension manager
const storeManager = new StoreExtensionManager(getInternalStoreExtensions());
const storeExtensions = storeManager.get('store');

// 创建基础的 Workspace
const createWorkspace = (id: string) => {
  const schema = new Schema();
  schema.register(AffineSchemas);

  const options: DocCollectionOptions = {
    id,
    idGenerator: nanoid,
    blobSources: {
      main: new MemoryBlobSource(),
    },
  };

  const collection = new TestWorkspace(options);
  collection.storeExtensions = storeExtensions;
  collection.meta.initialize();
  collection.start();
  
  return collection;
};

// 创建不同类型的预览文档
const createNoteDoc = async () => {
  const collection = createWorkspace('note-preview');
  const doc = collection.createDoc('note-doc');
  const store = doc.getStore();
  
  store.load(() => {
    const pageBlockId = store.addBlock('affine:page', {});
    // 创建 surface 块（虽然这里不使用它的 ID，但块本身是需要的）
    store.addBlock('affine:surface', {}, pageBlockId);
    
    // 添加一个笔记块用于预览 - 修复：affine:note 应该是 page 的子块，不是 surface 的子块
    store.addBlock(
      'affine:note',
      {
        xywh: '[0,0,400,300]',
        background: '--affine-note-background-blue',
        index: 'a0',
      },
      pageBlockId  // ✓ 修复：使用 pageBlockId 而不是 surfaceBlockId
    );
  });
  
  return store;
};

const createConnectorDoc = async () => {
  const collection = createWorkspace('connector-preview');
  const doc = collection.createDoc('connector-doc');
  const store = doc.getStore();
  
  store.load(() => {
    const pageBlockId = store.addBlock('affine:page', {});
    store.addBlock('affine:surface', {}, pageBlockId);
  });
  
  return store;
};

const createShapeDoc = async () => {
  const collection = createWorkspace('shape-preview');
  const doc = collection.createDoc('shape-doc');
  const store = doc.getStore();
  
  store.load(() => {
    const pageBlockId = store.addBlock('affine:page', {});
    store.addBlock('affine:surface', {}, pageBlockId);
  });
  
  return store;
};

const createTextDoc = async () => {
  const collection = createWorkspace('text-preview');
  const doc = collection.createDoc('text-doc');
  const store = doc.getStore();
  
  store.load(() => {
    const pageBlockId = store.addBlock('affine:page', {});
    store.addBlock('affine:surface', {}, pageBlockId);
  });
  
  return store;
};

const createPenDoc = async () => {
  const collection = createWorkspace('pen-preview');
  const doc = collection.createDoc('pen-doc');
  const store = doc.getStore();
  
  store.load(() => {
    const pageBlockId = store.addBlock('affine:page', {});
    store.addBlock('affine:surface', {}, pageBlockId);
  });
  
  return store;
};

const createFrameDoc = async () => {
  const collection = createWorkspace('frame-preview');
  const doc = collection.createDoc('frame-doc');
  const store = doc.getStore();
  
  store.load(() => {
    const pageBlockId = store.addBlock('affine:page', {});
    store.addBlock('affine:surface', {}, pageBlockId);
  });
  
  return store;
};

const createMindMapDoc = async () => {
  const collection = createWorkspace('mind-map-preview');
  const doc = collection.createDoc('mind-map-doc');
  const store = doc.getStore();
  
  store.load(() => {
    const pageBlockId = store.addBlock('affine:page', {});
    store.addBlock('affine:surface', {}, pageBlockId);
  });
  
  return store;
};

// 文档缓存
const docCache = new Map();

export const getDocByName = async (name: DocName) => {
  // 检查缓存
  if (docCache.has(name)) {
    return docCache.get(name);
  }
  
  try {
    let doc;
    switch (name) {
      case 'note':
        doc = await createNoteDoc();
        break;
      case 'connector':
        doc = await createConnectorDoc();
        break;
      case 'shape':
        doc = await createShapeDoc();
        break;
      case 'text':
        doc = await createTextDoc();
        break;
      case 'pen':
        doc = await createPenDoc();
        break;
      case 'frame':
        doc = await createFrameDoc();
        break;
      case 'mind-map':
      case 'mindmap': // 别名，与 mind-map 相同
        doc = await createMindMapDoc();
        break;
      default:
        console.warn(`Unknown doc name: ${name}`);
        return null;
    }
    
    // 缓存文档
    if (doc) {
      docCache.set(name, doc);
    }
    
    return doc;
  } catch (error) {
    console.error(`Failed to create doc for ${name}:`, error);
    return null;
  }
};

export const EdgelessDocs = () => {
  return null;
};

export default EdgelessDocs;