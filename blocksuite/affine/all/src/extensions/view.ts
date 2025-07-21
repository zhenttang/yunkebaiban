import { AttachmentViewExtension } from '@blocksuite/affine-block-attachment/view';
import { BookmarkViewExtension } from '@blocksuite/affine-block-bookmark/view';
import { CalloutViewExtension } from '@blocksuite/affine-block-callout/view';
import { CodeBlockViewExtension } from '@blocksuite/affine-block-code/view';
import { DataViewViewExtension } from '@blocksuite/affine-block-data-view/view';
import { DatabaseViewExtension } from '@blocksuite/affine-block-database/view';
import { DividerViewExtension } from '@blocksuite/affine-block-divider/view';
import { EdgelessTextViewExtension } from '@blocksuite/affine-block-edgeless-text/view';
import { EmbedViewExtension } from '@blocksuite/affine-block-embed/view';
import { EmbedDocViewExtension } from '@blocksuite/affine-block-embed-doc/view';
import { FrameViewExtension } from '@blocksuite/affine-block-frame/view';
import { ImageViewExtension } from '@blocksuite/affine-block-image/view';
import { LatexViewExtension } from '@blocksuite/affine-block-latex/view';
import { ListViewExtension } from '@blocksuite/affine-block-list/view';
import { NoteViewExtension } from '@blocksuite/affine-block-note/view';
import { ParagraphViewExtension } from '@blocksuite/affine-block-paragraph/view';
import { RootViewExtension } from '@blocksuite/affine-block-root/view';
import { SurfaceViewExtension } from '@blocksuite/affine-block-surface/view';
import { SurfaceRefViewExtension } from '@blocksuite/affine-block-surface-ref/view';
import { TableViewExtension } from '@blocksuite/affine-block-table/view';
import { FoundationViewExtension } from '@blocksuite/affine-foundation/view';
import { AdapterPanelViewExtension } from '@blocksuite/affine-fragment-adapter-panel/view';
import { DocTitleViewExtension } from '@blocksuite/affine-fragment-doc-title/view';
import { FramePanelViewExtension } from '@blocksuite/affine-fragment-frame-panel/view';
import { OutlineViewExtension } from '@blocksuite/affine-fragment-outline/view';
import { BrushViewExtension } from '@blocksuite/affine-gfx-brush/view';
import { ConnectorViewExtension } from '@blocksuite/affine-gfx-connector/view';
import { GroupViewExtension } from '@blocksuite/affine-gfx-group/view';
import { LinkViewExtension as GfxLinkViewExtension } from '@blocksuite/affine-gfx-link/view';
import { MindmapViewExtension } from '@blocksuite/affine-gfx-mindmap/view';
import { NoteViewExtension as GfxNoteViewExtension } from '@blocksuite/affine-gfx-note/view';
import { PointerViewExtension } from '@blocksuite/affine-gfx-pointer/view';
import { ShapeViewExtension } from '@blocksuite/affine-gfx-shape/view';
import { TemplateViewExtension } from '@blocksuite/affine-gfx-template/view';
import { TextViewExtension } from '@blocksuite/affine-gfx-text/view';
import { FootnoteViewExtension } from '@blocksuite/affine-inline-footnote/view';
import { LatexViewExtension as InlineLatexViewExtension } from '@blocksuite/affine-inline-latex/view';
import { LinkViewExtension } from '@blocksuite/affine-inline-link/view';
import { MentionViewExtension } from '@blocksuite/affine-inline-mention/view';
import { InlinePresetViewExtension } from '@blocksuite/affine-inline-preset/view';
import { ReferenceViewExtension } from '@blocksuite/affine-inline-reference/view';
import { DragHandleViewExtension } from '@blocksuite/affine-widget-drag-handle/view';
import { EdgelessAutoConnectViewExtension } from '@blocksuite/affine-widget-edgeless-auto-connect/view';
import { EdgelessDraggingAreaViewExtension } from '@blocksuite/affine-widget-edgeless-dragging-area/view';
import { EdgelessSelectedRectViewExtension } from '@blocksuite/affine-widget-edgeless-selected-rect/view';
import { EdgelessToolbarViewExtension } from '@blocksuite/affine-widget-edgeless-toolbar/view';
import { EdgelessZoomToolbarViewExtension } from '@blocksuite/affine-widget-edgeless-zoom-toolbar/view';
import { FrameTitleViewExtension } from '@blocksuite/affine-widget-frame-title/view';
import { KeyboardToolbarViewExtension } from '@blocksuite/affine-widget-keyboard-toolbar/view';
import { LinkedDocViewExtension } from '@blocksuite/affine-widget-linked-doc/view';
import { NoteSlicerViewExtension } from '@blocksuite/affine-widget-note-slicer/view';
import { PageDraggingAreaViewExtension } from '@blocksuite/affine-widget-page-dragging-area/view';
import { RemoteSelectionViewExtension } from '@blocksuite/affine-widget-remote-selection/view';
import { ScrollAnchoringViewExtension } from '@blocksuite/affine-widget-scroll-anchoring/view';
import { SlashMenuViewExtension } from '@blocksuite/affine-widget-slash-menu/view';
import { ToolbarViewExtension } from '@blocksuite/affine-widget-toolbar/view';
import { ViewportOverlayViewExtension } from '@blocksuite/affine-widget-viewport-overlay/view';

export function getInternalViewExtensions() {
  return [
    FoundationViewExtension,

    // 图形编辑
    PointerViewExtension,
    GfxNoteViewExtension,
    BrushViewExtension,
    ShapeViewExtension,
    MindmapViewExtension,
    ConnectorViewExtension,
    GroupViewExtension,
    TextViewExtension,
    TemplateViewExtension,
    GfxLinkViewExtension,

    // 块组件
    AttachmentViewExtension,
    BookmarkViewExtension,
    CalloutViewExtension,
    CodeBlockViewExtension,
    DataViewViewExtension,
    DatabaseViewExtension,
    DividerViewExtension,
    EdgelessTextViewExtension,
    EmbedViewExtension,
    EmbedDocViewExtension,
    FrameViewExtension,
    ImageViewExtension,
    LatexViewExtension,
    ListViewExtension,
    NoteViewExtension,
    ParagraphViewExtension,
    SurfaceRefViewExtension,
    TableViewExtension,
    SurfaceViewExtension,
    RootViewExtension,

    // 内联组件
    FootnoteViewExtension,
    LinkViewExtension,
    ReferenceViewExtension,
    InlineLatexViewExtension,
    MentionViewExtension,
    InlinePresetViewExtension,

    // 小组件
    // 顺序会影响小组件的 z-index
    DragHandleViewExtension,
    EdgelessAutoConnectViewExtension,
    FrameTitleViewExtension,
    KeyboardToolbarViewExtension,
    LinkedDocViewExtension,
    RemoteSelectionViewExtension,
    ScrollAnchoringViewExtension,
    SlashMenuViewExtension,
    ToolbarViewExtension,
    ViewportOverlayViewExtension,
    EdgelessZoomToolbarViewExtension,
    PageDraggingAreaViewExtension,
    EdgelessSelectedRectViewExtension,
    EdgelessDraggingAreaViewExtension,
    NoteSlicerViewExtension,
    EdgelessToolbarViewExtension,

    // 片段
    DocTitleViewExtension,
    FramePanelViewExtension,
    OutlineViewExtension,
    AdapterPanelViewExtension,
  ];
}
