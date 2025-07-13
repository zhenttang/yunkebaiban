/**
 * Negate a vector.
 * @param A
 * @internal
 */
export function neg(A) {
    return [-A[0], -A[1]];
}
/**
 * Add vectors.
 * @param A
 * @param B
 * @internal
 */
export function add(A, B) {
    return [A[0] + B[0], A[1] + B[1]];
}
/**
 * Subtract vectors.
 * @param A
 * @param B
 * @internal
 */
export function sub(A, B) {
    return [A[0] - B[0], A[1] - B[1]];
}
/**
 * Vector multiplication by scalar
 * @param A
 * @param n
 * @internal
 */
export function mul(A, n) {
    return [A[0] * n, A[1] * n];
}
/**
 * Vector division by scalar.
 * @param A
 * @param n
 * @internal
 */
export function div(A, n) {
    return [A[0] / n, A[1] / n];
}
/**
 * Perpendicular rotation of a vector A
 * @param A
 * @internal
 */
export function per(A) {
    return [A[1], -A[0]];
}
/**
 * Dot product
 * @param A
 * @param B
 * @internal
 */
export function dpr(A, B) {
    return A[0] * B[0] + A[1] * B[1];
}
/**
 * Get whether two vectors are equal.
 * @param A
 * @param B
 * @internal
 */
export function isEqual(A, B) {
    return A[0] === B[0] && A[1] === B[1];
}
/**
 * Length of the vector
 * @param A
 * @internal
 */
export function len(A) {
    return Math.hypot(A[0], A[1]);
}
/**
 * Length of the vector squared
 * @param A
 * @internal
 */
export function len2(A) {
    return A[0] * A[0] + A[1] * A[1];
}
/**
 * Dist length from A to B squared.
 * @param A
 * @param B
 * @internal
 */
export function dist2(A, B) {
    return len2(sub(A, B));
}
/**
 * Get normalized / unit vector.
 * @param A
 * @internal
 */
export function uni(A) {
    return div(A, len(A));
}
/**
 * Dist length from A to B
 * @param A
 * @param B
 * @internal
 */
export function dist(A, B) {
    return Math.hypot(A[1] - B[1], A[0] - B[0]);
}
/**
 * Mean between two vectors or mid vector between two vectors
 * @param A
 * @param B
 * @internal
 */
export function med(A, B) {
    return mul(add(A, B), 0.5);
}
/**
 * Rotate a vector around another vector by r (radians)
 * @param A vector
 * @param C center
 * @param r rotation in radians
 * @internal
 */
export function rotAround(A, C, r) {
    const s = Math.sin(r);
    const c = Math.cos(r);
    const px = A[0] - C[0];
    const py = A[1] - C[1];
    const nx = px * c - py * s;
    const ny = px * s + py * c;
    return [nx + C[0], ny + C[1]];
}
/**
 * Interpolate vector A to B with a scalar t
 * @param A
 * @param B
 * @param t scalar
 * @internal
 */
export function lrp(A, B, t) {
    return add(A, mul(sub(B, A), t));
}
/**
 * Project a point A in the direction B by a scalar c
 * @param A
 * @param B
 * @param c
 * @internal
 */
export function prj(A, B, c) {
    return add(A, mul(B, c));
}
//# sourceMappingURL=vec.js.map