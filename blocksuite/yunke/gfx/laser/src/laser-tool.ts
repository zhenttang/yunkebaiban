import { type SurfaceBlockComponent } from '@blocksuite/yunke-block-surface';
import type { PointerEventState } from '@blocksuite/std';
import { BaseTool } from '@blocksuite/std/gfx';

import { LaserOverlay } from './overlay';

export type LaserToolOption = {
    color: string;
    size: number;
};

export class LaserTool extends BaseTool<LaserToolOption> {
    static override toolName = 'yunke:laser';

    private _laserOverlay: LaserOverlay | null = null;
    private _animationFrame: number | null = null;
    private _trailPoints: Array<{ x: number; y: number; time: number }> = [];
    private readonly _trailMaxAge = 500; // 轨迹保留时间（毫秒）

    private get _surfaceComponent() {
        return this.gfx.surfaceComponent as SurfaceBlockComponent | null;
    }

    override activate() {
        const color = this.activatedOption?.color ?? '#FF0000';
        const size = this.activatedOption?.size ?? 8;
        this._laserOverlay = new LaserOverlay(this.gfx, color, size);
        this._surfaceComponent?.renderer.addOverlay(this._laserOverlay);
        this._startAnimation();
    }

    override deactivate() {
        this._stopAnimation();
        if (this._laserOverlay) {
            this._surfaceComponent?.renderer.removeOverlay(this._laserOverlay);
            this._laserOverlay.dispose();
            this._laserOverlay = null;
        }
        this._trailPoints = [];
    }

    private _startAnimation() {
        const animate = () => {
            const now = Date.now();
            // 清除过期的轨迹点
            this._trailPoints = this._trailPoints.filter(
                p => now - p.time < this._trailMaxAge
            );

            if (this._laserOverlay) {
                this._laserOverlay.setTrail(this._trailPoints, this._trailMaxAge);
                this._surfaceComponent?.refresh();
            }

            this._animationFrame = requestAnimationFrame(animate);
        };
        this._animationFrame = requestAnimationFrame(animate);
    }

    private _stopAnimation() {
        if (this._animationFrame !== null) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
        }
    }

    override pointerMove(e: PointerEventState) {
        if (!this._laserOverlay) return;

        const [x, y] = this.gfx.viewport.toModelCoord(e.x, e.y);
        this._laserOverlay.setPosition(x, y);

        // 添加轨迹点
        this._trailPoints.push({ x, y, time: Date.now() });
    }

    override pointerOut() {
        if (this._laserOverlay) {
            this._laserOverlay.hide();
            this._surfaceComponent?.refresh();
        }
    }

    override pointerEnter(e: PointerEventState) {
        if (this._laserOverlay) {
            const [x, y] = this.gfx.viewport.toModelCoord(e.x, e.y);
            this._laserOverlay.setPosition(x, y);
            this._laserOverlay.show();
            this._surfaceComponent?.refresh();
        }
    }
}
