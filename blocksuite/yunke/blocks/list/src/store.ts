import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { ListBlockSchemaExtension } from '@blocksuite/yunke-model';

import { ListBlockAdapterExtensions } from './adapters/extension';

export class ListStoreExtension extends StoreExtensionProvider {
  override name = 'affine-list-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register(ListBlockSchemaExtension);
    context.register(ListBlockAdapterExtensions);
  }
}
