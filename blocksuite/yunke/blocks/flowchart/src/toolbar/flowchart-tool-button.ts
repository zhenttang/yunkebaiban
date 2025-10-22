/**
 * 流程图生成工具按钮
 * 显示在白板底部工具栏
 */

import { WithDisposable } from '@blocksuite/global/lit';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { EdgelessRootBlockComponent } from '@blocksuite/yunke-block-root';

import { generateFlowchartOnEdgeless } from '../flowchart-generator-service.js';
import { DSL_EXAMPLES } from '../examples.js';

@customElement('flowchart-tool-button')
export class FlowchartToolButton extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .flowchart-button {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      background: transparent;
      border: none;
      color: var(--affine-icon-color);
    }

    .flowchart-button:hover {
      background: var(--affine-hover-color);
    }

    .flowchart-button:active {
      background: var(--affine-hover-color-filled);
    }

    .flowchart-button svg {
      width: 20px;
      height: 20px;
    }
  `;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  private _handleClick = () => {
    // 使用简单示例生成流程图
    const exampleCode = DSL_EXAMPLES.simple.code;
    
    // 直接从 edgeless 组件获取 service 和 surface
    const service = this.edgeless.service;
    if (!service || !service.surface) {
      console.error('无法获取 Surface');
      return;
    }
    
    const surface = service.surface;
    const viewport = service.viewport;
    
    // 在视口中心生成
    const x = viewport.centerX;
    const y = viewport.centerY;
    
    // 使用低级 API 直接生成
    import('../element-generator.js').then(({ generateFlowchartAt }) => {
      return generateFlowchartAt(surface, exampleCode, x, y, service);
    }).then(result => {
      console.log('✅ 流程图已生成:', {
        节点数: result.nodeIds.size,
        连线数: result.edgeIds.length,
      });
    }).catch(err => {
      console.error('生成流程图失败:', err);
    });
  };

  override render() {
    return html`
      <button
        class="flowchart-button"
        @click=${this._handleClick}
        title="生成流程图 (Flowchart)"
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <!-- 流程图图标 -->
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          
          <!-- 连接线 -->
          <path d="M10 6.5 h4" stroke="currentColor" stroke-width="1.5" fill="none" />
          <path d="M6.5 10 v4" stroke="currentColor" stroke-width="1.5" fill="none" />
          <path d="M17.5 10 v4" stroke="currentColor" stroke-width="1.5" fill="none" />
          
          <!-- 箭头 -->
          <path d="M13,6 l1,0.5 l-1,0.5" stroke="currentColor" stroke-width="1" fill="none" />
          <path d="M6,13 l0.5,1 l0.5,-1" stroke="currentColor" stroke-width="1" fill="none" />
          <path d="M17,13 l0.5,1 l0.5,-1" stroke="currentColor" stroke-width="1" fill="none" />
        </svg>
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flowchart-tool-button': FlowchartToolButton;
  }
}

