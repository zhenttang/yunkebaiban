/**
 * 流程图工具栏快捷工具扩展
 */

import { QuickToolExtension } from '@blocksuite/yunke-widget-edgeless-toolbar';
import { html } from 'lit';

import './flowchart-tool-button.js';

export const FlowchartQuickTool = QuickToolExtension('flowchart', ({ block }) => {
  return {
    priority: 85, // 在其他工具之后显示
    type: 'flowchart',
    content: html`<flowchart-tool-button
      .edgeless=${block}
    ></flowchart-tool-button>`,
  };
});

