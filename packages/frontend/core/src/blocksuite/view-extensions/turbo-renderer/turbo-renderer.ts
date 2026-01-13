import { getWorkerUrl } from '@yunke/env/worker';
import { CodeLayoutHandlerExtension } from '@blocksuite/yunke/blocks/code';
import { ImageLayoutHandlerExtension } from '@blocksuite/yunke/blocks/image';
import { ListLayoutHandlerExtension } from '@blocksuite/yunke/blocks/list';
import { NoteLayoutHandlerExtension } from '@blocksuite/yunke/blocks/note';
import { ParagraphLayoutHandlerExtension } from '@blocksuite/yunke/blocks/paragraph';
import {
  TurboRendererConfigFactory,
  ViewportTurboRendererExtension,
} from '@blocksuite/yunke/gfx/turbo-renderer';

function createPainterWorker() {
  const worker = new Worker(getWorkerUrl('turbo-painter'));
  return worker;
}

export const turboRendererExtension = [
  ParagraphLayoutHandlerExtension,
  ListLayoutHandlerExtension,
  NoteLayoutHandlerExtension,
  CodeLayoutHandlerExtension,
  ImageLayoutHandlerExtension,
  TurboRendererConfigFactory({
    options: {
      zoomThreshold: 1,
      debounceTime: 1000,
    },
    painterWorkerEntry: createPainterWorker,
  }),
  ViewportTurboRendererExtension,
];
