import {
  createAutoIncrementIdGenerator,
  TestWorkspace,
} from '@blocksuite/store/test';
import { describe, expect, test } from 'vitest';

import { effects } from '../effects.js';
import { TestEditorContainer } from './test-editor.js';
import {
  HeadingBlockSchemaExtension,
  NoteBlockSchemaExtension,
  RootBlockSchemaExtension,
  SurfaceBlockSchemaExtension,
} from './test-schema.js';
import { testSpecs } from './test-spec.js';

effects();

const extensions = [
  RootBlockSchemaExtension,
  NoteBlockSchemaExtension,
  HeadingBlockSchemaExtension,
  SurfaceBlockSchemaExtension,
];

function createTestOptions() {
  const idGenerator = createAutoIncrementIdGenerator();
  return { id: 'test-collection', idGenerator };
}

function wait(time: number) {
  return new Promise(resolve => setTimeout(resolve, time));
}

describe('widgets cache optimization', () => {
  test('editor should render blocks without errors when cache is enabled', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();
    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);
    const heading1 = store.addBlock('test:heading', { type: 'h1' }, noteId);
    const heading2 = store.addBlock('test:heading', { type: 'h2' }, noteId);
    const heading3 = store.addBlock('test:heading', { type: 'h3' }, noteId);

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);

    await wait(50);

    // Verify all blocks are rendered correctly
    const h1Block = editorContainer.std.view.getBlock(heading1);
    const h2Block = editorContainer.std.view.getBlock(heading2);
    const h3Block = editorContainer.std.view.getBlock(heading3);

    expect(h1Block).toBeDefined();
    expect(h2Block).toBeDefined();
    expect(h3Block).toBeDefined();
    expect(h1Block!.tagName).toBe('TEST-H1-BLOCK');
    expect(h2Block!.tagName).toBe('TEST-H2-BLOCK');
    expect(h3Block!.tagName).toBe('TEST-H3-BLOCK');

    editorContainer.remove();
  });

  test('editor should handle multiple re-renders correctly with cache', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();
    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);
    const headingId = store.addBlock('test:heading', { type: 'h1' }, noteId);

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);

    await wait(50);

    // First render
    let headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock!.tagName).toBe('TEST-H1-BLOCK');

    // Trigger re-render by updating the model
    const model = store.getBlock(headingId)!.model;
    store.updateBlock(model, {});

    await wait(50);

    // Second render - should still work correctly with cache
    headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock!.tagName).toBe('TEST-H1-BLOCK');

    editorContainer.remove();
  });

  test('editor should clear cache on reconnection', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();
    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);
    const headingId = store.addBlock('test:heading', { type: 'h1' }, noteId);

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);
    await wait(50);

    // First connection
    let headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock!.tagName).toBe('TEST-H1-BLOCK');

    // Disconnect and reconnect
    editorContainer.remove();
    await wait(50);

    document.body.append(editorContainer);
    await wait(50);

    // Should still render correctly after reconnection
    headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock!.tagName).toBe('TEST-H1-BLOCK');

    editorContainer.remove();
  });

  test('editor should handle multiple blocks with same flavour', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();
    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);

    // Add 10 heading blocks with the same type
    const headingIds = [];
    for (let i = 0; i < 10; i++) {
      headingIds.push(store.addBlock('test:heading', { type: 'h1' }, noteId));
    }

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);

    await wait(50);

    // Verify all blocks are rendered correctly (should use cached widgets)
    for (const id of headingIds) {
      const block = editorContainer.std.view.getBlock(id);
      expect(block).toBeDefined();
      expect(block!.tagName).toBe('TEST-H1-BLOCK');
    }

    editorContainer.remove();
  });

  test('editor should handle different flavours independently in cache', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();
    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);

    // Add blocks with different types
    const h1Id = store.addBlock('test:heading', { type: 'h1' }, noteId);
    const h2Id = store.addBlock('test:heading', { type: 'h2' }, noteId);
    const h3Id = store.addBlock('test:heading', { type: 'h3' }, noteId);

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);

    await wait(50);

    // Each should be rendered correctly with its own widgets cache entry
    const h1Block = editorContainer.std.view.getBlock(h1Id);
    const h2Block = editorContainer.std.view.getBlock(h2Id);
    const h3Block = editorContainer.std.view.getBlock(h3Id);

    expect(h1Block!.tagName).toBe('TEST-H1-BLOCK');
    expect(h2Block!.tagName).toBe('TEST-H2-BLOCK');
    expect(h3Block!.tagName).toBe('TEST-H3-BLOCK');

    // Trigger re-render by updating all models
    store.updateBlock(store.getBlock(h1Id)!.model, {});
    store.updateBlock(store.getBlock(h2Id)!.model, {});
    store.updateBlock(store.getBlock(h3Id)!.model, {});

    await wait(50);

    // All should still be rendered correctly with cache
    expect(editorContainer.std.view.getBlock(h1Id)!.tagName).toBe('TEST-H1-BLOCK');
    expect(editorContainer.std.view.getBlock(h2Id)!.tagName).toBe('TEST-H2-BLOCK');
    expect(editorContainer.std.view.getBlock(h3Id)!.tagName).toBe('TEST-H3-BLOCK');

    editorContainer.remove();
  });
});
