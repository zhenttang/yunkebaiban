import {
  autoArrangeElementsCommand,
  autoResizeElementsCommand,
  EdgelessCRUDIdentifier,
  updateXYWH,
} from '@blocksuite/yunke-block-surface';
import { EditorChevronDown } from '@blocksuite/yunke-components/toolbar';
import type { ToolbarContext } from '@blocksuite/yunke-shared/services';
import type {
  Menu,
  MenuItem,
} from '@blocksuite/yunke-widget-edgeless-toolbar';
import { renderMenuItems } from '@blocksuite/yunke-widget-edgeless-toolbar';
import { Bound } from '@blocksuite/global/gfx';
import {
  AlignBottomIcon,
  AlignHorizontalCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  AlignTopIcon,
  AlignVerticalCenterIcon,
  AutoTidyUpIcon,
  DistributeHorizontalIcon,
  DistributeVerticalIcon,
  ResizeTidyUpIcon,
} from '@blocksuite/icons/lit';
import type { GfxModel } from '@blocksuite/std/gfx';
import { html } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';

enum Alignment {
  None,
  AutoArrange,
  AutoResize,
  Bottom,
  DistributeHorizontally,
  DistributeVertically,
  Horizontally,
  Left,
  Right,
  Top,
  Vertically,
}

type AlignmentMap = Record<
  Alignment,
  (ctx: ToolbarContext, elements: GfxModel[]) => void
>;

const HORIZONTAL_ALIGNMENT = [
  {
    key: '左对齐',
    value: Alignment.Left,
    icon: AlignLeftIcon(),
  },
  {
    key: '水平居中对齐',
    value: Alignment.Horizontally,
    icon: AlignHorizontalCenterIcon(),
  },
  {
    key: '右对齐',
    value: Alignment.Right,
    icon: AlignRightIcon(),
  },
  {
    key: '水平分布',
    value: Alignment.DistributeHorizontally,
    icon: DistributeHorizontalIcon(),
  },
] as const satisfies MenuItem<Alignment>[];

const VERTICAL_ALIGNMENT = [
  {
    key: '顶部对齐',
    value: Alignment.Top,
    icon: AlignTopIcon(),
  },
  {
    key: '垂直居中对齐',
    value: Alignment.Vertically,
    icon: AlignVerticalCenterIcon(),
  },
  {
    key: '底部对齐',
    value: Alignment.Bottom,
    icon: AlignBottomIcon(),
  },
  {
    key: '垂直分布',
    value: Alignment.DistributeVertically,
    icon: DistributeVerticalIcon(),
  },
] as const satisfies MenuItem<Alignment>[];

const AUTO_ALIGNMENT = [
  {
    key: '自动排列',
    value: Alignment.AutoArrange,
    icon: AutoTidyUpIcon(),
  },
  {
    key: '调整大小并对齐',
    value: Alignment.AutoResize,
    icon: ResizeTidyUpIcon(),
  },
] as const satisfies MenuItem<Alignment>[];

