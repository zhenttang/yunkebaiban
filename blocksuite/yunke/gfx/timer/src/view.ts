import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects';
import { timerQuickTool } from './toolbar/timer-tool-button';

export class TimerViewExtension extends ViewExtensionProvider {
    override name = 'yunke-timer-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        context.register(timerQuickTool);
    }
}
