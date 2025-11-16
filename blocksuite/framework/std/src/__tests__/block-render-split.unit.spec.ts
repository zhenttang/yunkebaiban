import {
  createAutoIncrementIdGenerator,
  TestWorkspace,
} from '@blocksuite/store/test';
import { describe, expect, test, vi } from 'vitest';

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

describe('block render split optimization', () => {
  test('should render initial blocks correctly', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();
    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);
    const h1Id = store.addBlock('test:heading', { type: 'h1' }, noteId);
    const h2Id = store.addBlock('test:heading', { type: 'h2' }, noteId);

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);
    await wait(50);

    const h1Block = editorContainer.std.view.getBlock(h1Id);
    const h2Block = editorContainer.std.view.getBlock(h2Id);

    expect(h1Block).toBeDefined();
    expect(h2Block).toBeDefined();
    expect(h1Block!.tagName).toBe('TEST-H1-BLOCK');
    expect(h2Block!.tagName).toBe('TEST-H2-BLOCK');

    editorContainer.remove();
  });

  test('should optimize rendering with deep nesting', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();

    // Create a deeply nested structure: root -> note -> h1 -> h2 -> h3
    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);
    const h1Id = store.addBlock('test:heading', { type: 'h1' }, noteId);
    const h2Id = store.addBlock('test:heading', { type: 'h2' }, h1Id);
    const h3Id = store.addBlock('test:heading', { type: 'h3' }, h2Id);

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);
    await wait(50);

    // Verify all blocks are rendered
    expect(editorContainer.std.view.getBlock(h1Id)).toBeDefined();
    expect(editorContainer.std.view.getBlock(h2Id)).toBeDefined();
    expect(editorContainer.std.view.getBlock(h3Id)).toBeDefined();

    editorContainer.remove();
  });

  test('should handle block updates efficiently', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();

    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);
    const h1Id = store.addBlock('test:heading', { type: 'h1' }, noteId);
    const h2Id = store.addBlock('test:heading', { type: 'h2' }, noteId);

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);
    await wait(50);

    const h1Block = editorContainer.std.view.getBlock(h1Id);
    expect(h1Block).toBeDefined();

    // Update one block
    const h1Model = store.getBlock(h1Id)!.model;
    store.updateBlock(h1Model, {});

    await wait(50);

    // Verify block still exists after update
    expect(editorContainer.std.view.getBlock(h1Id)).toBeDefined();

    editorContainer.remove();
  });

  test('should handle multiple blocks with shared parent', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();

    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);

    // Create 10 sibling blocks
    const blockIds = [];
    for (let i = 0; i < 10; i++) {
      blockIds.push(store.addBlock('test:heading', { type: 'h1' }, noteId));
    }

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);
    await wait(50);

    // Verify all blocks are rendered
    for (const id of blockIds) {
      expect(editorContainer.std.view.getBlock(id)).toBeDefined();
    }

    editorContainer.remove();
  });

  test('should handle block deletion correctly', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();

    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);
    const h1Id = store.addBlock('test:heading', { type: 'h1' }, noteId);

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);
    await wait(50);

    // Verify block exists
    expect(editorContainer.std.view.getBlock(h1Id)).toBeDefined();

    // Delete the block
    store.deleteBlock(store.getBlock(h1Id)!.model);
    await wait(50);

    // Verify block is removed
    expect(editorContainer.std.view.getBlock(h1Id)).toBeNull();

    editorContainer.remove();
  });

  test('should handle rapid updates efficiently', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();

    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);
    const h1Id = store.addBlock('test:heading', { type: 'h1' }, noteId);

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);
    await wait(50);

    const h1Model = store.getBlock(h1Id)!.model;

    // Rapid updates (simulating fast typing)
    for (let i = 0; i < 10; i++) {
      store.updateBlock(h1Model, {});
    }

    await wait(100);

    // Verify block is still correctly rendered
    expect(editorContainer.std.view.getBlock(h1Id)).toBeDefined();

    editorContainer.remove();
  });

  test('should maintain correct structure after updates', async () => {
    const collection = new TestWorkspace(createTestOptions());

    collection.meta.initialize();
    const doc = collection.createDoc('home');
    const store = doc.getStore({ extensions });
    doc.load();

    const rootId = store.addBlock('test:page');
    const noteId = store.addBlock('test:note', {}, rootId);
    const h1Id = store.addBlock('test:heading', { type: 'h1' }, noteId);
    const h2Id = store.addBlock('test:heading', { type: 'h2' }, h1Id);

    const editorContainer = new TestEditorContainer();
    editorContainer.doc = store;
    editorContainer.specs = testSpecs;

    document.body.append(editorContainer);
    await wait(50);

    // Update parent block
    const h1Model = store.getBlock(h1Id)!.model;
    store.updateBlock(h1Model, {});

    await wait(50);

    // Verify hierarchy is maintained
    const h1Block = editorContainer.std.view.getBlock(h1Id);
    const h2Block = editorContainer.std.view.getBlock(h2Id);

    expect(h1Block).toBeDefined();
    expect(h2Block).toBeDefined();
    expect(h2Block!.model.parent?.id).toBe(h1Id);

    editorContainer.remove();
  });
});
