import { getPreviewThemeExtension } from '@yunke/core/blocksuite/view-extensions/theme/preview-theme';
import { getThemeExtension } from '@yunke/core/blocksuite/view-extensions/theme/theme';
import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke/ext-loader';
import { FrameworkProvider } from '@toeverything/infra';
import { z } from 'zod';

const optionsSchema = z.object({
  framework: z.instanceof(FrameworkProvider).optional(),
});

type YunkeThemeViewOptions = z.infer<typeof optionsSchema>;

export class YunkeThemeViewExtension extends ViewExtensionProvider<YunkeThemeViewOptions> {
  override name = 'yunke-view-theme';

  override schema = optionsSchema;

  override setup(
    context: ViewExtensionContext,
    options?: YunkeThemeViewOptions
  ) {
    super.setup(context, options);
    const framework = options?.framework;
    if (!framework) {
      return;
    }

    if (this.isPreview(context.scope)) {
      context.register(getPreviewThemeExtension(framework));
    } else {
      context.register(getThemeExtension(framework));
    }
  }
}
