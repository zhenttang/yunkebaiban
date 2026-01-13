import { toReactNode } from '@yunke/component';
import { AIChatBlockPeekViewTemplate } from '@yunke/core/blocksuite/ai';
import type { AIChatBlockModel } from '@yunke/core/blocksuite/ai/blocks/ai-chat-block/model/ai-chat-model';
import { useAIChatConfig } from '@yunke/core/components/hooks/yunke/use-ai-chat-config';
import { FeatureFlagService } from '@yunke/core/modules/feature-flag';
import type { EditorHost } from '@blocksuite/yunke/std';
import { useFramework } from '@toeverything/infra';
import { useMemo } from 'react';

export type AIChatBlockPeekViewProps = {
  model: AIChatBlockModel;
  host: EditorHost;
};

export const AIChatBlockPeekView = ({
  model,
  host,
}: AIChatBlockPeekViewProps) => {
  const {
    docDisplayConfig,
    searchMenuConfig,
    networkSearchConfig,
    reasoningConfig,
  } = useAIChatConfig();

  const framework = useFramework();
  const yunkeFeatureFlagService = framework.get(FeatureFlagService);

  return useMemo(() => {
    const template = AIChatBlockPeekViewTemplate(
      model,
      host,
      docDisplayConfig,
      searchMenuConfig,
      networkSearchConfig,
      reasoningConfig,
      yunkeFeatureFlagService
    );
    return toReactNode(template);
  }, [
    model,
    host,
    docDisplayConfig,
    searchMenuConfig,
    networkSearchConfig,
    reasoningConfig,
    yunkeFeatureFlagService,
  ]);
};
