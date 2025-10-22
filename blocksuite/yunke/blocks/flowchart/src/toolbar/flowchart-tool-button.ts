/**
 * 流程图生成工具按钮
 * 显示在白板底部工具栏
 */

import { WithDisposable } from '@blocksuite/global/lit';
import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { EdgelessRootBlockComponent } from '@blocksuite/yunke-block-root';

import { DSL_EXAMPLES } from '../examples.js';
import './flowchart-editor-dialog.js';
import type { FlowchartEditorDialog } from './flowchart-editor-dialog.js';

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

  private _editorDialog: FlowchartEditorDialog | null = null;

  private _getOrCreateDialog(): FlowchartEditorDialog {
    // 如果对话框已存在，直接返回
    if (this._editorDialog && document.body.contains(this._editorDialog)) {
      return this._editorDialog;
    }

    // 创建新的对话框并挂载到 body
    const dialog = document.createElement('flowchart-editor-dialog') as FlowchartEditorDialog;
    dialog.edgeless = this.edgeless;
    document.body.appendChild(dialog);
    this._editorDialog = dialog;

    return dialog;
  }

  private _handleClick = () => {
    // 获取或创建对话框
    const dialog = this._getOrCreateDialog();
    // 打开对话框，传入初始代码
    dialog.show(DSL_EXAMPLES.simple.code);
  };

  override disconnectedCallback() {
    super.disconnectedCallback();
    // 清理：移除挂载到 body 的对话框
    if (this._editorDialog && document.body.contains(this._editorDialog)) {
      document.body.removeChild(this._editorDialog);
      this._editorDialog = null;
    }
  }

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

