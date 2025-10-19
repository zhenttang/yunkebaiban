import { StoreExtensionManager } from '@blocksuite/yunke/ext-loader';
import { getInternalStoreExtensions } from '@blocksuite/yunke/extensions/store';

const manager = new StoreExtensionManager(getInternalStoreExtensions());

export function getStoreManager() {
  return manager;
}
