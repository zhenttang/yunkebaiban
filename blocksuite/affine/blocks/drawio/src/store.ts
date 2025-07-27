import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { DrawioBlockSchemaExtension } from './drawio-model.js';

export class DrawioStoreExtension extends StoreExtensionProvider {
  override name = 'affine-drawio-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register([DrawioBlockSchemaExtension]);
  }
}