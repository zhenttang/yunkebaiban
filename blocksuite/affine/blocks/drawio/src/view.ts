import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { effects } from './effects.js';
import { DrawioBlockSpec } from './drawio-spec.js';

export class DrawioViewExtension extends ViewExtensionProvider {
  override name = 'affine-drawio-block';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register(DrawioBlockSpec);
  }
}