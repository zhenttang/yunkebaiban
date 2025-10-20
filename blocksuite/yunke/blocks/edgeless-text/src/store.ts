import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { EdgelessTextBlockSchemaExtension } from '@blocksuite/yunke-model';

export class EdgelessTextStoreExtension extends StoreExtensionProvider {
  override name = 'yunke-edgeless-text-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register(EdgelessTextBlockSchemaExtension);
  }
}
