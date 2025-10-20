import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { effects } from './effects.js';
import { DrawioBlockSpec } from './drawio-spec.js';

export class DrawioViewExtension extends ViewExtensionProvider {
  override name = 'yunke-drawio-block';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register(DrawioBlockSpec);
  }
}