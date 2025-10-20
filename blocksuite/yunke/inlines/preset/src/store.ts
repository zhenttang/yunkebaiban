import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { InlineAdapterExtensions } from './adapters/extensions';

export class InlinePresetStoreExtension extends StoreExtensionProvider {
  override name = 'yunke-inline-preset';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register(InlineAdapterExtensions);
  }
}
