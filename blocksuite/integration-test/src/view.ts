import { ViewExtensionManager } from '@blocksuite/yunke/ext-loader';
import { getInternalViewExtensions } from '@blocksuite/yunke/extensions/view';

const manager = new ViewExtensionManager(getInternalViewExtensions());

export function getTestViewManager() {
  return manager;
}
