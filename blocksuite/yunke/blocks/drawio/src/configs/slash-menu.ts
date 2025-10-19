import { focusBlockEnd } from '@blocksuite/yunke-shared/commands';
import { type SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';
import { html } from 'lit';

export const drawioSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: 'Draw.io 图表',
      description: '插入可编辑的 Draw.io 流程图、架构图等',
      icon: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
      </svg>`,
      group: '4_Content & Media@9',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('yunke:drawio'),
      action: ({ model, std }) => {
        const { store } = model;
        const parent = store.getParent(model);
        if (!parent) return;

        const index = parent.children.indexOf(model);
        if (index === -1) return;
        
        const blockId = store.addBlock(
          'yunke:drawio',
          {
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