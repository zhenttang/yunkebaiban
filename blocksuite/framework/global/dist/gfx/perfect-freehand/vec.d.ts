import type { IVec } from '../model/index.js';
/**
 * Negate a vector.
 * @param A
 * @internal
 */
export declare function neg(A: IVec): IVec;
/**
 * Add vectors.
 * @param A
 * @param B
 * @internal
 */
export declare function add(A: IVec, B: IVec): IVec;
/**
 * Subtract vectors.
 * @param A
 * @param B
 * @internal
 */
export declare function sub(A: IVec, B: IVec): IVec;
/**
 * Vector multiplication by scalar
 * @param A
 * @param n
 * @internal
 */
export declare function mul(A: IVec, n: number): IVec;
/**
 * Vector division by scalar.
 * @param A
 * @param n
 * @internal
 */
export declare function div(A: IVec, n: number): IVec;
/**
 * Perpendicular rotation of a vector A
 * @param A
 * @internal
 */
export declare function per(A: IVec): IVec;
/**
 * Dot product
 * @param A
 * @param B
 * @internal
 */
export declare function dpr(A: IVec, B: IVec): number;
/**
 * Get whether two vectors are equal.
 * @param A
 * @param B
 * @internal
 */
export declare function isEqual(A: IVec, B: IVec): boolean;
/**
 * Length of the vector
 * @param A
 * @internal
 */
export declare function len(A: IVec): number;
/**
 * Length of the vector squared
 * @param A
 * @internal
 */
export declare function len2(A: IVec): number;
/**
 * Dist length from A to B squared.
 * @param A
 * @param B
 * @internal
 */
export declare function dist2(A: IVec, B: IVec): number;
/**
 * Get normalized / unit vector.
 * @param A
 * @internal
 */
export declare function uni(A: IVec): IVec;
/**
 * Dist length from A to B
 * @param A
 * @param B
 * @internal
 */
export declare function dist(A: IVec, B: IVec): number;
/**
 * Mean between two vectors or mid vector between two vectors
 * @param A
 * @param B
 * @internal
 */
export declare function med(A: IVec, B: IVec): IVec;
/**
 * Rotate a vector around another vector by r (radians)
 * @param A vector
 * @param C center
 * @param r rotation in radians
 * @internal
 */
export declare function rotAround(A: IVec, C: IVec, r: number): IVec;
/**
 * Interpolate vector A to B with a scalar t
 * @param A
 * @param B
 * @param t scalar
 * @internal
 */
export declare function lrp(A: IVec, B: IVec, t: number): IVec;
/**
 * Project a point A in the direction B by a scalar c
 * @param A
 * @param B
 * @param c
 * @internal
 */
export declare function prj(A: IVec, B: IVec, c: number): IVec;
//# sourceMappingURL=vec.d.ts.map