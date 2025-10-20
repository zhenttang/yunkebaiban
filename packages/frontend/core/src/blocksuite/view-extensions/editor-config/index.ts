import { getEditorConfigExtension } from '@yunke/core/blocksuite/view-extensions/editor-config/get-config';
import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke/ext-loader';
import { FrameworkProvider } from '@toeverything/infra';
import { z } from 'zod';

const optionsSchema = z.object({
  framework: z.instanceof(FrameworkProvider).optional(),
});

type YunkeEditorConfigViewOptions = z.infer<typeof optionsSchema>;

export class YunkeEditorConfigViewExtension extends ViewExtensionProvider<YunkeEditorConfigViewOptions> {
  override name = 'yunke-view-editor-config';

  override schema = optionsSchema;

  override setup(
    context: ViewExtensionContext,
    options?: YunkeEditorConfigViewOptions
  ) {
    super.setup(context, options);
    const framework = options?.framework;
    if (!framework) {
      return;
    }

    if (context.scope === 'edgeless' || context.scope === 'page') {
      context.register(getEditorConfigExtension(framework));
    }
  }
}
