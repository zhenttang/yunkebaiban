import type { SerializedXYWH, XYWH } from '../xywh.js';
import { type IVec } from './vec.js';
export declare function getIBoundFromPoints(points: IVec[], rotation?: number): IBound & {
    maxX: number;
    maxY: number;
    minX: number;
    minY: number;
};
/**
 * Represents the x, y, width, and height of a block that can be easily accessed.
 */
export interface IBound {
    x: number;
    y: number;
    w: number;
    h: number;
    rotate?: number;
}
export declare class Bound implements IBound {
    h: number;
    w: number;
    x: number;
    y: number;
    get bl(): IVec;
    get br(): IVec;
    get center(): IVec;
    set center([cx, cy]: IVec);
    get horizontalLine(): IVec[];
    get leftLine(): IVec[];
    get lowerLine(): IVec[];
    get maxX(): number;
    get maxY(): number;
    get midPoints(): IVec[];
    get minX(): number;
    get minY(): number;
    get points(): IVec[];
    get rightLine(): IVec[];
    get tl(): IVec;
    get tr(): IVec;
    get upperLine(): IVec[];
    get verticalLine(): IVec[];
    constructor(x?: number, y?: number, w?: number, h?: number);
    static deserialize(s: string): Bound;
    static from(arg1: IBound): Bound;
    static fromCenter(center: IVec, width: number, height: number): Bound;
    static fromDOMRect({ left, top, width, height }: DOMRect): Bound;
    static fromPoints(points: IVec[]): Bound;
    static fromXYWH(xywh: XYWH): Bound;
    static serialize(bound: IBound): `[${number},${number},${number},${number}]`;
    clone(): Bound;
    contains(bound: Bound): boolean;
    containsPoint([x, y]: IVec): boolean;
    expand(margin: [number, number]): Bound;
    expand(left: number, top?: number, right?: number, bottom?: number): Bound;
    getRelativePoint([x, y]: IVec): IVec;
    getVerticesAndMidpoints(): IVec[];
    horizontalDistance(bound: Bound): number;
    include(point: IVec): Bound;
    intersectLine(sp: IVec, ep: IVec, infinite?: boolean): IVec[] | null;
    isHorizontalCross(bound: Bound): boolean;
    isIntersectWithBound(bound: Bound, epsilon?: number): boolean;
    isOverlapWithBound(bound: Bound, epsilon?: number): boolean;
    isPointInBound([x, y]: IVec, tolerance?: number): boolean;
    isPointNearBound([x, y]: IVec, tolerance?: number): boolean;
    isVerticalCross(bound: Bound): boolean;
    moveDelta(dx: number, dy: number): Bound;
    serialize(): SerializedXYWH;
    /**
     * Convert a point to relative coordinates.
     * @param point - The point to convert.
     * @returns The normalized relative coordinates of the point.
     */
    toRelative([x, y]: IVec): IVec;
    toXYWH(): XYWH;
    unite(bound: Bound): Bound;
    verticalDistance(bound: Bound): number;
}
//# sourceMappingURL=bound.d.ts.map