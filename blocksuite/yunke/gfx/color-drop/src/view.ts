/**
 * ColorDrop View Extension
 */

import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects.js';
import { colorDropSeniorTool } from './toolbar/color-drop-senior-tool.js';

export class ColorDropViewExtension extends ViewExtensionProvider {
    override name = 'yunke-color-drop-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        // 注册填色工具到工具栏
        context.register(colorDropSeniorTool);
    }
}
