import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { effects } from './effects.js';
import { ExcalidrawBlockSpec } from './excalidraw-spec.js';

export class ExcalidrawViewExtension extends ViewExtensionProvider {
  override name = 'affine-excalidraw-block';

  override effect() {
    super.effect();
    effects();
  }

  override setup(context: ViewExtensionContext) {
    super.setup(context);
    context.register(ExcalidrawBlockSpec);
  }
}