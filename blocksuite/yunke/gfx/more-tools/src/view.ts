import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects.js';
import { moreToolsQuickTool } from './more-tools-button.js';

export class MoreToolsViewExtension extends ViewExtensionProvider {
    override name = 'yunke-more-tools-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        context.register(moreToolsQuickTool);
    }
}
