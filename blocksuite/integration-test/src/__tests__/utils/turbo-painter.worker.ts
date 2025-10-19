import { ImageLayoutPainterExtension } from '@blocksuite/yunke-block-image/turbo-painter';
import { ListLayoutPainterExtension } from '@blocksuite/yunke-block-list/turbo-painter';
import { NoteLayoutPainterExtension } from '@blocksuite/yunke-block-note/turbo-painter';
import { ParagraphLayoutPainterExtension } from '@blocksuite/yunke-block-paragraph/turbo-painter';
import { ViewportLayoutPainter } from '@blocksuite/yunke-gfx-turbo-renderer/painter';

new ViewportLayoutPainter([
  ParagraphLayoutPainterExtension,
  ListLayoutPainterExtension,
  NoteLayoutPainterExtension,
  ImageLayoutPainterExtension,
]);
