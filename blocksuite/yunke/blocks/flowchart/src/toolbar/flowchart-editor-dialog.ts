/**
 * 流程图编辑器对话框
 * 允许用户输入自定义 DSL 代码
 */

import { WithDisposable } from '@blocksuite/global/lit';
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { EdgelessRootBlockComponent } from '@blocksuite/yunke-block-root';

import { DSL_EXAMPLES, type DslExample } from '../examples.js';

@customElement('flowchart-editor-dialog')
export class FlowchartEditorDialog extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 9999;
    }

    :host([open]) {
      display: block;
    }

    .overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
    }

    .dialog {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 1200px;
      height: 80%;
      max-height: 800px;
      background: var(--affine-background-primary-color);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid var(--affine-border-color);
    }

    .header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .header-buttons {
      display: flex;
      gap: 8px;
    }

    .template-selector {
      padding: 12px 24px;
      background: var(--affine-background-secondary-color);
      border-bottom: 1px solid var(--affine-border-color);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .template-selector label {
      font-size: 14px;
      color: var(--affine-text-primary-color);
    }

    .template-selector select {
      flex: 1;
      max-width: 300px;
      padding: 6px 12px;
      border: 1px solid var(--affine-border-color);
      border-radius: 4px;
      background: var(--affine-background-primary-color);
      color: var(--affine-text-primary-color);
      font-size: 14px;
    }

    .content {
      flex: 1;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1px;
      background: var(--affine-border-color);
      overflow: hidden;
    }

    .editor-panel,
    .preview-panel {
      background: var(--affine-background-primary-color);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header {
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--affine-text-secondary-color);
      border-bottom: 1px solid var(--affine-border-color);
    }

    .editor-textarea {
      flex: 1;
      padding: 16px;
      border: none;
      resize: none;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 14px;
      line-height: 1.6;
      background: var(--affine-background-primary-color);
      color: var(--affine-text-primary-color);
      outline: none;
    }

    .preview-content {
      flex: 1;
      padding: 16px;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview-message {
      color: var(--affine-text-secondary-color);
      font-size: 14px;
    }

    .error-message {
      color: var(--affine-error-color);
      padding: 12px 16px;
      background: var(--affine-background-error-color);
      margin: 16px;
      border-radius: 4px;
      font-size: 14px;
    }

    .stats {
      padding: 8px 16px;
      font-size: 12px;
      color: var(--affine-text-secondary-color);
      border-top: 1px solid var(--affine-border-color);
    }

    button {
      padding: 8px 16px;
      border-radius: 6px;
      border: none;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .primary-button {
      background: var(--affine-primary-color);
      color: white;
      font-weight: 500;
    }

    .primary-button:hover {
      opacity: 0.9;
    }

    .primary-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .secondary-button {
      background: transparent;
      color: var(--affine-text-primary-color);
      border: 1px solid var(--affine-border-color);
    }

    .secondary-button:hover {
      background: var(--affine-hover-color);
    }
  `;

  @property({ attribute: false })
  accessor edgeless!: EdgelessRootBlockComponent;

  @property({ type: Boolean, reflect: true })
  accessor open = false;

  @state()
  private accessor _code = '';

  @state()
  private accessor _error = '';

  @state()
  private accessor _previewSvg = '';

  @state()
  private accessor _stats = { nodes: 0, edges: 0 };

  show(initialCode?: string) {
    this.open = true;
    this._code = initialCode || DSL_EXAMPLES.simple.code;
    this._updatePreview();
  }

  hide() {
    this.open = false;
    this._code = '';
    this._error = '';
    this._previewSvg = '';
  }

  private _handleCodeChange(e: Event) {
    const textarea = e.target as HTMLTextAreaElement;
    this._code = textarea.value;
    this._updatePreview();
  }

  private _handleTemplateChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    const exampleKey = select.value;
    if (exampleKey && DSL_EXAMPLES[exampleKey]) {
      this._code = DSL_EXAMPLES[exampleKey].code;
      this._updatePreview();
    }
  }

  private _updatePreview() {
    try {
      // 动态导入解析和渲染模块
      import('../dsl-parser.js').then(({ parseDSL }) => {
        return import('../svg-renderer.js').then(({ renderDiagramToSVG }) => {
          const diagram = parseDSL(this._code);
          const result = renderDiagramToSVG(diagram);
          this._previewSvg = result.svg;
          this._stats = {
            nodes: result.nodeCount,
            edges: result.edgeCount,
          };
          this._error = '';
        });
      }).catch(err => {
        this._error = err.message || '解析失败';
        this._previewSvg = '';
      });
    } catch (err) {
      this._error = err instanceof Error ? err.message : '未知错误';
      this._previewSvg = '';
    }
  }

  private _handleGenerate() {
    if (!this._code.trim()) {
      this._error = '请输入 DSL 代码';
      return;
    }

    // 生成到白板
    import('../element-generator.js').then(({ generateFlowchartAt }) => {
      const service = this.edgeless.service;
      const surface = service.surface;
      const viewport = service.viewport;
      
      const x = viewport.centerX;
      const y = viewport.centerY;
      
      return generateFlowchartAt(surface, this._code, x, y, service);
    }).then(result => {
      console.log('✅ 流程图已生成:', {
        节点数: result.nodeIds.size,
        连线数: result.edgeIds.length,
      });
      this.hide();
    }).catch(err => {
      this._error = '生成失败: ' + (err.message || err);
    });
  }

  private _handleOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('overlay')) {
      this.hide();
    }
  }

  override render() {
    return html`
      <div class="overlay" @click=${this._handleOverlayClick}>
        <div class="dialog" @click=${(e: Event) => e.stopPropagation()}>
          <!-- 头部 -->
          <div class="header">
            <h2>
              <span>🔀</span>
              <span>Yunke Flow 图表生成器</span>
            </h2>
            <div class="header-buttons">
              <button 
                class="primary-button" 
                @click=${this._handleGenerate}
                ?disabled=${!this._code.trim()}
              >
                生成到白板
              </button>
              <button class="secondary-button" @click=${() => this.hide()}>
                取消
              </button>
            </div>
          </div>

          <!-- 模板选择 -->
          <div class="template-selector">
            <label>💡 快速开始:</label>
            <select @change=${this._handleTemplateChange}>
              <option value="">选择示例模板...</option>
              ${Object.entries(DSL_EXAMPLES).map(([key, example]) => html`
                <option value=${key}>${example.name}</option>
              `)}
            </select>
          </div>

          <!-- 编辑器和预览 -->
          <div class="content">
            <!-- 左侧：代码编辑器 -->
            <div class="editor-panel">
              <div class="panel-header">DSL 代码</div>
              <textarea
                class="editor-textarea"
                .value=${this._code}
                @input=${this._handleCodeChange}
                placeholder="输入 Yunke Flow DSL 代码..."
                spellcheck="false"
              ></textarea>
              ${this._stats.nodes > 0 ? html`
                <div class="stats">
                  ${this._stats.nodes} 个节点 · ${this._stats.edges} 条连线
                </div>
              ` : ''}
            </div>

            <!-- 右侧：预览 -->
            <div class="preview-panel">
              <div class="panel-header">预览</div>
              ${this._error ? html`
                <div class="error-message">❌ ${this._error}</div>
              ` : ''}
              <div class="preview-content">
                ${this._previewSvg 
                  ? html`<div .innerHTML=${this._previewSvg}></div>`
                  : html`<div class="preview-message">预览将显示在这里</div>`
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'flowchart-editor-dialog': FlowchartEditorDialog;
  }
}

