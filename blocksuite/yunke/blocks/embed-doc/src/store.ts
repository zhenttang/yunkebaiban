import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import {
  EmbedLinkedDocBlockSchemaExtension,
  EmbedSyncedDocBlockSchemaExtension,
} from '@blocksuite/yunke-model';

import { EmbedLinkedDocBlockAdapterExtensions } from './embed-linked-doc-block/adapters/extension';
import { EmbedSyncedDocBlockAdapterExtensions } from './embed-synced-doc-block/adapters/extension';

export class EmbedDocStoreExtension extends StoreExtensionProvider {
  override name = 'affine-embed-doc-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register([
      EmbedSyncedDocBlockSchemaExtension,
      EmbedLinkedDocBlockSchemaExtension,
    ]);
    context.register(EmbedLinkedDocBlockAdapterExtensions);
    context.register(EmbedSyncedDocBlockAdapterExtensions);
  }
}
