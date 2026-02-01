/**
 * FilledPolygon 元素模型
 * 
 * 支持自由形状的内部填充，用于 ColorDrop 功能
 * 类似 Procreate 的填充效果
 */

import {
    Bound,
    getBoundFromPoints,
    getPointsFromBoundWithRotation,
    type IVec,
    pointInPolygon,
    PointLocation,
    polygonNearestPoint,
    type SerializedXYWH,
    transformPointsToNewBound,
} from '@blocksuite/global/gfx';
import type { BaseElementProps, PointTestOptions } from '@blocksuite/std/gfx';
import {
    convert,
    derive,
    field,
    GfxPrimitiveElementModel,
} from '@blocksuite/std/gfx';

import { type Color, DefaultTheme } from '../../themes/index';

export type FilledPolygonProps = BaseElementProps & {
    /**
     * 多边形顶点 [[x0,y0],[x1,y1],...]
     */
    points: number[][];
    /**
     * 填充颜色
     */
    fillColor: Color;
    /**
     * 边框颜色
     */
    strokeColor: Color;
    /**
     * 边框宽度
     */
    strokeWidth: number;
    /**
     * 透明度 0-1
     */
    opacity: number;
};

export class FilledPolygonElementModel extends GfxPrimitiveElementModel<FilledPolygonProps> {
    private _pathCache: string | null = null;
    private _cachedPointsLength: number = 0;

    /**
     * 生成 SVG Path 命令用于渲染
     */
    get pathCommands(): string {
        const currentLength = this.points?.length || 0;

        if (!this._pathCache || this._cachedPointsLength !== currentLength) {
            const points = this.points || [];
            if (points.length < 3) {
                this._pathCache = '';
            } else {
                // 生成闭合的 SVG Path
                let path = `M ${points[0][0]} ${points[0][1]}`;
                for (let i = 1; i < points.length; i++) {
                    path += ` L ${points[i][0]} ${points[i][1]}`;
                }
                path += ' Z'; // 闭合路径
                this._pathCache = path;
            }
            this._cachedPointsLength = currentLength;
        }

        return this._pathCache;
    }

    override get connectable() {
        return false;
    }

    override get type() {
        return 'filled-polygon';
    }

    override containsBound(bounds: Bound): boolean {
        const points = getPointsFromBoundWithRotation(this);
        return points.some(point => bounds.containsPoint(point));
    }

    override getLineIntersections(start: IVec, end: IVec) {
        // 简化实现：不处理线相交
        return null;
    }

    override getNearestPoint(point: IVec): IVec {
        const { x, y } = this;
        const absolutePoints = this.points.map(p => [p[0] + x, p[1] + y] as IVec);
        return polygonNearestPoint(absolutePoints, point) as IVec;
    }

    override getRelativePointLocation(position: IVec): PointLocation {
        const point = Bound.deserialize(this.xywh).getRelativePoint(position);
        return new PointLocation(point);
    }

    /**
     * 检测点是否在多边形内部
     */
    override includesPoint(
        px: number,
        py: number,
        options?: PointTestOptions
    ): boolean {
        const { x, y } = this;
        // 转换为相对坐标
        const relativeX = px - x;
        const relativeY = py - y;
        
        // 使用射线法检测点是否在多边形内部
        return pointInPolygon([relativeX, relativeY], this.points as [number, number][]);
    }

    @field()
    accessor fillColor: Color = DefaultTheme.shapeStrokeColor;

    @field()
    accessor strokeColor: Color = 'transparent';

    @field()
    accessor strokeWidth: number = 0;

    @field()
    accessor opacity: number = 1;

    @derive((points: IVec[], instance: FilledPolygonInstance) => {
        if (!points || points.length < 3) return {};
        const bound = getBoundFromPoints(points);
        return {
            xywh: bound.serialize(),
        };
    })
    @convert((points: IVec[], instance: FilledPolygonInstance) => {
        if (!points || points.length < 3) return [];
        const bound = getBoundFromPoints(points);
        // 转换为相对坐标
        return points.map(([x, y]) => [x - bound.x, y - bound.y]);
    })
    @field()
    accessor points: IVec[] = [];

    @field(0)
    accessor rotate: number = 0;

    @derive((xywh: SerializedXYWH, instance: FilledPolygonInstance) => {
        const bound = Bound.deserialize(xywh);
        if (bound.w === instance.w && bound.h === instance.h) return {};

        const transformed = transformPointsToNewBound(
            instance.points.map(([x, y]) => ({ x, y })),
            instance,
            0,
            bound,
            0
        );

        return {
            points: transformed.points.map(p => [p.x, p.y]),
        };
    })
    @field()
    accessor xywh: SerializedXYWH = '[0,0,0,0]';
}

type FilledPolygonInstance = GfxPrimitiveElementModel<FilledPolygonProps> & FilledPolygonProps;
