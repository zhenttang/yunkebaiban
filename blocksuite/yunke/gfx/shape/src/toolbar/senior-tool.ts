import { SeniorToolExtension } from '@blocksuite/yunke-widget-edgeless-toolbar';
import { html } from 'lit';

export const shapeSeniorTool = SeniorToolExtension(
  'shape',
  ({ block, toolbarContainer }) => {
    return {
      name: '形状',
      content: html`<edgeless-shape-tool-button
        .edgeless=${block}
        .toolbarContainer=${toolbarContainer}
      ></edgeless-shape-tool-button>`,
    };
  }
);
