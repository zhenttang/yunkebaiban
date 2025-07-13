/**
 * Compute a radius based on the pressure.
 * @param size
 * @param thinning
 * @param pressure
 * @param easing
 * @internal
 */
export function getStrokeRadius(size, thinning, pressure, easing = t => t) {
    return size * easing(0.5 - thinning * (0.5 - pressure));
}
//# sourceMappingURL=get-stroke-radius.js.map