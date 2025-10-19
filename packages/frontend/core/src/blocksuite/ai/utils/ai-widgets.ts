import type { EditorHost } from '@blocksuite/yunke/std';

import {
  AFFINE_AI_PANEL_WIDGET,
  AffineAIPanelWidget,
} from '../widgets/ai-panel/ai-panel';

export const getAIPanelWidget = (host: EditorHost): AffineAIPanelWidget => {
  const rootBlockId = host.store.root?.id;
  if (!rootBlockId) {
    throw new Error('rootBlockId 未找到');
  }
  const aiPanel = host.view.getWidget(AFFINE_AI_PANEL_WIDGET, rootBlockId);
  if (!(aiPanel instanceof AffineAIPanelWidget)) {
    throw new Error('AI 面板未找到');
  }
  return aiPanel;
};
