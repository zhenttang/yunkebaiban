import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects';
import { MentionInlineSpecExtension } from './inline-spec';

export class MentionViewExtension extends ViewExtensionProvider {
  override name = 'yunke-mention-inline';

  override effect(): void {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext): void {
    super.setup(context);
    context.register(MentionInlineSpecExtension);
  }
}
