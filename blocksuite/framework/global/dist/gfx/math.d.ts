import type { Bound, IBound } from './model/bound.js';
import { PointLocation } from './model/point-location.js';
import { type IVec } from './model/vec.js';
export declare const EPSILON = 1e-12;
export declare const MACHINE_EPSILON = 1.12e-16;
export declare const PI2: number;
export declare const CURVETIME_EPSILON = 1e-8;
export declare function randomSeed(): number;
/**
 * Calculates the intersection point of two line segments.
 *
 * @param sp - Start point of the first line segment [x, y]
 * @param ep - End point of the first line segment [x, y]
 * @param sp2 - Start point of the second line segment [x, y]
 * @param ep2 - End point of the second line segment [x, y]
 * @param infinite - If true, treats the lines as infinite lines rather than line segments
 * @returns The intersection point [x, y] if the lines intersect, null if they are parallel or coincident
 *
 * @example
 * const intersection = lineIntersects([0, 0], [2, 2], [0, 2], [2, 0]);
 * // Returns [1, 1] - the intersection point of the two line segments
 *
 * @example
 * const parallel = lineIntersects([0, 0], [2, 2], [0, 1], [2, 3], true);
 * // Returns null - the lines are parallel
 */
export declare function lineIntersects(sp: IVec, ep: IVec, sp2: IVec, ep2: IVec, infinite?: boolean): IVec | null;
/**
 * Finds the nearest point on a polygon to a given point.
 *
 * @param points - Array of points defining the polygon vertices [x, y][]
 * @param point - The point to find the nearest point to [x, y]
 * @returns The nearest point on the polygon to the given point
 * @throws Error if points array is empty or has less than 2 points
 */
export declare function polygonNearestPoint(points: IVec[], point: IVec): IVec;
export declare function polygonPointDistance(points: IVec[], point: IVec): number;
export declare function rotatePoints<T extends IVec>(points: T[], center: IVec, rotate: number): T[];
export declare function rotatePoint(point: [number, number], center: IVec, rotate: number): [number, number];
export declare function toRadian(angle: number): number;
export declare function isPointOnLineSegment(point: IVec, line: IVec[]): boolean;
export declare function polygonGetPointTangent(points: IVec[], point: IVec): IVec;
export declare function linePolygonIntersects(sp: IVec, ep: IVec, points: IVec[]): PointLocation[] | null;
export declare function linePolylineIntersects(sp: IVec, ep: IVec, points: IVec[]): PointLocation[] | null;
export declare function polyLineNearestPoint(points: IVec[], point: IVec): IVec;
export declare function isPointOnlines(element: Bound, points: readonly [number, number][], rotate: number, hitPoint: [number, number], threshold: number): boolean;
export declare const distance2d: (x1: number, y1: number, x2: number, y2: number) => number;
export declare function isPointIn(a: IBound, x: number, y: number): boolean;
export declare function intersects(a: IBound, b: IBound): boolean;
export declare function almostEqual(a: number, b: number, epsilon?: number): boolean;
export declare function isVecZero(v: IVec): boolean;
export declare function isZero(x: number): boolean;
export declare function pointAlmostEqual(a: IVec, b: IVec, _epsilon?: number): boolean;
export declare function clamp(n: number, min: number, max?: number): number;
export declare function pointInEllipse(A: IVec, C: IVec, rx: number, ry: number, rotation?: number): boolean;
export declare function pointInPolygon(p: IVec, points: IVec[]): boolean;
export declare function pointOnEllipse(point: IVec, rx: number, ry: number, threshold: number): boolean;
export declare function pointOnPolygonStoke(p: IVec, points: IVec[], threshold: number): boolean;
export declare function getPolygonPathFromPoints(points: IVec[], closed?: boolean): string;
export declare function getSvgPathFromStroke(points: IVec[], closed?: boolean): string;
export declare function lineEllipseIntersects(A: IVec, B: IVec, C: IVec, rx: number, ry: number, rad?: number): PointLocation[] | null;
export declare function sign(number: number): 1 | -1;
export declare function getPointFromBoundsWithRotation(bounds: IBound, point: IVec): IVec;
export declare function normalizeDegAngle(angle: number): number;
export declare function toDegree(radian: number): number;
export declare function isOverlap(line1: IVec[], line2: IVec[], axis: 0 | 1, strict?: boolean): boolean;
export declare function getCenterAreaBounds(bounds: IBound, ratio: number): {
    x: number;
    y: number;
    w: number;
    h: number;
    rotate: number | undefined;
};
//# sourceMappingURL=math.d.ts.map