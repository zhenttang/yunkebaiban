import { focusBlockEnd } from '@blocksuite/affine-shared/commands';
import { type SlashMenuConfig } from '@blocksuite/affine-widget-slash-menu';
import { html } from 'lit';

export const excalidrawSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: 'Excalidraw 图表',
      description: '插入手绘风格的 Excalidraw 图表',
      icon: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>`,
      group: '4_Content & Media@10',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('affine:excalidraw'),
      action: ({ model, std }) => {
        const { store } = model;
        const parent = store.getParent(model);
        if (!parent) return;

        const index = parent.children.indexOf(model);
        if (index === -1) return;
        
        const blockId = store.addBlock(
          'affine:excalidraw',
          {
            data: '',
            src: '',
            title: '',
            width: '100%',
            align: 'center',
          },
          parent,
          index + 1
        );
        
        if (!blockId) return;
        std.host.updateComplete
          .then(() => {
            const block = std.view.getBlock(blockId);
            if (!block) return;
            std.command.exec(focusBlockEnd, {
              focusBlock: block,
            });
          })
          .catch(console.error);
      },
    },
  ],
};