const alignment = {
  // None: do nothing
  [Alignment.None]() {},

  // Horizontal
  [Alignment.Left](ctx: ToolbarContext, elements: GfxModel[]) {
    const bounds = elements.map(a => a.elementBound);
    const left = Math.min(...bounds.map(b => b.minX));

    for (const [index, element] of elements.entries()) {
      const elementBound = bounds[index];
      const bound = Bound.deserialize(element.xywh);
      const offset = bound.minX - elementBound.minX;
      bound.x = left + offset;

      updateXYWHWith(ctx, element, bound);
    }
  },

  [Alignment.Horizontally](ctx: ToolbarContext, elements: GfxModel[]) {
    const bounds = elements.map(a => a.elementBound);
    const left = Math.min(...bounds.map(b => b.minX));
    const right = Math.max(...bounds.map(b => b.maxX));
    const centerX = (left + right) / 2;

    for (const element of elements) {
      const bound = Bound.deserialize(element.xywh);
      bound.x = centerX - bound.w / 2;

      updateXYWHWith(ctx, element, bound);
    }
  },

  [Alignment.Right](ctx: ToolbarContext, elements: GfxModel[]) {
    const bounds = elements.map(a => a.elementBound);
    const right = Math.max(...bounds.map(b => b.maxX));

    for (const [i, element] of elements.entries()) {
      const elementBound = bounds[i];
      const bound = Bound.deserialize(element.xywh);
      const offset = bound.maxX - elementBound.maxX;
      bound.x = right - bound.w + offset;

      updateXYWHWith(ctx, element, bound);
    }
  },

  [Alignment.DistributeHorizontally](
    ctx: ToolbarContext,
    elements: GfxModel[]
  ) {
    elements.sort((a, b) => a.elementBound.minX - b.elementBound.minX);
    const bounds = elements.map(a => a.elementBound);
    const left = bounds[0].minX;
    const right = bounds[bounds.length - 1].maxX;

    const totalWidth = right - left;
    const totalGap =
      totalWidth - elements.reduce((prev, ele) => prev + ele.elementBound.w, 0);
    const gap = totalGap / (elements.length - 1);
    let next = bounds[0].maxX + gap;

    for (let i = 1; i < elements.length - 1; i++) {
      const bound = Bound.deserialize(elements[i].xywh);
      bound.x = next + bounds[i].w / 2 - bound.w / 2;
      next += gap + bounds[i].w;

      updateXYWHWith(ctx, elements[i], bound);
    }
  },

  // Vertical
  [Alignment.Top](ctx: ToolbarContext, elements: GfxModel[]) {
    const bounds = elements.map(a => a.elementBound);
    const top = Math.min(...bounds.map(b => b.minY));

    for (const [i, element] of elements.entries()) {
      const elementBound = bounds[i];
      const bound = Bound.deserialize(element.xywh);
      const offset = bound.minY - elementBound.minY;
      bound.y = top + offset;

      updateXYWHWith(ctx, element, bound);
    }
  },

  [Alignment.Vertically](ctx: ToolbarContext, elements: GfxModel[]) {
    const bounds = elements.map(a => a.elementBound);
    const top = Math.min(...bounds.map(b => b.minY));
    const bottom = Math.max(...bounds.map(b => b.maxY));
    const centerY = (top + bottom) / 2;

    for (const element of elements) {
      const bound = Bound.deserialize(element.xywh);
      bound.y = centerY - bound.h / 2;

      updateXYWHWith(ctx, element, bound);
    }
  },

  [Alignment.Bottom](ctx: ToolbarContext, elements: GfxModel[]) {
    const bounds = elements.map(a => a.elementBound);
    const bottom = Math.max(...bounds.map(b => b.maxY));

    for (const [i, element] of elements.entries()) {
      const elementBound = bounds[i];
      const bound = Bound.deserialize(element.xywh);
      const offset = bound.maxY - elementBound.maxY;
      bound.y = bottom - bound.h + offset;

      updateXYWHWith(ctx, element, bound);
    }
  },

  [Alignment.DistributeVertically](ctx: ToolbarContext, elements: GfxModel[]) {
    elements.sort((a, b) => a.elementBound.minY - b.elementBound.minY);
    const bounds = elements.map(a => a.elementBound);
    const top = bounds[0].minY;
    const bottom = bounds[bounds.length - 1].maxY;

    const totalHeight = bottom - top;
    const totalGap =
      totalHeight -
      elements.reduce((prev, ele) => prev + ele.elementBound.h, 0);
    const gap = totalGap / (elements.length - 1);
    let next = bounds[0].maxY + gap;
    for (let i = 1; i < elements.length - 1; i++) {
      const bound = Bound.deserialize(elements[i].xywh);
      bound.y = next + bounds[i].h / 2 - bound.h / 2;
      next += gap + bounds[i].h;

      updateXYWHWith(ctx, elements[i], bound);
    }
  },

  // Auto
  [Alignment.AutoArrange](ctx: ToolbarContext) {
    ctx.command.exec(autoArrangeElementsCommand);
  },

  [Alignment.AutoResize](ctx: ToolbarContext) {
    ctx.command.exec(autoResizeElementsCommand);
  },
} as const satisfies AlignmentMap;

const updateXYWHWith = (ctx: ToolbarContext, model: GfxModel, bound: Bound) => {
  updateXYWH(
    model,
    bound,
    ctx.std.get(EdgelessCRUDIdentifier).updateElement,
    ctx.store.updateBlock
  );
};

export function renderAlignmentMenu(
  ctx: ToolbarContext,
  models: GfxModel[],
  { label, tooltip, icon }: Pick<Menu<Alignment>, 'label' | 'tooltip' | 'icon'>,
  onPick = (type: Alignment) => alignment[type](ctx, models)
) {
  return html`
    <editor-menu-button
      aria-label="alignment-menu"
      .contentPadding="${'8px'}"
      .button=${html`
        <editor-icon-button
          aria-label="${label}"
          .tooltip="${tooltip ?? label}"
        >
          ${icon} ${EditorChevronDown}
        </editor-icon-button>
      `}
    >
      <div data-orientation="vertical">
        <div style=${styleMap({ display: 'grid', gridGap: '8px', gridTemplateColumns: 'repeat(4, 1fr)' })}>
          ${renderMenuItems(HORIZONTAL_ALIGNMENT, Alignment.None, onPick)}
          ${renderMenuItems(VERTICAL_ALIGNMENT, Alignment.None, onPick)}
        </div>
        <editor-toolbar-separator data-orientation="horizontal"></editor-toolbar-separator>
        <div style=${styleMap({ display: 'grid', gridGap: '8px', gridTemplateColumns: 'repeat(4, 1fr)' })}>
          ${renderMenuItems(AUTO_ALIGNMENT, Alignment.None, onPick)}
        </div>
    </editor-menu-button>
  `;
}
