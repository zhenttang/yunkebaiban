/**
 * 缓动函数库
 * 用于补间动画的插值计算
 */

import type { EasingType } from './types.js';

type EasingFunction = (t: number) => number;

export const Easing: Record<EasingType, EasingFunction> = {
    linear: (t: number) => t,

    easeInQuad: (t: number) => t * t,

    easeOutQuad: (t: number) => t * (2 - t),

    easeInOutQuad: (t: number) =>
        t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

    easeInCubic: (t: number) => t * t * t,

    easeOutCubic: (t: number) => --t * t * t + 1,

    easeInOutCubic: (t: number) =>
        t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

    easeInElastic: (t: number) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return (
            -Math.pow(2, 10 * t - 10) *
            Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3))
        );
    },

    easeOutElastic: (t: number) => {
        if (t === 0) return 0;
        if (t === 1) return 1;
        return (
            Math.pow(2, -10 * t) *
                Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) +
            1
        );
    },

    easeOutBounce: (t: number) => {
        const n1 = 7.5625;
        const d1 = 2.75;

        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    },
};

/**
 * 获取缓动函数
 */
export function getEasingFunction(type: EasingType): EasingFunction {
    return Easing[type] || Easing.linear;
}

/**
 * 插值计算
 */
export function lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
}

/**
 * 带缓动的插值计算
 */
export function easedLerp(
    start: number,
    end: number,
    t: number,
    easing: EasingType = 'linear'
): number {
    const easedT = getEasingFunction(easing)(t);
    return lerp(start, end, easedT);
}
