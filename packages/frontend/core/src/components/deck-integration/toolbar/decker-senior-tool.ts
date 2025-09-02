import { SeniorToolExtension } from '@blocksuite/affine-widget-edgeless-toolbar';
import { html } from 'lit';

export const deckerSeniorTool = SeniorToolExtension(
  'decker',
  ({ block }) => {
    return {
      name: 'Decker',
      content: html`<edgeless-decker-button .edgeless=${block}>
      </edgeless-decker-button>`,
    };
  }
);