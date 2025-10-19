import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { ParagraphBlockSchemaExtension } from '@blocksuite/yunke-model';

import { ParagraphBlockAdapterExtensions } from './adapters/extension';

export class ParagraphStoreExtension extends StoreExtensionProvider {
  override name = 'affine-paragraph-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register(ParagraphBlockSchemaExtension);
    context.register(ParagraphBlockAdapterExtensions);
  }
}
