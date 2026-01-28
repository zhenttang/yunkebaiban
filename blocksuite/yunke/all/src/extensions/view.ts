import { AttachmentViewExtension } from '@blocksuite/yunke-block-attachment/view';
import { BookmarkViewExtension } from '@blocksuite/yunke-block-bookmark/view';
import { CalloutViewExtension } from '@blocksuite/yunke-block-callout/view';
import { CodeBlockViewExtension } from '@blocksuite/yunke-block-code/view';
import { DataViewViewExtension } from '@blocksuite/yunke-block-data-view/view';
import { DatabaseViewExtension } from '@blocksuite/yunke-block-database/view';
import { DividerViewExtension } from '@blocksuite/yunke-block-divider/view';
import { EdgelessTextViewExtension } from '@blocksuite/yunke-block-edgeless-text/view';
import { EmbedViewExtension } from '@blocksuite/yunke-block-embed/view';
import { EmbedDocViewExtension } from '@blocksuite/yunke-block-embed-doc/view';
import { FrameViewExtension } from '@blocksuite/yunke-block-frame/view';
import { ImageViewExtension } from '@blocksuite/yunke-block-image/view';
import { LatexViewExtension } from '@blocksuite/yunke-block-latex/view';
import { ListViewExtension } from '@blocksuite/yunke-block-list/view';
import { NoteViewExtension } from '@blocksuite/yunke-block-note/view';
import { ParagraphViewExtension } from '@blocksuite/yunke-block-paragraph/view';
import { RootViewExtension } from '@blocksuite/yunke-block-root/view';
import { SurfaceViewExtension } from '@blocksuite/yunke-block-surface/view';
import { SurfaceRefViewExtension } from '@blocksuite/yunke-block-surface-ref/view';
import { TableViewExtension } from '@blocksuite/yunke-block-table/view';
import { MermaidViewExtension } from '@blocksuite/yunke-block-mermaid/view';
import { DrawioViewExtension } from '@blocksuite/yunke-block-drawio/view';
import { ExcalidrawViewExtension } from '@blocksuite/yunke-block-excalidraw/view';
import { FlowchartViewExtension } from '@blocksuite/yunke-block-flowchart/view';
import { FoundationViewExtension } from '@blocksuite/yunke-foundation/view';
import { AdapterPanelViewExtension } from '@blocksuite/yunke-fragment-adapter-panel/view';
import { DocTitleViewExtension } from '@blocksuite/yunke-fragment-doc-title/view';
import { FramePanelViewExtension } from '@blocksuite/yunke-fragment-frame-panel/view';
import { OutlineViewExtension } from '@blocksuite/yunke-fragment-outline/view';
import { BrushViewExtension } from '@blocksuite/yunke-gfx-brush/view';
import { ConnectorViewExtension } from '@blocksuite/yunke-gfx-connector/view';
import { GroupViewExtension } from '@blocksuite/yunke-gfx-group/view';
import { LinkViewExtension as GfxLinkViewExtension } from '@blocksuite/yunke-gfx-link/view';
import { MindmapViewExtension } from '@blocksuite/yunke-gfx-mindmap/view';
import { MoreToolsViewExtension } from '@blocksuite/yunke-gfx-more-tools/view';
import { NoteViewExtension as GfxNoteViewExtension } from '@blocksuite/yunke-gfx-note/view';
import { PointerViewExtension } from '@blocksuite/yunke-gfx-pointer/view';
import { ShapeViewExtension } from '@blocksuite/yunke-gfx-shape/view';
import { TemplateViewExtension } from '@blocksuite/yunke-gfx-template/view';
import { TextViewExtension } from '@blocksuite/yunke-gfx-text/view';
import { FootnoteViewExtension } from '@blocksuite/yunke-inline-footnote/view';
import { LatexViewExtension as InlineLatexViewExtension } from '@blocksuite/yunke-inline-latex/view';
import { LinkViewExtension } from '@blocksuite/yunke-inline-link/view';
import { MentionViewExtension } from '@blocksuite/yunke-inline-mention/view';
import { InlinePresetViewExtension } from '@blocksuite/yunke-inline-preset/view';
import { ReferenceViewExtension } from '@blocksuite/yunke-inline-reference/view';
import { DragHandleViewExtension } from '@blocksuite/yunke-widget-drag-handle/view';
import { EdgelessAutoConnectViewExtension } from '@blocksuite/yunke-widget-edgeless-auto-connect/view';
import { EdgelessDraggingAreaViewExtension } from '@blocksuite/yunke-widget-edgeless-dragging-area/view';
import { EdgelessSelectedRectViewExtension } from '@blocksuite/yunke-widget-edgeless-selected-rect/view';
import { EdgelessToolbarViewExtension } from '@blocksuite/yunke-widget-edgeless-toolbar/view';
import { EdgelessZoomToolbarViewExtension } from '@blocksuite/yunke-widget-edgeless-zoom-toolbar/view';
import { FrameTitleViewExtension } from '@blocksuite/yunke-widget-frame-title/view';
import { KeyboardToolbarViewExtension } from '@blocksuite/yunke-widget-keyboard-toolbar/view';
import { LinkedDocViewExtension } from '@blocksuite/yunke-widget-linked-doc/view';
import { NoteSlicerViewExtension } from '@blocksuite/yunke-widget-note-slicer/view';
import { PageDraggingAreaViewExtension } from '@blocksuite/yunke-widget-page-dragging-area/view';
import { RemoteSelectionViewExtension } from '@blocksuite/yunke-widget-remote-selection/view';
import { ScrollAnchoringViewExtension } from '@blocksuite/yunke-widget-scroll-anchoring/view';
import { SlashMenuViewExtension } from '@blocksuite/yunke-widget-slash-menu/view';
import { ToolbarViewExtension } from '@blocksuite/yunke-widget-toolbar/view';
import { ViewportOverlayViewExtension } from '@blocksuite/yunke-widget-viewport-overlay/view';

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

    // 演示与协作工具（合并到"更多工具"按钮）
    MoreToolsViewExtension,

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
    MermaidViewExtension,
    DrawioViewExtension,
    ExcalidrawViewExtension,
    FlowchartViewExtension,
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
