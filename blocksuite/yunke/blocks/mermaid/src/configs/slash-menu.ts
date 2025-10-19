import { focusBlockEnd } from '@blocksuite/yunke-shared/commands';
import { type SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';
import { html } from 'lit';

export const mermaidSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: 'Mermaid 图表',
      description: '插入 Mermaid 流程图、序列图等',
      icon: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>`,
      group: '4_Content & Media@8',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('yunke:mermaid'),
      action: ({ model, std }) => {
        const { store } = model;
        const parent = store.getParent(model);
        if (!parent) return;

        const index = parent.children.indexOf(model);
        if (index === -1) return;
        
        const defaultCode = `flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作]
    B -->|否| D[跳过]
    C --> E[结束]
    D --> E`;

        const blockId = store.addBlock(
          'yunke:mermaid',
          {},
          parent,
          index + 1
        );
        
        if (!blockId) return;
        
        // 获取创建的block并设置默认内容
        const block = store.getBlock(blockId);
        if (block) {
          block.props.text$.insert(0, defaultCode);
        }
        
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