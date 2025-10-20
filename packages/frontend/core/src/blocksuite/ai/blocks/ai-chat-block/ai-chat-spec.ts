import { BlockViewExtension } from '@blocksuite/yunke/std';
import type { ExtensionType } from '@blocksuite/yunke/store';
import { literal } from 'lit/static-html.js';

export const AIChatBlockSpec: ExtensionType[] = [
  BlockViewExtension('yunke:embed-ai-chat', model => {
    const parent = model.store.getParent(model.id);

    if (parent?.flavour === 'yunke:surface') {
      return literal`yunke-edgeless-ai-chat`;
    }

    return literal`yunke-ai-chat`;
  }),
];
