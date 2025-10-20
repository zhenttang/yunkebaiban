import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { edgelessToolbarWidget } from './edgeless-toolbar';
import { effects } from './effects';

export class EdgelessToolbarViewExtension extends ViewExtensionProvider {
  override name = 'yunke-edgeless-toolbar-widget';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    if (this.isEdgeless(context.scope)) {
      context.register(edgelessToolbarWidget);
    }
  }
}
