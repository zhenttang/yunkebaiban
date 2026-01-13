import { toolbarAIEntryConfig } from '@yunke/core/blocksuite/ai';
import { AIChatBlockSpec } from '@yunke/core/blocksuite/ai/blocks';
import { AITranscriptionBlockSpec } from '@yunke/core/blocksuite/ai/blocks/ai-chat-block/ai-transcription-block';
import { edgelessToolbarAIEntryConfig } from '@yunke/core/blocksuite/ai/entries/edgeless';
import { imageToolbarAIEntryConfig } from '@yunke/core/blocksuite/ai/entries/image-toolbar/setup-image-toolbar';
import { AICodeBlockWatcher } from '@yunke/core/blocksuite/ai/extensions/ai-code';
import { getAIEdgelessRootWatcher } from '@yunke/core/blocksuite/ai/extensions/ai-edgeless-root';
import { getAIPageRootWatcher } from '@yunke/core/blocksuite/ai/extensions/ai-page-root';
import { AiSlashMenuConfigExtension } from '@yunke/core/blocksuite/ai/extensions/ai-slash-menu';
import { CopilotTool } from '@yunke/core/blocksuite/ai/tool/copilot-tool';
import { aiPanelWidget } from '@yunke/core/blocksuite/ai/widgets/ai-panel/ai-panel';
import { edgelessCopilotWidget } from '@yunke/core/blocksuite/ai/widgets/edgeless-copilot';
import {
  type ViewExtensionContext,
  ViewExtensionProvider,
} from '@blocksuite/yunke/ext-loader';
import { ToolbarModuleExtension } from '@blocksuite/yunke/shared/services';
import { BlockFlavourIdentifier } from '@blocksuite/yunke/std';
import { FrameworkProvider } from '@toeverything/infra';
import { z } from 'zod';

import { EdgelessClipboardAIChatConfig } from './edgeless-clipboard';

const optionsSchema = z.object({
  enable: z.boolean().optional(),
  framework: z.instanceof(FrameworkProvider).optional(),
});

type AIViewOptions = z.infer<typeof optionsSchema>;

export class AIViewExtension extends ViewExtensionProvider<AIViewOptions> {
  override name = 'yunke-ai-view-extension';

  override schema = optionsSchema;

  override setup(context: ViewExtensionContext, options?: AIViewOptions) {
    super.setup(context, options);
    if (!options?.enable) return;
    const framework = options.framework;
    if (!framework) return;

    context
      .register(AIChatBlockSpec)
      .register(AITranscriptionBlockSpec)
      .register(EdgelessClipboardAIChatConfig)
      .register(AICodeBlockWatcher)
      .register(
        ToolbarModuleExtension({
          id: BlockFlavourIdentifier('custom:yunke:image'),
          config: imageToolbarAIEntryConfig(),
        })
      );
    if (context.scope === 'edgeless' || context.scope === 'page') {
      context.register([
        aiPanelWidget,
        AiSlashMenuConfigExtension(),
        ToolbarModuleExtension({
          id: BlockFlavourIdentifier('custom:yunke:note'),
          config: toolbarAIEntryConfig(),
        }),
      ]);
    }
    if (context.scope === 'edgeless') {
      context.register([
        CopilotTool,
        edgelessCopilotWidget,
        getAIEdgelessRootWatcher(framework),
        // In note
        ToolbarModuleExtension({
          id: BlockFlavourIdentifier('custom:yunke:surface:*'),
          config: edgelessToolbarAIEntryConfig(),
        }),
      ]);
    }
    if (context.scope === 'page') {
      context.register(getAIPageRootWatcher(framework));
    }
  }
}
