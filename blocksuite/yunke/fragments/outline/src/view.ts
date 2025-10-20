import { ViewExtensionProvider } from '@blocksuite/yunke-ext-loader';

import { effects } from './effects';

export class OutlineViewExtension extends ViewExtensionProvider {
  override name = 'yunke-outline-fragment';

  override effect() {
    super.effect();
    effects();
  }
}
