import {
  DefaultTool,
  OverlayIdentifier,
} from '@blocksuite/yunke-block-surface';
import type { FrameBlockModel } from '@blocksuite/yunke-model';
import {
  EditPropsStore,
  TelemetryProvider,
} from '@blocksuite/yunke-shared/services';
import type { IPoint, IVec } from '@blocksuite/global/gfx';
import { Bound, Vec } from '@blocksuite/global/gfx';
import type { PointerEventState } from '@blocksuite/std';
import { BaseTool, getTopElements } from '@blocksuite/std/gfx';
import { Text } from '@blocksuite/store';
import * as Y from 'yjs';

import {
  EdgelessFrameManagerIdentifier,
  type FrameOverlay,
} from './frame-manager';

export class FrameTool extends BaseTool {
  static override toolName = 'frame';

  private _frame: FrameBlockModel | null = null;
  
  // 保存已创建的 frame id，防止重复创建
  private _createdFrameId: string | null = null;

  private _startPoint: IVec | null = null;

  get frameManager() {
    return this.std.get(EdgelessFrameManagerIdentifier);
  }

  get frameOverlay() {
    return this.std.get(OverlayIdentifier('frame')) as FrameOverlay;
  }

  private _toModelCoord(p: IPoint): IVec {
    return this.gfx.viewport.toModelCoord(p.x, p.y);
  }

  override dragEnd(): void {
    if (this._frame) {
      const frame = this._frame;
      frame.pop('xywh');
      this.gfx.tool.setTool(DefaultTool);
      this.gfx.selection.set({
        elements: [frame.id],
        editing: false,
      });

      this.frameManager.addElementsToFrame(
        frame,
        getTopElements(this.frameManager.getElementsInFrameBound(frame))
      );
    }

    this._frame = null;
    this._createdFrameId = null;
    this._startPoint = null;
    this.frameOverlay.clear();
  }

  override dragMove(e: PointerEventState): void {
    if (!this._startPoint) return;

    const currentPoint = this._toModelCoord(e.point);
    if (Vec.dist(this._startPoint, currentPoint) < 8 && !this._frame && !this._createdFrameId) return;

    // 如果已经创建了 frame 但还没获取到引用，尝试再次获取
    if (!this._frame && this._createdFrameId) {
      const frame = this.gfx.getElementById(this._createdFrameId) as FrameBlockModel | null;
      if (frame) {
        this._frame = frame;
        try {
          this._frame.stash('xywh');
        } catch {
          // stash 可能已经调用过了
        }
      }
    }

    if (!this._frame && !this._createdFrameId) {
      const frames = this.gfx.layer.blocks.filter(
        block => block.flavour === 'yunke:frame'
      ) as FrameBlockModel[];

      const props = this.std
        .get(EditPropsStore)
        .applyLastProps('yunke:frame', {
          title: new Text(new Y.Text(`Frame ${frames.length + 1}`)),
          xywh: Bound.fromPoints([this._startPoint, currentPoint]).serialize(),
          index: this.gfx.layer.generateIndex(true),
          presentationIndex: this.frameManager.generatePresentationIndex(),
        });

      const id = this.doc.addBlock('yunke:frame', props, this.gfx.surface);
      this._createdFrameId = id; // 保存 id，防止重复创建

      this.std.getOptional(TelemetryProvider)?.track('CanvasElementAdded', {
        control: 'canvas:draw',
        page: 'whiteboard editor',
        module: 'toolbar',
        segment: 'toolbar',
        type: 'frame',
      });
      
      const frame = this.gfx.getElementById(id) as FrameBlockModel | null;
      if (frame) {
        this._frame = frame;
        this._frame.stash('xywh');
      }
      return;
    }

    if (this._frame) {
      this.gfx.doc.updateBlock(this._frame, {
        xywh: Bound.fromPoints([this._startPoint, currentPoint]).serialize(),
      });

      this.frameOverlay.highlight(this._frame, true);
    }
  }

  override dragStart(e: PointerEventState): void {
    this.doc.captureSync();
    const { point } = e;
    this._startPoint = this._toModelCoord(point);
  }
}
