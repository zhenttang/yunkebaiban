import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects';
import { LaserTool } from './laser-tool';
import { laserQuickTool } from './toolbar/laser-tool-button';

export class LaserViewExtension extends ViewExtensionProvider {
    override name = 'yunke-laser-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        context.register(LaserTool);
        context.register(laserQuickTool);
    }
}
