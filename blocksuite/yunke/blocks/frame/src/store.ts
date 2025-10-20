import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';
import { FrameBlockSchemaExtension } from '@blocksuite/yunke-model';

export class FrameStoreExtension extends StoreExtensionProvider {
  override name = 'yunke-frame-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register([FrameBlockSchemaExtension]);
  }
}
