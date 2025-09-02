import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { deckerSeniorTool } from './decker-senior-tool';

export class DeckViewExtension extends ViewExtensionProvider {
  override name = 'affine-deck-integration';

  override effect(): void {
    super.effect();
    // 注册自定义元素
    if (!customElements.get('edgeless-decker-button')) {
      import('./decker-button').then(module => {
        customElements.define('edgeless-decker-button', module.EdgelessDeckerButton);
      });
    }
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    if (this.isEdgeless(context.scope)) {
      context.register(deckerSeniorTool);
    }
  }
}