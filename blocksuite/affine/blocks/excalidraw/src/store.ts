import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { ExcalidrawBlockSchemaExtension } from './excalidraw-model.js';

export class ExcalidrawStoreExtension extends StoreExtensionProvider {
  override name = 'affine-excalidraw-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register([ExcalidrawBlockSchemaExtension]);
  }
}