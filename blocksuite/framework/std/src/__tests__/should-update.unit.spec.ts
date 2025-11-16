import {
  createAutoIncrementIdGenerator,
  TestWorkspace,
} from '@blocksuite/store/test';
import { html, type TemplateResult } from 'lit';
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

describe('shouldUpdate optimization', () => {
  test('should skip update when widgets are deeply equal', async () => {
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

    const headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock).toBeDefined();

    // Spy on the render method to track update calls
    const renderSpy = vi.spyOn(headingBlock!, 'render');
    const initialCallCount = renderSpy.mock.calls.length;

    // Trigger update with same widgets (should be skipped)
    const currentWidgets = headingBlock!.widgets;
    headingBlock!.widgets = currentWidgets; // Same reference
    await wait(50);

    // Should not trigger additional render
    expect(renderSpy.mock.calls.length).toBe(initialCallCount);

    editorContainer.remove();
  });

  test('should update when widgets are truly different', async () => {
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

    const headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock).toBeDefined();

    // Create different widgets object with different content
    const newWidgets = {
      ...headingBlock!.widgets,
      newWidget: html`<div>New Widget</div>`,
    };

    headingBlock!.widgets = newWidgets;
    await wait(50);

    // Should have updated
    expect(headingBlock!.widgets).toBe(newWidgets);

    editorContainer.remove();
  });

  test('should handle empty widgets correctly', async () => {
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

    const headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock).toBeDefined();

    // Set to empty widgets
    headingBlock!.widgets = {};
    await wait(50);

    // Should handle gracefully
    expect(headingBlock!.widgets).toEqual({});

    editorContainer.remove();
  });

  test('should detect widgets with different keys', async () => {
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

    const headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock).toBeDefined();

    const widget1: TemplateResult = html`<div>Widget 1</div>`;
    const widget2: TemplateResult = html`<div>Widget 2</div>`;

    // First set
    headingBlock!.widgets = { key1: widget1 };
    await wait(50);

    // Different keys
    headingBlock!.widgets = { key2: widget2 };
    await wait(50);

    // Should have updated with different keys
    expect(Object.keys(headingBlock!.widgets)).toContain('key2');

    editorContainer.remove();
  });

  test('should detect widgets with different template content', async () => {
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

    const headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock).toBeDefined();

    // Same key but different template content
    const widget1: TemplateResult = html`<div>Content A</div>`;
    const widget2: TemplateResult = html`<div>Content B</div>`;

    headingBlock!.widgets = { widget: widget1 };
    await wait(50);

    headingBlock!.widgets = { widget: widget2 };
    await wait(50);

    // Should detect different content
    expect(headingBlock!.widgets.widget).toBe(widget2);

    editorContainer.remove();
  });

  test('should allow update when other properties change', async () => {
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

    const headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock).toBeDefined();

    // Change viewType (not widgets)
    headingBlock!.viewType = 'bypass';
    await wait(50);

    // Should have updated
    expect(headingBlock!.viewType).toBe('bypass');

    editorContainer.remove();
  });

  test('should handle rapid successive widget changes efficiently', async () => {
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

    const headingBlock = editorContainer.std.view.getBlock(headingId);
    expect(headingBlock).toBeDefined();

    const renderSpy = vi.spyOn(headingBlock!, 'render');
    const initialCallCount = renderSpy.mock.calls.length;

    // Rapid changes with same widgets (should be optimized)
    const sameWidgets = headingBlock!.widgets;
    for (let i = 0; i < 10; i++) {
      headingBlock!.widgets = sameWidgets;
    }
    await wait(100);

    // Should not trigger many renders
    const finalCallCount = renderSpy.mock.calls.length;
    expect(finalCallCount - initialCallCount).toBeLessThan(5);

    editorContainer.remove();
  });
});
