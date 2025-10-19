import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { AttachmentBlockSchemaExtension } from '@blocksuite/yunke-model';

import { AttachmentBlockAdapterExtensions } from './adapters/extension';

export class AttachmentStoreExtension extends StoreExtensionProvider {
  override name = 'affine-attachment-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register(AttachmentBlockSchemaExtension);
    context.register(AttachmentBlockAdapterExtensions);
  }
}
