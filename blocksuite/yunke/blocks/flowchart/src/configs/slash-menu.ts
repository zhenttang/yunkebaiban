import { focusBlockEnd } from '@blocksuite/yunke-shared/commands';
import { DocModeProvider } from '@blocksuite/yunke-shared/services';
import { type SlashMenuConfig } from '@blocksuite/yunke-widget-slash-menu';
import { html } from 'lit';

import { generateFlowchartOnEdgeless } from '../flowchart-generator-service.js';
import { DSL_EXAMPLES } from '../examples.js';

export const flowchartSlashMenuConfig: SlashMenuConfig = {
  items: [
    {
      name: 'Yunke Flow 图表',
      description: '使用 DSL 创建架构图、流程图、拓扑图',
      icon: html`<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 4h4v4H6V4zm8 0h4v4h-4V4zM6 12h4v4H6v-4zm8 0h4v4h-4v-4zM6 20h4v4H6v-4zm8 0h4v4h-4v-4z"/>
        <path d="M10 6h4v2h-4V6zm0 10h4v2h-4v-2zm6-8v4h2v-4h-2zm-8 0v4h2v-4H8z" opacity="0.6"/>
      </svg>`,
      group: '4_Content & Media@9',
      when: ({ model }) =>
        model.store.schema.flavourSchemaMap.has('yunke:flowchart'),
      action: ({ model, std }) => {
        // 检查当前模式
        const docMode = std.get(DocModeProvider).getEditorMode();
        
        if (docMode === 'edgeless') {
          // 🎯 白板模式：直接在画布上生成元素
          // 使用简单示例代码
          const exampleCode = DSL_EXAMPLES.simple.code;
          generateFlowchartOnEdgeless(std, exampleCode).catch(console.error);
        } else {
          // 📄 页面模式：创建传统的 flowchart 块
          const { store } = model;
          const parent = store.getParent(model);
          if (!parent) return;

          const index = parent.children.indexOf(model);
          if (index === -1) return;
          
          const defaultCode = `diagram "我的架构图" {
  node app label "应用"
  node db label "数据库"
  node cache label "缓存"
  
  app -> cache : "查询缓存"
  cache -> db : "缓存未命中"
  db -> cache : "返回数据"
  cache -> app : "返回结果"
}`;

          const blockId = store.addBlock(
            'yunke:flowchart',
            {},
            parent,
            index + 1
          );
          
          if (!blockId) return;
          
          // 获取创建的block并设置默认内容
          const block = store.getBlock(blockId);
          if (block) {
            // @ts-ignore - text$ 是动态属性
            const text = block.text$?.value;
            if (text) {
              text.insert(defaultCode, 0);
            }
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
        }
      },
    },
  ],
};

