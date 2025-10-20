/**
 * 响应式布局组件演示
 * 
 * 展示集成了响应式功能的LayoutSwitcher和ColumnContent组件
 * 为开发者B2和B3提供完整的集成示例
 */

import { LitElement, html, css, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { PageLayoutMode, Block, LayoutModeChangeEvent, BlockMoveEvent } from '../types/component-contracts.js';

/**
 * 响应式布局演示组件
 */
@customElement('responsive-layout-demo')
export class ResponsiveLayoutDemo extends LitElement {
  @property({ type: String })
  docId = 'demo-doc';
  
  @state()
  private currentMode: PageLayoutMode = PageLayoutMode.Normal;
  
  @state()
  private columnBlocks: Block[][] = [
    [
      { id: 'block-1', flavour: 'yunke:paragraph', text: '这是第一个段落内容，展示响应式布局的基础功能。' },
      { id: 'block-2', flavour: 'yunke:heading', text: '标题示例', props: { level: 2 } },
      { id: 'block-3', flavour: 'yunke:code', text: 'console.log("响应式布局");' },
    ],
    [
      { id: 'block-4', flavour: 'yunke:paragraph', text: '第二列的内容，会根据设备尺寸自动调整。' },
      { id: 'block-5', flavour: 'yunke:image', text: '图片块', properties: { height: 200 } },
    ],
    [
      { id: 'block-6', flavour: 'yunke:paragraph', text: '第三列内容，在移动端会自动折叠到单列显示。' },
    ],
    [],
    []
  ];

  static styles = css`
    :host {
      display: block;
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .demo-header {
      margin-bottom: 20px;
      padding: 16px;
      background: var(--yunke-background-secondary-color);
      border-radius: 8px;
      border: 1px solid var(--yunke-border-color);
    }

    .demo-title {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: var(--yunke-text-primary-color);
    }

    .demo-description {
      color: var(--yunke-text-secondary-color);
      line-height: 1.5;
      margin: 0;
    }

    .layout-controls {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding: 12px;
      background: var(--yunke-background-primary-color);
      border: 1px solid var(--yunke-border-color);
      border-radius: 8px;
    }

    .control-label {
      font-weight: 500;
      color: var(--yunke-text-primary-color);
    }

    .layout-container {
      display: grid;
      gap: 16px;
      min-height: 400px;
      border: 1px solid var(--yunke-border-color);
      border-radius: 8px;
      padding: 16px;
      background: var(--yunke-background-primary-color);
      container-type: inline-size;
      container-name: layout-container;
    }

    .layout-container.normal {
      grid-template-columns: 1fr;
    }

    .layout-container.two-column {
      grid-template-columns: 1fr 1fr;
    }

    .layout-container.three-column {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .layout-container.four-column {
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }

    .layout-container.five-column {
      grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
    }

    /* 响应式容器查询 */
    @container layout-container (max-width: 768px) {
      .layout-container {
        grid-template-columns: 1fr !important;
        gap: 12px;
      }
    }

    @container layout-container (min-width: 769px) and (max-width: 1024px) {
      .layout-container.three-column,
      .layout-container.four-column,
      .layout-container.five-column {
        grid-template-columns: 1fr 1fr !important;
      }
    }

    .demo-footer {
      margin-top: 20px;
      padding: 12px;
      background: var(--yunke-background-secondary-color);
      border-radius: 8px;
      font-size: 14px;
      color: var(--yunke-text-secondary-color);
      text-align: center;
    }

    /* 移动端优化 */
    @media (max-width: 768px) {
      :host {
        padding: 12px;
      }
      
      .layout-controls {
        flex-direction: column;
        align-items: stretch;
        gap: 8px;
      }
    }
  `;

  override render(): TemplateResult {
    const layoutClass = this.currentMode.replace('-', '-');
    
    return html`
      <div class="demo-header">
        <h1 class="demo-title">🎨 响应式布局组件演示</h1>
        <p class="demo-description">
          此演示展示了集成响应式功能的 LayoutSwitcher 和 ColumnContent 组件。
          尝试调整浏览器窗口大小或切换布局模式来查看响应式效果。
        </p>
      </div>

      <div class="layout-controls">
        <span class="control-label">布局控制:</span>
        <layout-switcher
          .docId=${this.docId}
          .currentMode=${this.currentMode}
          .enableResponsive=${true}
          .showBreakpointIndicator=${true}
          @mode-changed=${this.handleModeChanged}
          @responsive-change=${this.handleResponsiveChange}
        ></layout-switcher>
      </div>

      <div class="layout-container ${layoutClass}">
        ${this.renderColumns()}
      </div>

      <div class="demo-footer">
        💡 <strong>提示:</strong> 该演示使用了开发者C2的响应式系统，并集成了开发者A2的Mock数据服务。
        当前模式: <strong>${this.getModeName(this.currentMode)}</strong>
      </div>
    `;
  }

  private renderColumns(): TemplateResult[] {
    const columnCount = this.getColumnCount(this.currentMode);
    const columns: TemplateResult[] = [];

    for (let i = 0; i < columnCount; i++) {
      columns.push(html`
        <column-content
          .columnIndex=${i}
          .blocks=${this.columnBlocks[i] || []}
          .title=${'列 ' + (i + 1)}
          .allowDrop=${true}
          .showStats=${true}
          .enableResponsive=${true}
          @block-move=${this.handleBlockMove}
          @responsive-change=${this.handleColumnResponsiveChange}
        ></column-content>
      `);
    }

    return columns;
  }

  private getColumnCount(mode: PageLayoutMode): number {
    switch (mode) {
      case PageLayoutMode.Normal: return 1;
      case PageLayoutMode.TwoColumn: return 2;
      case PageLayoutMode.ThreeColumn: return 3;
      case PageLayoutMode.FourColumn: return 4;
      case PageLayoutMode.FiveColumn: return 5;
      default: return 1;
    }
  }

  private getModeName(mode: PageLayoutMode): string {
    switch (mode) {
      case PageLayoutMode.Normal: return '单列';
      case PageLayoutMode.TwoColumn: return '双列';
      case PageLayoutMode.ThreeColumn: return '三列';
      case PageLayoutMode.FourColumn: return '四列';
      case PageLayoutMode.FiveColumn: return '五列';
      default: return '单列';
    }
  }

  private handleModeChanged = (event: CustomEvent<LayoutModeChangeEvent>) => {
    console.log('🔄 布局模式切换:', event.detail);
    this.currentMode = event.detail.currentMode;
    
    // 重新分配块到新的列数
    this.redistributeBlocks();
  };

  private handleResponsiveChange = (event: CustomEvent) => {
    console.log('📱 LayoutSwitcher 响应式变化:', event.detail);
  };

  private handleColumnResponsiveChange = (event: CustomEvent) => {
    console.log('📱 ColumnContent 响应式变化:', event.detail);
  };

  private handleBlockMove = (event: CustomEvent<BlockMoveEvent>) => {
    console.log('🔄 Block移动:', event.detail);
    
    const { blockId, fromColumn, toColumn, fromIndex, toIndex } = event.detail;
    
    // 从源列移除
    if (this.columnBlocks[fromColumn] && this.columnBlocks[fromColumn][fromIndex]) {
      const block = this.columnBlocks[fromColumn].splice(fromIndex, 1)[0];
      
      // 添加到目标列
      if (!this.columnBlocks[toColumn]) {
        this.columnBlocks[toColumn] = [];
      }
      this.columnBlocks[toColumn].splice(toIndex, 0, block);
      
      // 触发重新渲染
      this.requestUpdate();
    }
  };

  private redistributeBlocks(): void {
    // 收集所有现有的块
    const allBlocks: Block[] = [];
    this.columnBlocks.forEach(column => allBlocks.push(...column));

    // 清空现有列
    this.columnBlocks = [[], [], [], [], []];

    // 重新分配到新的列数
    const newColumnCount = this.getColumnCount(this.currentMode);
    allBlocks.forEach((block, index) => {
      const targetColumn = index % newColumnCount;
      this.columnBlocks[targetColumn].push(block);
    });

    // 触发重新渲染
    this.requestUpdate();
  }
}

// 类型声明
declare global {
  interface HTMLElementTagNameMap {
    'responsive-layout-demo': ResponsiveLayoutDemo;
  }
}