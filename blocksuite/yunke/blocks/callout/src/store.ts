import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { CalloutBlockSchemaExtension } from '@blocksuite/yunke-model';

import { CalloutBlockMarkdownAdapterExtension } from './adapters/markdown';

export class CalloutStoreExtension extends StoreExtensionProvider {
  override name = 'affine-callout-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register(CalloutBlockSchemaExtension);
    context.register(CalloutBlockMarkdownAdapterExtension);
  }
}
