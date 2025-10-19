import { AttachmentStoreExtension } from '@blocksuite/yunke-block-attachment/store';
import { BookmarkStoreExtension } from '@blocksuite/yunke-block-bookmark/store';
import { CalloutStoreExtension } from '@blocksuite/yunke-block-callout/store';
import { CodeStoreExtension } from '@blocksuite/yunke-block-code/store';
import { DataViewStoreExtension } from '@blocksuite/yunke-block-data-view/store';
import { DatabaseStoreExtension } from '@blocksuite/yunke-block-database/store';
import { DividerStoreExtension } from '@blocksuite/yunke-block-divider/store';
import { DrawioStoreExtension } from '@blocksuite/yunke-block-drawio/store';
import { EdgelessTextStoreExtension } from '@blocksuite/yunke-block-edgeless-text/store';
import { EmbedStoreExtension } from '@blocksuite/yunke-block-embed/store';
import { EmbedDocStoreExtension } from '@blocksuite/yunke-block-embed-doc/store';
import { ExcalidrawStoreExtension } from '@blocksuite/yunke-block-excalidraw/store';
import { FrameStoreExtension } from '@blocksuite/yunke-block-frame/store';
import { ImageStoreExtension } from '@blocksuite/yunke-block-image/store';
import { LatexStoreExtension } from '@blocksuite/yunke-block-latex/store';
import { ListStoreExtension } from '@blocksuite/yunke-block-list/store';
import { MermaidStoreExtension } from '@blocksuite/yunke-block-mermaid/store';
import { NoteStoreExtension } from '@blocksuite/yunke-block-note/store';
import { ParagraphStoreExtension } from '@blocksuite/yunke-block-paragraph/store';
import { RootStoreExtension } from '@blocksuite/yunke-block-root/store';
import { SurfaceStoreExtension } from '@blocksuite/yunke-block-surface/store';
import { SurfaceRefStoreExtension } from '@blocksuite/yunke-block-surface-ref/store';
import { TableStoreExtension } from '@blocksuite/yunke-block-table/store';
import { FoundationStoreExtension } from '@blocksuite/yunke-foundation/store';
import { BrushStoreExtension } from '@blocksuite/yunke-gfx-brush/store';
import { ConnectorStoreExtension } from '@blocksuite/yunke-gfx-connector/store';
import { GroupStoreExtension } from '@blocksuite/yunke-gfx-group/store';
import { MindmapStoreExtension } from '@blocksuite/yunke-gfx-mindmap/store';
import { ShapeStoreExtension } from '@blocksuite/yunke-gfx-shape/store';
import { TextStoreExtension } from '@blocksuite/yunke-gfx-text/store';
import { FootnoteStoreExtension } from '@blocksuite/yunke-inline-footnote/store';
import { LatexStoreExtension as InlineLatexStoreExtension } from '@blocksuite/yunke-inline-latex/store';
import { LinkStoreExtension } from '@blocksuite/yunke-inline-link/store';
import { InlinePresetStoreExtension } from '@blocksuite/yunke-inline-preset/store';
import { ReferenceStoreExtension } from '@blocksuite/yunke-inline-reference/store';

export function getInternalStoreExtensions() {
  return [
    FoundationStoreExtension,

    AttachmentStoreExtension,
    BookmarkStoreExtension,
    CalloutStoreExtension,
    CodeStoreExtension,
    DataViewStoreExtension,
    DatabaseStoreExtension,
    DividerStoreExtension,
    DrawioStoreExtension,
    EdgelessTextStoreExtension,
    EmbedStoreExtension,
    EmbedDocStoreExtension,
    ExcalidrawStoreExtension,
    FrameStoreExtension,
    ImageStoreExtension,
    LatexStoreExtension,
    ListStoreExtension,
    MermaidStoreExtension,
    NoteStoreExtension,
    ParagraphStoreExtension,
    SurfaceRefStoreExtension,
    TableStoreExtension,
    SurfaceStoreExtension,
    RootStoreExtension,

    FootnoteStoreExtension,
    LinkStoreExtension,
    ReferenceStoreExtension,
    InlineLatexStoreExtension,
    InlinePresetStoreExtension,

    BrushStoreExtension,
    ShapeStoreExtension,
    MindmapStoreExtension,
    ConnectorStoreExtension,
    GroupStoreExtension,
    TextStoreExtension,
  ];
}
