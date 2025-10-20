import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke/ext-loader';
import { FrameworkProvider } from '@toeverything/infra';
import { z } from 'zod';

import { patchLinkPreviewService } from './link-preview-service';

const optionsSchema = z.object({
  framework: z.instanceof(FrameworkProvider).optional(),
});

type YunkeLinkPreviewViewOptions = z.infer<typeof optionsSchema>;

export class YunkeLinkPreviewExtension extends ViewExtensionProvider<YunkeLinkPreviewViewOptions> {
  override name = 'yunke-link-preview-extension';

  override schema = optionsSchema;

  override setup(
    context: ViewExtensionContext,
    options?: YunkeLinkPreviewViewOptions
  ) {
    super.setup(context, options);
    if (!options?.framework) {
      return;
    }
    const { framework } = options;
    context.register(patchLinkPreviewService(framework));
  }
}
