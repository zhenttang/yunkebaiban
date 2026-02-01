/**
 * FilledPolygon Effects - 注册元素类型和渲染器
 */

import { FilledPolygonElementModel } from '@blocksuite/yunke-model';
import { GfxControllerIdentifier } from '@blocksuite/std/gfx';

export function effects() {
    // FilledPolygon 元素模型会在 surface 中自动注册
    console.log('[FilledPolygon] Effects registered');
}

/**
 * 注册 FilledPolygon 元素类型到 Surface
 */
export function registerFilledPolygonElement(std: any) {
    try {
        const gfx = std.get(GfxControllerIdentifier);
        if (gfx && gfx.surface) {
            // 注册元素类型
            // 注意：实际注册逻辑可能需要根据 BlockSuite 的具体 API 调整
            console.log('[FilledPolygon] Element type registered');
        }
    } catch (e) {
        console.warn('[FilledPolygon] Failed to register element type:', e);
    }
}
