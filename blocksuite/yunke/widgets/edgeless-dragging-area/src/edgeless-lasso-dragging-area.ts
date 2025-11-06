import {
  DefaultModeDragType,
  DefaultTool,
} from '@blocksuite/yunke-block-surface';
import type { RootBlockModel } from '@blocksuite/yunke-model';
import { WidgetComponent, WidgetViewExtension } from '@blocksuite/std';
import { GfxControllerIdentifier } from '@blocksuite/std/gfx';
import { cssVarV2 } from '@toeverything/theme/v2';
import { css, html, nothing, unsafeCSS } from 'lit';
import { literal, unsafeStatic } from 'lit/static-html.js';

export const EDGELESS_LASSO_DRAGGING_AREA_WIDGET =
  'edgeless-lasso-dragging-area';

export class EdgelessLassoDraggingAreaWidget extends WidgetComponent<RootBlockModel> {
  static override styles = css`
    .affine-edgeless-lasso-area {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
      overflow: visible;
    }

    .affine-edgeless-lasso-path {
      fill: #1E96EB14;
      stroke: #1E96EB;
      stroke-width: 2;
      stroke-dasharray: 5, 5;
      vector-effect: non-scaling-stroke;
    }
  `;

  private _animationFrameId: number | null = null;
  private _lastPathLength = 0;

  get gfx() {
    return this.std.get(GfxControllerIdentifier);
  }

  private _getPathString(points: [number, number][]): string {
    if (points.length < 1) return '';

    const viewportPoints = points.map(([x, y]) => {
      const [vx, vy] = this.gfx.viewport.toViewCoord(x, y);
      return [vx, vy];
    });

    if (viewportPoints.length === 1) {
      // Single point - draw a small circle
      const [x, y] = viewportPoints[0];
      return `M ${x - 2} ${y} A 2 2 0 1 1 ${x + 2} ${y} A 2 2 0 1 1 ${x - 2} ${y}`;
    }

    let pathString = `M ${viewportPoints[0][0]} ${viewportPoints[0][1]}`;
    for (let i = 1; i < viewportPoints.length; i++) {
      pathString += ` L ${viewportPoints[i][0]} ${viewportPoints[i][1]}`;
    }

    // Always close the path by connecting back to the start point
    if (viewportPoints.length > 2) {
      pathString += ' Z';
    }

    return pathString;
  }

  override render() {
    const tool = this.gfx.tool.currentTool$.value;

    if (
      !tool ||
      !(tool instanceof DefaultTool) ||
      tool.dragType !== DefaultModeDragType.LassoSelecting
    ) {
      return nothing;
    }

    // Access the lasso path from the tool
    const lassoPath = tool.lassoPath;

    if (!lassoPath || lassoPath.length < 1) {
      return nothing;
    }

    const pathString = this._getPathString(lassoPath);

    // Return empty if path string is invalid
    if (!pathString || pathString.trim() === '') {
      return nothing;
    }

    return html`
      <div class="affine-edgeless-lasso-area">
        <svg width="100%" height="100%" style="position: absolute; top: 0; left: 0;">
          <path class="affine-edgeless-lasso-path" d="${pathString}" />
        </svg>
      </div>
    `;
  }

  override firstUpdated() {
    // Subscribe to tool changes to trigger re-render when lasso path updates
    this.disposables.add(
      this.gfx.tool.currentToolName$.subscribe(() => {
        this._stopAnimationFrame();
        this.requestUpdate();
      })
    );

    // Also subscribe to dragging state changes to ensure updates during drag
    this.disposables.add(
      this.gfx.tool.dragging$.subscribe(isDragging => {
        if (isDragging) {
          this._startAnimationFrame();
        } else {
          this._stopAnimationFrame();
          this.requestUpdate();
        }
      })
    );

    // Subscribe to dragging area changes to update lasso path in real-time
    this.disposables.add(
      this.gfx.tool.draggingArea$.subscribe(() => {
        const tool = this.gfx.tool.currentTool$.value;
        if (
          tool instanceof DefaultTool &&
          tool.dragType === DefaultModeDragType.LassoSelecting
        ) {
          this.requestUpdate();
        }
      })
    );
  }

  private _startAnimationFrame() {
    if (this._animationFrameId !== null) return;

    const update = () => {
      const tool = this.gfx.tool.currentTool$.value;
      if (
        tool instanceof DefaultTool &&
        tool.dragType === DefaultModeDragType.LassoSelecting
      ) {
        const currentPathLength = tool.lassoPath?.length || 0;
        if (currentPathLength !== this._lastPathLength) {
          this._lastPathLength = currentPathLength;
          this.requestUpdate();
        }
        this._animationFrameId = requestAnimationFrame(update);
      } else {
        this._stopAnimationFrame();
      }
    };

    this._animationFrameId = requestAnimationFrame(update);
  }

  private _stopAnimationFrame() {
    if (this._animationFrameId !== null) {
      cancelAnimationFrame(this._animationFrameId);
      this._animationFrameId = null;
    }
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._stopAnimationFrame();
  }
}

export const edgelessLassoDraggingAreaWidget = WidgetViewExtension(
  'yunke:page',
  EDGELESS_LASSO_DRAGGING_AREA_WIDGET,
  literal`${unsafeStatic(EDGELESS_LASSO_DRAGGING_AREA_WIDGET)}`
);

