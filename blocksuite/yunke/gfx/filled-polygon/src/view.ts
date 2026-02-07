/**
 * FilledPolygon View Extension
 */

import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects.js';
import { FilledPolygonElementRendererExtension } from './element-renderer.js';

export class FilledPolygonViewExtension extends ViewExtensionProvider {
    override name = 'yunke-filled-polygon-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        // 注册渲染器扩展
        context.register(FilledPolygonElementRendererExtension);
        console.log('[FilledPolygon] View extension setup complete');
    }
}
