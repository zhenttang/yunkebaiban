import { BlockService } from '@blocksuite/std';

import type { MermaidBlockModel } from './mermaid-model.js';

export class MermaidBlockService extends BlockService<MermaidBlockModel> {
  static override readonly flavour = 'yunke:mermaid';

  override mounted() {
    super.mounted();
    // 可以在这里添加服务初始化逻辑
  }

  /**
   * 插入默认的Mermaid图表
   */
  insertDefaultChart() {
    const defaultMermaidCode = `flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作]
    B -->|否| D[跳过]
    C --> E[结束]
    D --> E`;

    this.std.command
      .chain()
      .insertBlock('yunke:mermaid', {
        text: defaultMermaidCode,
      })
      .run();
  }

  /**
   * 更新图表代码
   */
  updateChart(blockId: string, code: string) {
    const block = this.std.store.getBlock(blockId);
    if (block && block.flavour === 'yunke:mermaid') {
      this.std.store.updateBlock(block, {
        text: code,
      });
    }
  }

  /**
   * 获取图表代码
   */
  getChartCode(blockId: string): string {
    const block = this.std.store.getBlock(blockId);
    if (block && block.flavour === 'yunke:mermaid') {
      return (block as MermaidBlockModel).props.text$.value.toString();
    }
    return '';
  }

  /**
   * 验证Mermaid代码
   */
  validateCode(code: string): { valid: boolean; error?: string } {
    try {
      // 这里可以添加更复杂的验证逻辑
      if (!code.trim()) {
        return { valid: false, error: '代码不能为空' };
      }
      
      // 基本语法检查
      const lines = code.trim().split('\n');
      const firstLine = lines[0].trim();
      
      const validStarters = [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram',
        'stateDiagram', 'erDiagram', 'journey', 'gitgraph',
        'pie', 'gantt', 'mindmap', 'timeline'
      ];
      
      const hasValidStarter = validStarters.some(starter => 
        firstLine.startsWith(starter)
      );
      
      if (!hasValidStarter) {
        return { 
          valid: false, 
          error: '代码应该以有效的Mermaid图表类型开始，如: flowchart, graph, sequenceDiagram等' 
        };
      }
      
      return { valid: true };
    } catch (error) {
      return { 
        valid: false, 
        error: error instanceof Error ? error.message : '未知错误' 
      };
    }
  }
}