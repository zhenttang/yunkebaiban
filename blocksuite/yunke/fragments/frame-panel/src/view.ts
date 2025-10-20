import { ViewExtensionProvider } from '@blocksuite/yunke-ext-loader';

import { effects } from './effects';

export class FramePanelViewExtension extends ViewExtensionProvider {
  override name = 'yunke-frame-panel-fragment';

  override effect() {
    super.effect();
    effects();
  }
}
