import type { EditorHost } from '@blocksuite/yunke/std';

import {
  YUNKE_AI_PANEL_WIDGET,
  YunkeAIPanelWidget,
} from '../widgets/ai-panel/ai-panel';

export const getAIPanelWidget = (host: EditorHost): YunkeAIPanelWidget => {
  const rootBlockId = host.store.root?.id;
  if (!rootBlockId) {
    throw new Error('rootBlockId 未找到');
  }
  const aiPanel = host.view.getWidget(YUNKE_AI_PANEL_WIDGET, rootBlockId);
  if (!(aiPanel instanceof YunkeAIPanelWidget)) {
    throw new Error('AI 面板未找到');
  }
  return aiPanel;
};
