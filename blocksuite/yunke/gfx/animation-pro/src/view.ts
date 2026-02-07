/**
 * Animation Pro View Extension
 */

import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects.js';

export class AnimationProViewExtension extends ViewExtensionProvider {
    override name = 'yunke-animation-pro-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        // 专业动画系统注册
        console.log('[AnimationPro] View extension setup complete');
    }
}
