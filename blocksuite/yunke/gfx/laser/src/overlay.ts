import { Overlay } from '@blocksuite/yunke-block-surface';
import type { GfxController } from '@blocksuite/std/gfx';

export class LaserOverlay extends Overlay {
    static override overlayName = 'yunke:laser-overlay';

    private _x = 0;
    private _y = 0;
    private _color: string;
    private _size: number;
    private _visible = true;
    private _trailPoints: Array<{ x: number; y: number; time: number }> = [];
    private _trailMaxAge = 500;

    constructor(
        private _gfx: GfxController,
        color: string = '#FF0000',
        size: number = 8
    ) {
        super();
        this._color = color;
        this._size = size;
    }

    setPosition(x: number, y: number) {
        this._x = x;
        this._y = y;
    }

    setTrail(points: Array<{ x: number; y: number; time: number }>, maxAge: number) {
        this._trailPoints = points;
        this._trailMaxAge = maxAge;
    }

    hide() {
        this._visible = false;
    }

    show() {
        this._visible = true;
    }

    setColor(color: string) {
        this._color = color;
    }

    setSize(size: number) {
        this._size = size;
    }

    dispose() {
        this._trailPoints = [];
    }

    override render(ctx: CanvasRenderingContext2D): void {
        if (!this._visible) return;

        const zoom = this._gfx.viewport.zoom;
        const now = Date.now();

        // 绘制轨迹
        if (this._trailPoints.length > 1) {
            ctx.save();
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 1; i < this._trailPoints.length; i++) {
                const prev = this._trailPoints[i - 1];
                const curr = this._trailPoints[i];
                const age = now - curr.time;
                const alpha = Math.max(0, 1 - age / this._trailMaxAge);

                if (alpha <= 0) continue;

                ctx.beginPath();
                ctx.strokeStyle = this._color;
                ctx.globalAlpha = alpha * 0.6;
                ctx.lineWidth = (this._size * 0.6) / zoom;
                ctx.moveTo(prev.x, prev.y);
                ctx.lineTo(curr.x, curr.y);
                ctx.stroke();
            }
            ctx.restore();
        }

        // 绘制激光点
        ctx.save();

        // 外层发光效果
        const glowSize = (this._size * 2) / zoom;
        const gradient = ctx.createRadialGradient(
            this._x, this._y, 0,
            this._x, this._y, glowSize
        );
        gradient.addColorStop(0, this._color);
        gradient.addColorStop(0.3, this._color + 'AA');
        gradient.addColorStop(0.6, this._color + '44');
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this._x, this._y, glowSize, 0, Math.PI * 2);
        ctx.fill();

        // 内层亮点
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this._x, this._y, this._size / zoom / 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
