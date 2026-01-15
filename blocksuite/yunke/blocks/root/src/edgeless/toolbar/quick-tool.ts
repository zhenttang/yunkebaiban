import { QuickToolExtension } from '@blocksuite/yunke-widget-edgeless-toolbar';
import { html } from 'lit';

export const edgelessSearchQuickTool = QuickToolExtension(
  'search',
  ({ block }) => ({
    priority: 70,
    content: html`<edgeless-search-tool-button
      .edgeless=${block}
    ></edgeless-search-tool-button>`,
  })
);
