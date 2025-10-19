import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { ImageBlockSchemaExtension } from '@blocksuite/yunke-model';
import { ImageSelectionExtension } from '@blocksuite/yunke-shared/selection';

import { ImageBlockAdapterExtensions } from './adapters/extension';

export class ImageStoreExtension extends StoreExtensionProvider {
  override name = 'affine-image-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register([ImageBlockSchemaExtension, ImageSelectionExtension]);
    context.register(ImageBlockAdapterExtensions);
  }
}
