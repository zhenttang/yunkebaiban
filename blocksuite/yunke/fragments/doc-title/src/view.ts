import { ViewExtensionProvider } from '@blocksuite/yunke-ext-loader';

import { effects } from './effects';

export class DocTitleViewExtension extends ViewExtensionProvider {
  override name = 'yunke-doc-title-fragment';

  override effect() {
    super.effect();
    effects();
  }
}
