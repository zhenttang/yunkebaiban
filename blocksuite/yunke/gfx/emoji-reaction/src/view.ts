import {
    type ViewExtensionContext,
    ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects';
import { emojiQuickTool } from './toolbar/emoji-tool-button';

export class EmojiReactionViewExtension extends ViewExtensionProvider {
    override name = 'yunke-emoji-reaction-gfx';

    override effect(): void {
        super.effect();
        effects();
    }

    override setup(context: ViewExtensionContext) {
        super.setup(context);
        context.register(emojiQuickTool);
    }
}
