import { FeatureFlagService } from '@affine/core/modules/feature-flag';
import track from '@affine/track';
import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/affine/ext-loader';
import { FrameworkProvider } from '@toeverything/infra';
import { z } from 'zod';

import {
  CodeBlockHtmlPreview,
  effects as htmlPreviewEffects,
} from './html-preview';

const optionsSchema = z.object({
  framework: z.instanceof(FrameworkProvider).optional(),
});

export class CodeBlockPreviewViewExtension extends ViewExtensionProvider {
  override name = 'code-block-preview';

  override schema = optionsSchema;

  override effect() {
    super.effect();

    htmlPreviewEffects();
  }

  override setup(
    context: ViewExtensionContext,
    options?: z.infer<typeof optionsSchema>
  ) {
    super.setup(context, options);

    const framework = options?.framework;
    if (!framework) return;
    const flag =
      framework.get(FeatureFlagService).flags.enable_code_block_html_preview.$
        .value;
    if (!flag) return;

    if (!window.crossOriginIsolated) {
      track.doc.editor.codeBlock.htmlBlockPreviewFailed({
        type: 'cross-origin-isolated not supported',
      });

      return;
    }

    context.register(CodeBlockHtmlPreview);
  }
}
