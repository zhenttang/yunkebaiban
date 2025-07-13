export type IVec = [number, number];
export type IVec3 = [number, number, number];
export declare class Vec {
    /**
     * Absolute value of a vector.
     * @param A
     * @returns
     */
    static abs: (A: number[]) => number[];
    /**
     * Add vectors.
     * @param A
     * @param B
     */
    static add: (A: number[], B: number[]) => IVec;
    /**
     * Add scalar to vector.
     * @param A
     * @param B
     */
    static addScalar: (A: number[], n: number) => IVec;
    /**
     * Angle between vector A and vector B in radians
     * @param A
     * @param B
     */
    static ang: (A: number[], B: number[]) => number;
    /**
     * Get the angle between the three vectors A, B, and C.
     * @param p1
     * @param pc
     * @param p2
     */
    static ang3: (p1: IVec, pc: IVec, p2: IVec) => number;
    /**
     * Angle between vector A and vector B in radians
     * @param A
     * @param B
     */
    static angle: (A: IVec, B: IVec) => number;
    /**
     * Get whether p1 is left of p2, relative to pc.
     * @param p1
     * @param pc
     * @param p2
     */
    static clockwise: (p1: number[], pc: number[], p2: number[]) => boolean;
    /**
     * Cross product (outer product) | A X B |
     * @param A
     * @param B
     */
    static cpr: (A: number[], B: number[]) => number;
    /**
     * Dist length from A to B
     * @param A
     * @param B
     */
    static dist: (A: number[], B: number[]) => number;
    /**
     * Dist length from A to B squared.
     * @param A
     * @param B
     */
    static dist2: (A: IVec, B: IVec) => number;
    /**
     * Distance between a point and the nearest point on a bounding box.
     * @param bounds The bounding box.
     * @param P The point
     * @returns
     */
    static distanceToBounds: (bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    }, P: number[]) => number;
    /**
     * Distance between a point and the nearest point on a line segment between A and B
     * @param A The start of the line segment
     * @param B The end of the line segment
     * @param P The off-line point
     * @param clamp Whether to clamp the point between A and B.
     * @returns
     */
    static distanceToLineSegment: (A: IVec, B: IVec, P: IVec, clamp?: boolean) => number;
    /**
     * Distance between a point and a line with a known unit vector that passes through a point.
     * @param A Any point on the line
     * @param u The unit vector for the line.
     * @param P A point not on the line to test.
     * @returns
     */
    static distanceToLineThroughPoint: (A: IVec, u: IVec, P: IVec) => number;
    /**
     * Vector division by scalar.
     * @param A
     * @param n
     */
    static div: (A: IVec, n: number) => IVec;
    /**
     * Vector division by vector.
     * @param A
     * @param n
     */
    static divV: (A: IVec, B: IVec) => IVec;
    /**
     * Dot product
     * @param A
     * @param B
     */
    static dpr: (A: number[], B: number[]) => number;
    /**
     * A faster, though less accurate method for testing distances. Maybe faster?
     * @param A
     * @param B
     * @returns
     */
    static fastDist: (A: number[], B: number[]) => number[];
    /**
     * Interpolate from A to B when curVAL goes fromVAL: number[] => to
     * @param A
     * @param B
     * @param from Starting value
     * @param to Ending value
     * @param s Strength
     */
    static int: (A: IVec, B: IVec, from: number, to: number, s?: number) => IVec;
    /**
     * Check of two vectors are identical.
     * @param A
     * @param B
     */
    static isEqual: (A: number[], B: number[]) => boolean;
    /**
     * Get whether p1 is left of p2, relative to pc.
     * @param p1
     * @param pc
     * @param p2
     */
    static isLeft: (p1: number[], pc: number[], p2: number[]) => number;
    /**
     * Length of the vector
     * @param A
     */
    static len: (A: number[]) => number;
    /**
     * Length of the vector squared
     * @param A
     */
    static len2: (A: number[]) => number;
    /**
     * Interpolate vector A to B with a scalar t
     * @param A
     * @param B
     * @param t scalar
     */
    static lrp: (A: IVec, B: IVec, t: number) => IVec;
    /**
     * Get a vector comprised of the maximum of two or more vectors.
     */
    static max: (...v: number[][]) => number[];
    /**
     * Mean between two vectors or mid vector between two vectors
     * @param A
     * @param B
     */
    static med: (A: IVec, B: IVec) => IVec;
    /**
     * Get a vector comprised of the minimum of two or more vectors.
     */
    static min: (...v: number[][]) => number[];
    /**
     * Vector multiplication by scalar
     * @param A
     * @param n
     */
    static mul: (A: IVec, n: number) => IVec;
    /**
     * Multiple two vectors.
     * @param A
     * @param B
     */
    static mulV: (A: IVec, B: IVec) => IVec;
    /**
     * Get the nearest point on a bounding box to a point P.
     * @param bounds The bounding box
     * @param P The point point
     * @returns
     */
    static nearestPointOnBounds: (bounds: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
    }, P: number[]) => number[];
    /**
     * Get the nearest point on a line segment between A and B
     * @param A The start of the line segment
     * @param B The end of the line segment
     * @param P The off-line point
     * @param clamp Whether to clamp the point between A and B.
     * @returns
     */
    static nearestPointOnLineSegment: (A: IVec, B: IVec, P: IVec, clamp?: boolean) => IVec;
    /**
     * Get the nearest point on a line with a known unit vector that passes through point A
     * @param A Any point on the line
     * @param u The unit vector for the line.
     * @param P A point not on the line to test.
     * @returns
     */
    static nearestPointOnLineThroughPoint: (A: IVec, u: IVec, P: IVec) => IVec;
    /**
     * Negate a vector.
     * @param A
     */
    static neg: (A: number[]) => number[];
    /**
     * Get normalized / unit vector.
     * @param A
     */
    static normalize: (A: IVec) => IVec;
    /**
     * Push a point A towards point B by a given distance.
     * @param A
     * @param B
     * @param d
     * @returns
     */
    static nudge: (A: IVec, B: IVec, d: number) => number[];
    /**
     * Push a point in a given angle by a given distance.
     * @param A
     * @param B
     * @param d
     */
    static nudgeAtAngle: (A: number[], a: number, d: number) => number[];
    /**
     * Perpendicular rotation of a vector A
     * @param A
     */
    static per: (A: IVec) => IVec;
    static pointOffset: (A: IVec, B: IVec, offset: number) => IVec;
    /**
     * Get an array of points between two points.
     * @param A The first point.
     * @param B The second point.
     * @param steps The number of points to return.
     */
    static pointsBetween: (A: IVec, B: IVec, steps?: number) => number[][];
    /**
     * Project A over B
     * @param A
     * @param B
     */
    static pry: (A: number[], B: number[]) => number;
    static rescale: (a: number[], n: number) => number[];
    /**
     * Vector rotation by r (radians)
     * @param A
     * @param r rotation in radians
     */
    static rot: (A: number[], r?: number) => IVec;
    /**
     * Rotate a vector around another vector by r (radians)
     * @param A vector
     * @param C center
     * @param r rotation in radians
     */
    static rotWith: (A: IVec, C: IVec, r?: number) => IVec;
    /**
     * Get the slope between two points.
     * @param A
     * @param B
     */
    static slope: (A: number[], B: number[]) => number;
    /**
     * Subtract vectors.
     * @param A
     * @param B
     */
    static sub: (A: IVec, B: IVec) => IVec;
    /**
     * Subtract scalar from vector.
     * @param A
     * @param B
     */
    static subScalar: (A: IVec, n: number) => IVec;
    /**
     * Get the tangent between two vectors.
     * @param A
     * @param B
     * @returns
     */
    static tangent: (A: IVec, B: IVec) => IVec;
    /**
     * Round a vector to two decimal places.
     * @param a
     */
    static toFixed: (a: number[]) => number[];
    static toPoint: (v: IVec) => {
        x: number;
        y: number;
    };
    /**
     * Round a vector to a precision length.
     * @param a
     * @param n
     */
    static toPrecision: (a: number[], n?: number) => number[];
    static toVec: (v: {
        x: number;
        y: number;
    }) => IVec;
    /**
     * Get normalized / unit vector.
     * @param A
     */
    static uni: (A: IVec) => IVec;
    /**
     * Get the vector from vectors A to B.
     * @param A
     * @param B
     */
    static vec: (A: IVec, B: IVec) => IVec;
    /**
     * Clamp a value into a range.
     * @param n
     * @param min
     */
    static clamp(n: number, min: number): number;
    static clamp(n: number, min: number, max: number): number;
    /**
     * Clamp a value into a range.
     * @param n
     * @param min
     */
    static clampV(A: IVec, min: number, max?: number): IVec;
    static clampV(A: number[], min: number): number[];
    static clampV(A: number[], min: number, max: number): number[];
    /**
     * Cross (for point in polygon)
     *
     */
    static cross(x: number[], y: number[], z: number[]): number;
    /**
     * Snap vector to nearest step.
     * @param A
     * @param step
     * @example
     * ```ts
     * Vec.snap([10.5, 28], 10) // [10, 30]
     * ```
     */
    static snap(a: number[], step?: number): number[];
}
//# sourceMappingURL=vec.d.ts.map