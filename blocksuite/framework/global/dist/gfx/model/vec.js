// Inlined from https://raw.githubusercontent.com/tldraw/tldraw/24cad6959f59f93e20e556d018c391fd89d4ecca/packages/vec/src/index.ts
// Credits to tldraw
export class Vec {
    /**
     * Absolute value of a vector.
     * @param A
     * @returns
     */
    static { this.abs = (A) => {
        return [Math.abs(A[0]), Math.abs(A[1])];
    }; }
    /**
     * Add vectors.
     * @param A
     * @param B
     */
    static { this.add = (A, B) => {
        return [A[0] + B[0], A[1] + B[1]];
    }; }
    /**
     * Add scalar to vector.
     * @param A
     * @param B
     */
    static { this.addScalar = (A, n) => {
        return [A[0] + n, A[1] + n];
    }; }
    /**
     * Angle between vector A and vector B in radians
     * @param A
     * @param B
     */
    static { this.ang = (A, B) => {
        return Math.atan2(Vec.cpr(A, B), Vec.dpr(A, B));
    }; }
    /**
     * Get the angle between the three vectors A, B, and C.
     * @param p1
     * @param pc
     * @param p2
     */
    static { this.ang3 = (p1, pc, p2) => {
        // this,
        const v1 = Vec.vec(pc, p1);
        const v2 = Vec.vec(pc, p2);
        return Vec.ang(v1, v2);
    }; }
    /**
     * Angle between vector A and vector B in radians
     * @param A
     * @param B
     */
    static { this.angle = (A, B) => {
        return Math.atan2(B[1] - A[1], B[0] - A[0]);
    }; }
    /**
     * Get whether p1 is left of p2, relative to pc.
     * @param p1
     * @param pc
     * @param p2
     */
    static { this.clockwise = (p1, pc, p2) => {
        return Vec.isLeft(p1, pc, p2) > 0;
    }; }
    /**
     * Cross product (outer product) | A X B |
     * @param A
     * @param B
     */
    static { this.cpr = (A, B) => {
        return A[0] * B[1] - B[0] * A[1];
    }; }
    /**
     * Dist length from A to B
     * @param A
     * @param B
     */
    static { this.dist = (A, B) => {
        return Math.hypot(A[1] - B[1], A[0] - B[0]);
    }; }
    /**
     * Dist length from A to B squared.
     * @param A
     * @param B
     */
    static { this.dist2 = (A, B) => {
        return Vec.len2(Vec.sub(A, B));
    }; }
    /**
     * Distance between a point and the nearest point on a bounding box.
     * @param bounds The bounding box.
     * @param P The point
     * @returns
     */
    static { this.distanceToBounds = (bounds, P) => {
        return Vec.dist(P, Vec.nearestPointOnBounds(bounds, P));
    }; }
    /**
     * Distance between a point and the nearest point on a line segment between A and B
     * @param A The start of the line segment
     * @param B The end of the line segment
     * @param P The off-line point
     * @param clamp Whether to clamp the point between A and B.
     * @returns
     */
    static { this.distanceToLineSegment = (A, B, P, clamp = true) => {
        return Vec.dist(P, Vec.nearestPointOnLineSegment(A, B, P, clamp));
    }; }
    /**
     * Distance between a point and a line with a known unit vector that passes through a point.
     * @param A Any point on the line
     * @param u The unit vector for the line.
     * @param P A point not on the line to test.
     * @returns
     */
    static { this.distanceToLineThroughPoint = (A, u, P) => {
        return Vec.dist(P, Vec.nearestPointOnLineThroughPoint(A, u, P));
    }; }
    /**
     * Vector division by scalar.
     * @param A
     * @param n
     */
    static { this.div = (A, n) => {
        return [A[0] / n, A[1] / n];
    }; }
    /**
     * Vector division by vector.
     * @param A
     * @param n
     */
    static { this.divV = (A, B) => {
        return [A[0] / B[0], A[1] / B[1]];
    }; }
    /**
     * Dot product
     * @param A
     * @param B
     */
    static { this.dpr = (A, B) => {
        return A[0] * B[0] + A[1] * B[1];
    }; }
    /**
     * A faster, though less accurate method for testing distances. Maybe faster?
     * @param A
     * @param B
     * @returns
     */
    static { this.fastDist = (A, B) => {
        const V = [B[0] - A[0], B[1] - A[1]];
        const aV = [Math.abs(V[0]), Math.abs(V[1])];
        let r = 1 / Math.max(aV[0], aV[1]);
        r = r * (1.29289 - (aV[0] + aV[1]) * r * 0.29289);
        return [V[0] * r, V[1] * r];
    }; }
    /**
     * Interpolate from A to B when curVAL goes fromVAL: number[] => to
     * @param A
     * @param B
     * @param from Starting value
     * @param to Ending value
     * @param s Strength
     */
    static { this.int = (A, B, from, to, s = 1) => {
        const t = (Vec.clamp(from, to) - from) / (to - from);
        return Vec.add(Vec.mul(A, 1 - t), Vec.mul(B, s));
    }; }
    /**
     * Check of two vectors are identical.
     * @param A
     * @param B
     */
    static { this.isEqual = (A, B) => {
        return A[0] === B[0] && A[1] === B[1];
    }; }
    /**
     * Get whether p1 is left of p2, relative to pc.
     * @param p1
     * @param pc
     * @param p2
     */
    static { this.isLeft = (p1, pc, p2) => {
        //  isLeft: >0 for counterclockwise
        //          =0 for none (degenerate)
        //          <0 for clockwise
        return ((pc[0] - p1[0]) * (p2[1] - p1[1]) - (p2[0] - p1[0]) * (pc[1] - p1[1]));
    }; }
    /**
     * Length of the vector
     * @param A
     */
    static { this.len = (A) => {
        return Math.hypot(A[0], A[1]);
    }; }
    /**
     * Length of the vector squared
     * @param A
     */
    static { this.len2 = (A) => {
        return A[0] * A[0] + A[1] * A[1];
    }; }
    /**
     * Interpolate vector A to B with a scalar t
     * @param A
     * @param B
     * @param t scalar
     */
    static { this.lrp = (A, B, t) => {
        return Vec.add(A, Vec.mul(Vec.sub(B, A), t));
    }; }
    /**
     * Get a vector comprised of the maximum of two or more vectors.
     */
    static { this.max = (...v) => {
        return [Math.max(...v.map(a => a[0])), Math.max(...v.map(a => a[1]))];
    }; }
    /**
     * Mean between two vectors or mid vector between two vectors
     * @param A
     * @param B
     */
    static { this.med = (A, B) => {
        return Vec.mul(Vec.add(A, B), 0.5);
    }; }
    /**
     * Get a vector comprised of the minimum of two or more vectors.
     */
    static { this.min = (...v) => {
        return [Math.min(...v.map(a => a[0])), Math.min(...v.map(a => a[1]))];
    }; }
    /**
     * Vector multiplication by scalar
     * @param A
     * @param n
     */
    static { this.mul = (A, n) => {
        return [A[0] * n, A[1] * n];
    }; }
    /**
     * Multiple two vectors.
     * @param A
     * @param B
     */
    static { this.mulV = (A, B) => {
        return [A[0] * B[0], A[1] * B[1]];
    }; }
    /**
     * Get the nearest point on a bounding box to a point P.
     * @param bounds The bounding box
     * @param P The point point
     * @returns
     */
    static { this.nearestPointOnBounds = (bounds, P) => {
        return [
            Vec.clamp(P[0], bounds.minX, bounds.maxX),
            Vec.clamp(P[1], bounds.minY, bounds.maxY),
        ];
    }; }
    /**
     * Get the nearest point on a line segment between A and B
     * @param A The start of the line segment
     * @param B The end of the line segment
     * @param P The off-line point
     * @param clamp Whether to clamp the point between A and B.
     * @returns
     */
    static { this.nearestPointOnLineSegment = (A, B, P, clamp = true) => {
        const u = Vec.uni(Vec.sub(B, A));
        const C = Vec.add(A, Vec.mul(u, Vec.pry(Vec.sub(P, A), u)));
        if (clamp) {
            if (C[0] < Math.min(A[0], B[0]))
                return A[0] < B[0] ? A : B;
            if (C[0] > Math.max(A[0], B[0]))
                return A[0] > B[0] ? A : B;
            if (C[1] < Math.min(A[1], B[1]))
                return A[1] < B[1] ? A : B;
            if (C[1] > Math.max(A[1], B[1]))
                return A[1] > B[1] ? A : B;
        }
        return C;
    }; }
    /**
     * Get the nearest point on a line with a known unit vector that passes through point A
     * @param A Any point on the line
     * @param u The unit vector for the line.
     * @param P A point not on the line to test.
     * @returns
     */
    static { this.nearestPointOnLineThroughPoint = (A, u, P) => {
        return Vec.add(A, Vec.mul(u, Vec.pry(Vec.sub(P, A), u)));
    }; }
    /**
     * Negate a vector.
     * @param A
     */
    static { this.neg = (A) => {
        return [-A[0], -A[1]];
    }; }
    /**
     * Get normalized / unit vector.
     * @param A
     */
    static { this.normalize = (A) => {
        return Vec.uni(A);
    }; }
    /**
     * Push a point A towards point B by a given distance.
     * @param A
     * @param B
     * @param d
     * @returns
     */
    static { this.nudge = (A, B, d) => {
        if (Vec.isEqual(A, B))
            return A;
        return Vec.add(A, Vec.mul(Vec.uni(Vec.sub(B, A)), d));
    }; }
    /**
     * Push a point in a given angle by a given distance.
     * @param A
     * @param B
     * @param d
     */
    static { this.nudgeAtAngle = (A, a, d) => {
        return [Math.cos(a) * d + A[0], Math.sin(a) * d + A[1]];
    }; }
    /**
     * Perpendicular rotation of a vector A
     * @param A
     */
    static { this.per = (A) => {
        return [A[1], -A[0]];
    }; }
    static { this.pointOffset = (A, B, offset) => {
        let u = Vec.uni(Vec.sub(B, A));
        if (Vec.isEqual(A, B))
            u = A;
        return Vec.add(A, Vec.mul(u, offset));
    }; }
    /**
     * Get an array of points between two points.
     * @param A The first point.
     * @param B The second point.
     * @param steps The number of points to return.
     */
    static { this.pointsBetween = (A, B, steps = 6) => {
        return Array.from({ length: steps }).map((_, i) => {
            const t = i / (steps - 1);
            const k = Math.min(1, 0.5 + Math.abs(0.5 - t));
            return [...Vec.lrp(A, B, t), k];
        });
    }; }
    /**
     * Project A over B
     * @param A
     * @param B
     */
    static { this.pry = (A, B) => {
        return Vec.dpr(A, B) / Vec.len(B);
    }; }
    static { this.rescale = (a, n) => {
        const l = Vec.len(a);
        return [(n * a[0]) / l, (n * a[1]) / l];
    }; }
    /**
     * Vector rotation by r (radians)
     * @param A
     * @param r rotation in radians
     */
    static { this.rot = (A, r = 0) => {
        return [
            A[0] * Math.cos(r) - A[1] * Math.sin(r),
            A[0] * Math.sin(r) + A[1] * Math.cos(r),
        ];
    }; }
    /**
     * Rotate a vector around another vector by r (radians)
     * @param A vector
     * @param C center
     * @param r rotation in radians
     */
    static { this.rotWith = (A, C, r = 0) => {
        if (r === 0)
            return A;
        const s = Math.sin(r);
        const c = Math.cos(r);
        const px = A[0] - C[0];
        const py = A[1] - C[1];
        const nx = px * c - py * s;
        const ny = px * s + py * c;
        return [nx + C[0], ny + C[1]];
    }; }
    /**
     * Get the slope between two points.
     * @param A
     * @param B
     */
    static { this.slope = (A, B) => {
        if (A[0] === B[0])
            return NaN;
        return (A[1] - B[1]) / (A[0] - B[0]);
    }; }
    /**
     * Subtract vectors.
     * @param A
     * @param B
     */
    static { this.sub = (A, B) => {
        return [A[0] - B[0], A[1] - B[1]];
    }; }
    /**
     * Subtract scalar from vector.
     * @param A
     * @param B
     */
    static { this.subScalar = (A, n) => {
        return [A[0] - n, A[1] - n];
    }; }
    /**
     * Get the tangent between two vectors.
     * @param A
     * @param B
     * @returns
     */
    static { this.tangent = (A, B) => {
        return Vec.uni(Vec.sub(A, B));
    }; }
    /**
     * Round a vector to two decimal places.
     * @param a
     */
    static { this.toFixed = (a) => {
        return a.map(v => Math.round(v * 100) / 100);
    }; }
    static { this.toPoint = (v) => {
        return {
            x: v[0],
            y: v[1],
        };
    }; }
    /**
     * Round a vector to a precision length.
     * @param a
     * @param n
     */
    static { this.toPrecision = (a, n = 4) => {
        return [+a[0].toPrecision(n), +a[1].toPrecision(n)];
    }; }
    static { this.toVec = (v) => [v.x, v.y]; }
    /**
     * Get normalized / unit vector.
     * @param A
     */
    static { this.uni = (A) => {
        return Vec.div(A, Vec.len(A));
    }; }
    /**
     * Get the vector from vectors A to B.
     * @param A
     * @param B
     */
    static { this.vec = (A, B) => {
        // A, B as vectors get the vector from A to B
        return [B[0] - A[0], B[1] - A[1]];
    }; }
    static clamp(n, min, max) {
        return Math.max(min, max !== undefined ? Math.min(n, max) : n);
    }
    static clampV(A, min, max) {
        return A.map(n => max !== undefined ? Vec.clamp(n, min, max) : Vec.clamp(n, min));
    }
    /**
     * Cross (for point in polygon)
     *
     */
    static cross(x, y, z) {
        return (y[0] - x[0]) * (z[1] - x[1]) - (z[0] - x[0]) * (y[1] - x[1]);
    }
    /**
     * Snap vector to nearest step.
     * @param A
     * @param step
     * @example
     * ```ts
     * Vec.snap([10.5, 28], 10) // [10, 30]
     * ```
     */
    static snap(a, step = 1) {
        return [Math.round(a[0] / step) * step, Math.round(a[1] / step) * step];
    }
}
//# sourceMappingURL=vec.js.map