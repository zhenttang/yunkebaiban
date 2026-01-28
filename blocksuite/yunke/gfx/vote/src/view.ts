import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects';
import { voteQuickTool } from './toolbar/vote-tool-button';

export class VoteViewExtension extends ViewExtensionProvider {
    override name = 'yunke-vote-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        context.register(voteQuickTool);
    }
}
