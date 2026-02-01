/**
 * ColorDrop View Extension
 */

import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects.js';

export class ColorDropViewExtension extends ViewExtensionProvider {
    override name = 'yunke-color-drop-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        console.log('[ColorDrop] View extension setup complete');
    }
}
