import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects';
import { chartQuickTool } from './toolbar/chart-tool-button';

export class ChartViewExtension extends ViewExtensionProvider {
    override name = 'yunke-chart-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        context.register(chartQuickTool);
    }
}
