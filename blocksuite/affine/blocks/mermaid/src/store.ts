import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/affine-ext-loader';

import { MermaidBlockSchemaExtension } from './mermaid-model.js';

export class MermaidStoreExtension extends StoreExtensionProvider {
  override name = 'affine-mermaid-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register([MermaidBlockSchemaExtension]);
  }
}