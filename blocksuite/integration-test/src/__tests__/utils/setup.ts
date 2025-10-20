import '@toeverything/theme/style.css';
import '@toeverything/theme/fonts.css';

import type { DocMode } from '@blocksuite/yunke/model';
import { YunkeSchemas } from '@blocksuite/yunke/schemas';
import {
  CommunityCanvasTextFonts,
  FeatureFlagService,
  FontConfigExtension,
} from '@blocksuite/yunke/shared/services';
import {
  type ViewportTurboRendererExtension,
  ViewportTurboRendererIdentifier,
} from '@blocksuite/yunke-gfx-turbo-renderer';
import type { ExtensionType, Store, Transformer } from '@blocksuite/store';
import { Schema, Text } from '@blocksuite/store';
import {
  createAutoIncrementIdGenerator,
  TestWorkspace,
} from '@blocksuite/store/test';

import { effects } from '../../effects.js';
import { TestYunkeEditorContainer } from '../../index.js';
import { getTestStoreManager } from '../../store.js';
import { getTestViewManager } from '../../view.js';

const storeManager = getTestStoreManager();
const viewManager = getTestViewManager();
effects();

const storeExtensions = storeManager.get('store');

export function getRenderer() {
  return editor.std.get(
    ViewportTurboRendererIdentifier
  ) as ViewportTurboRendererExtension;
}

function createCollectionOptions() {
  const schema = new Schema();
  const room = Math.random().toString(16).slice(2, 8);

  schema.register(YunkeSchemas);

  const idGenerator = createAutoIncrementIdGenerator();

  return {
    id: room,
    schema,
    idGenerator,
  };
}

function initCollection(collection: TestWorkspace) {
  const doc = collection.createDoc('doc:home').getStore();

  doc.load(() => {
    const rootId = doc.addBlock('yunke:page', {
      title: new Text(),
    });
    doc.addBlock('yunke:surface', {}, rootId);
  });
  doc.resetHistory();
}

async function createEditor(
  collection: TestWorkspace,
  mode: DocMode = 'page',
  extensions: ExtensionType[] = []
) {
  const app = document.createElement('div');
  const blockCollection = collection.docs.values().next().value;
  if (!blockCollection) {
    throw new Error('Need to create a doc first');
  }
  const doc = blockCollection.getStore();
  const editor = new TestYunkeEditorContainer();
  editor.doc = doc;
  editor.mode = mode;
  editor.pageSpecs = [
    ...viewManager.get('page'),
    FontConfigExtension(CommunityCanvasTextFonts),
    ...extensions,
  ];
  editor.edgelessSpecs = [
    ...viewManager.get('edgeless'),
    FontConfigExtension(CommunityCanvasTextFonts),
    ...extensions,
  ];
  app.append(editor);

  window.editor = editor;
  window.doc = doc;

  app.style.width = '100%';
  app.style.height = '1280px';
  app.style.overflowY = 'auto';

  document.body.append(app);
  await editor.updateComplete;
  return app;
}

export function createPainterWorker() {
  const worker = new Worker(
    new URL('./turbo-painter.worker.ts', import.meta.url),
    {
      type: 'module',
    }
  );
  return worker;
}

type SetupEditorOptions = {
  extensions?: ExtensionType[];
  enableDomRenderer?: boolean;
};

export async function setupEditor(
  mode: DocMode = 'page',
  extensionsInput?: ExtensionType[],
  optionsInput?: SetupEditorOptions
) {
  const extensions: ExtensionType[] = extensionsInput ?? [];
  const options: SetupEditorOptions = optionsInput ?? {};
  const enableDomRenderer = options?.enableDomRenderer ?? false;

  const collection = new TestWorkspace(createCollectionOptions());
  collection.storeExtensions = storeExtensions;
  collection.meta.initialize();

  window.collection = collection;

  initCollection(collection);

  if (enableDomRenderer) {
    const docStore = window.collection.docs.get('doc:home')?.getStore();
    const featureFlagService = docStore?.get(FeatureFlagService);
    featureFlagService?.setFlag('enable_dom_renderer', true);
  }

  const appElement = await createEditor(collection, mode, extensions);

  return () => {
    appElement?.remove();
    cleanup();
  };
}

export function cleanup() {
  window.editor?.remove();

  delete (window as any).collection;

  delete (window as any).editor;

  delete (window as any).store;
}

declare global {
  const editor: TestYunkeEditorContainer;
  const doc: Store;
  const collection: TestWorkspace;
  const job: Transformer;
  interface Window {
    editor: TestYunkeEditorContainer;
    doc: Store;
    job: Transformer;
    collection: TestWorkspace;
    renderer: ViewportTurboRendererExtension;
  }
}
