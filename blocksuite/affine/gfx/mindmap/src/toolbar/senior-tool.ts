import { SeniorToolExtension } from '@blocksuite/affine-widget-edgeless-toolbar';
import { html } from 'lit';

export const mindMapSeniorTool = SeniorToolExtension(
  'mindMap',
  ({ block, toolbarContainer }) => {
    return {
      name: '思维导图',
      content: html`<edgeless-mindmap-tool-button
        .edgeless=${block}
        .toolbarContainer=${toolbarContainer}
      ></edgeless-mindmap-tool-button>`,
    };
  }
);
