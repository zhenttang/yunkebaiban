import { Bound, type IBound } from './model/bound.js';
import { type IVec } from './model/vec.js';
export declare function getPointsFromBoundWithRotation(bounds: IBound, getPoints?: (bounds: IBound) => IVec[], resPadding?: [number, number]): IVec[];
export declare function getQuadBoundWithRotation(bounds: IBound): DOMRect;
export declare function getBoundWithRotation(bound: IBound): IBound;
/**
 * Returns the common bound of the given bounds.
 * The rotation of the bounds is not considered.
 * @param bounds
 * @returns
 */
export declare function getCommonBound(bounds: IBound[]): Bound | null;
/**
 * Like `getCommonBound`, but considers the rotation of the bounds.
 * @returns
 */
export declare function getCommonBoundWithRotation(bounds: IBound[]): Bound;
export declare function getBoundFromPoints(points: IVec[]): Bound;
export declare function inflateBound(bound: IBound, delta: number): Bound;
export declare function transformPointsToNewBound<T extends {
    x: number;
    y: number;
}>(points: T[], oldBound: IBound, oldMargin: number, newBound: IBound, newMargin: number): {
    points: T[];
    bound: Bound;
};
//# sourceMappingURL=bound.d.ts.map