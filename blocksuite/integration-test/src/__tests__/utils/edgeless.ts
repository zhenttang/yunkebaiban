import type {
  EdgelessRootBlockComponent,
  PageRootBlockComponent,
} from '@blocksuite/yunke/blocks/root';
import type { SurfaceBlockComponent } from '@blocksuite/yunke/blocks/surface';
import type { Store } from '@blocksuite/store';

import type { TestYunkeEditorContainer } from '../../index.js';

export function getSurface(doc: Store, editor: TestYunkeEditorContainer) {
  const surfaceModel = doc.getModelsByFlavour('yunke:surface');

  return editor.host!.view.getBlock(
    surfaceModel[0]!.id
  ) as SurfaceBlockComponent;
}

export function getDocRootBlock(
  doc: Store,
  editor: TestYunkeEditorContainer,
  mode: 'page'
): PageRootBlockComponent;
export function getDocRootBlock(
  doc: Store,
  editor: TestYunkeEditorContainer,
  mode: 'edgeless'
): EdgelessRootBlockComponent;
export function getDocRootBlock(
  doc: Store,
  editor: TestYunkeEditorContainer,
  _?: 'edgeless' | 'page'
) {
  return editor.host!.view.getBlock(doc.root!.id) as
    | EdgelessRootBlockComponent
    | PageRootBlockComponent;
}

export function addNote(doc: Store, props: Record<string, any> = {}) {
  const noteId = doc.addBlock(
    'yunke:note',
    {
      xywh: '[0, 0, 800, 100]',
      ...props,
    },
    doc.root
  );

  doc.addBlock('yunke:paragraph', {}, noteId);

  return noteId;
}
