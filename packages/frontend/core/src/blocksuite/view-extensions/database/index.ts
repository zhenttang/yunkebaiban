import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke/ext-loader';
import { z } from 'zod';

import { patchDatabaseBlockConfigService } from './database-block-config-service';

const optionsSchema = z.object({});

export type YunkeDatabaseViewOptions = z.infer<typeof optionsSchema>;

export class YunkeDatabaseViewExtension extends ViewExtensionProvider<YunkeDatabaseViewOptions> {
  override name = 'yunke-database-view';

  override schema = optionsSchema;

  override setup(
    context: ViewExtensionContext,
    options?: YunkeDatabaseViewOptions
  ) {
    super.setup(context, options);

    context.register(patchDatabaseBlockConfigService());
  }
}
