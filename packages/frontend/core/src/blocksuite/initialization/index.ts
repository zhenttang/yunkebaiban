import type { DocCreateOptions } from '@yunke/core/modules/doc/types';
import {
  NoteDisplayMode,
  type NoteProps,
  type ParagraphProps,
  type RootBlockProps,
} from '@blocksuite/yunke/model';
import type { SurfaceBlockProps } from '@blocksuite/yunke/std/gfx';
import { type Store, Text } from '@blocksuite/yunke/store';

export interface DocProps {
  page?: Partial<RootBlockProps>;
  surface?: Partial<SurfaceBlockProps>;
  note?: Partial<NoteProps>;
  paragraph?: Partial<ParagraphProps>;
  onStoreLoad?: (
    doc: Store,
    props: {
      noteId: string;
      paragraphId: string;
      surfaceId: string;
    }
  ) => void;
}

export function initDocFromProps(
  doc: Store,
  props?: DocProps,
  options: DocCreateOptions = {}
) {
  doc.load(() => {
    const pageBlockId = doc.addBlock(
      'yunke:page',
      props?.page || { title: new Text(options.title || '') }
    );
    const surfaceId = doc.addBlock(
      'yunke:surface' as never,
      props?.surface || {},
      pageBlockId
    );
    const noteBlockId = doc.addBlock(
      'yunke:note',
      {
        ...props?.note,
        displayMode: NoteDisplayMode.DocAndEdgeless,
      },
      pageBlockId
    );
    const paragraphBlockId = doc.addBlock(
      'yunke:paragraph',
      props?.paragraph || {},
      noteBlockId
    );
    props?.onStoreLoad?.(doc, {
      noteId: noteBlockId,
      paragraphId: paragraphBlockId,
      surfaceId,
    });
    doc.history.undoManager.clear();
  });
}
