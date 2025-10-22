import {
  type StoreExtensionContext,
  StoreExtensionProvider,
} from '@blocksuite/yunke-ext-loader';

import { FlowchartBlockSchemaExtension } from './flowchart-model.js';

export class FlowchartStoreExtension extends StoreExtensionProvider {
  override name = 'yunke-flowchart-block';

  override setup(context: StoreExtensionContext) {
    super.setup(context);
    context.register([FlowchartBlockSchemaExtension]);
  }
}

