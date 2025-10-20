import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import {
  referenceDeltaMarkdownAdapterMatch,
  referenceDeltaToHtmlAdapterMatcher,
  referenceDeltaToMarkdownAdapterMatcher,
} from './adapters';

export class ReferenceStoreExtension extends StoreExtensionProvider {
  override name = 'yunke-reference-inline';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register(referenceDeltaToHtmlAdapterMatcher);
    context.register(referenceDeltaToMarkdownAdapterMatcher);
    context.register(referenceDeltaMarkdownAdapterMatch);
  }
}
