import { CodeLayoutPainterExtension } from '@blocksuite/yunke/blocks/code';
import { ImageLayoutPainterExtension } from '@blocksuite/yunke/blocks/image';
import { ListLayoutPainterExtension } from '@blocksuite/yunke/blocks/list';
import { NoteLayoutPainterExtension } from '@blocksuite/yunke/blocks/note';
import { ParagraphLayoutPainterExtension } from '@blocksuite/yunke/blocks/paragraph';
import { ViewportLayoutPainter } from '@blocksuite/yunke/gfx/turbo-renderer';

new ViewportLayoutPainter([
  ParagraphLayoutPainterExtension,
  ListLayoutPainterExtension,
  NoteLayoutPainterExtension,
  CodeLayoutPainterExtension,
  ImageLayoutPainterExtension,
]);
