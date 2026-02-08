/**
 * 视图扩展
 */

import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects';
import { calligraphyQuickTool } from './toolbar/calligraphy-tool-button';

export class CalligraphyViewExtension extends ViewExtensionProvider {
    override name = 'yunke-calligraphy-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext): void {
        super.setup(context);
        context.register(calligraphyQuickTool);
    }
}
