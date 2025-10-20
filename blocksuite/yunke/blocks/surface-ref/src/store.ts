import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { SurfaceRefBlockSchemaExtension } from '@blocksuite/yunke-model';

export class SurfaceRefStoreExtension extends StoreExtensionProvider {
  override name = 'yunke-surface-ref-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register(SurfaceRefBlockSchemaExtension);
  }
}
