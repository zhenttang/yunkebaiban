/**
 * 流程图编辑器对话框
 * 允许用户输入自定义 DSL 代码
 */

import { WithDisposable } from '@blocksuite/global/lit';
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { EdgelessRootBlockComponent } from '@blocksuite/yunke-block-root';

import { DSL_EXAMPLES } from '../examples.js';

@customElement('flowchart-editor-dialog')
export class FlowchartEditorDialog extends WithDisposable(LitElement) {
  static override styles = css`
    :host {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 99999;
      pointer-events: none;
    }

    :host([open]) {
      display: block;
      pointer-events: auto;
    }

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    .dialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 90%;
      max-width: 1200px;
      height: 85%;
      max-height: 800px;
      background: var(--affine-background-primary-color, #ffffff);
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 1;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      background: var(--affine-background-primary-color, #ffffff);
      border-bottom: 1px solid var(--affine-border-color, #e3e2e4);
    }

    .header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--affine-text-primary-color, #1e1e1e);
    }

    .header-buttons {
      display: flex;
      gap: 8px;
    }

    .template-selector {
      padding: 12px 24px;
      background: var(--affine-background-secondary-color, #f8f9fa);
      border-bottom: 1px solid var(--affine-border-color, #e3e2e4);
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .template-selector label {
      font-size: 14px;
      color: var(--affine-text-primary-color, #1e1e1e);
      white-space: nowrap;
    }

    .template-selector select {
      flex: 1;
      max-width: 300px;
      padding: 6px 12px;
      border: 1px solid var(--affine-border-color, #e3e2e4);
      border-radius: 6px;
      background: var(--affine-background-primary-color, #ffffff);
      color: var(--affine-text-primary-color, #1e1e1e);
      font-size: 14px;
      cursor: pointer;
      outline: none;
    }

    .template-selector select:hover {
      border-color: var(--affine-primary-color, #1e96eb);
    }

    .template-selector select:focus {
      border-color: var(--affine-primary-color, #1e96eb);
      box-shadow: 0 0 0 2px rgba(30, 150, 235, 0.1);
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
      background: var(--affine-background-primary-color, #ffffff);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .panel-header {
      padding: 12px 16px;
      font-size: 14px;
      font-weight: 500;
      color: var(--affine-text-secondary-color, #8e8d91);
      background: var(--affine-background-secondary-color, #f8f9fa);
      border-bottom: 1px solid var(--affine-border-color, #e3e2e4);
    }

    .editor-textarea {
      flex: 1;
      padding: 16px;
      border: none;
      resize: none;
      font-family: 'Monaco', 'Menlo', 'Consolas', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
      background: var(--affine-background-primary-color, #ffffff);
      color: var(--affine-text-primary-color, #1e1e1e);
      outline: none;
      tab-size: 2;
    }

    .preview-content {
      flex: 1;
      padding: 20px;
      overflow: auto;
      background: var(--affine-background-primary-color, #ffffff);
    }

    .preview-content > div {
      width: 100%;
      min-width: min-content;
      min-height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .preview-content svg {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      display: block;
      margin: 0 auto;
    }

    .preview-message {
      color: var(--affine-text-secondary-color);
      font-size: 14px;
      width: 100%;
      text-align: center;
      padding: 40px 20px;
    }

    .error-message {
      color: #d32f2f;
      padding: 12px 16px;
      background: #ffebee;
      margin: 16px;
      border-radius: 8px;
      font-size: 14px;
      border-left: 4px solid #d32f2f;
    }

    .stats {
      padding: 10px 16px;
      font-size: 12px;
      color: var(--affine-text-secondary-color, #8e8d91);
      background: var(--affine-background-secondary-color, #f8f9fa);
      border-top: 1px solid var(--affine-border-color, #e3e2e4);
    }

    button {
      padding: 10px 20px;
      border-radius: 8px;
      border: none;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
      white-space: nowrap;
    }

    .primary-button {
      background: var(--affine-primary-color, #1e96eb);
      color: white;
      box-shadow: 0 2px 4px rgba(30, 150, 235, 0.2);
    }

    .primary-button:hover {
      background: var(--affine-primary-color, #1e96eb);
      opacity: 0.9;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(30, 150, 235, 0.3);
    }

    .primary-button:active {
      transform: translateY(0);
    }

    .primary-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .secondary-button {
      background: var(--affine-background-primary-color, #ffffff);
      color: var(--affine-text-primary-color, #1e1e1e);
      border: 1px solid var(--affine-border-color, #e3e2e4);
    }

    .secondary-button:hover {
      background: var(--affine-background-secondary-color, #f8f9fa);
      border-color: var(--affine-border-color, #d0d0d0);
    }

    .secondary-button:active {
      background: var(--affine-background-secondary-color, #e8e9ea);
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
      // 检测是否使用新图表系统
      const isNewSystem = this._code.includes('type "layered"') || 
                         this._code.includes('type "tree"') ||
                         this._code.includes('type "er"') ||
                         this._code.includes('layer ') ||
                         this._code.includes('root "');
      
      if (isNewSystem) {
        // 使用新的图表系统
        import('../diagram-system.js').then(({ DiagramEngine }) => {
          DiagramEngine.generate(this._code).then(result => {
            this._previewSvg = result.render.content as string;
            this._stats = {
              nodes: result.model.elements.filter(e => e.type === 'node').length,
              edges: result.model.relationships.length,
            };
            this._error = '';
          }).catch(err => {
            this._error = err.message || '渲染失败';
            this._previewSvg = '';
          });
        }).catch(err => {
          this._error = err.message || '导入失败';
          this._previewSvg = '';
        });
      } else {
        // 使用旧系统（向后兼容）
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
      }
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

    const service = this.edgeless.service;
    const surface = service.surface;
    const viewport = service.viewport;
    
    const centerX = viewport.centerX;
    const centerY = viewport.centerY;

    // 检测是否使用新图表系统
    const isNewSystem = this._code.includes('type "layered"') || 
                       this._code.includes('type "tree"') ||
                       this._code.includes('type "er"') ||
                       this._code.includes('layer ') ||
                       this._code.includes('root "');
    
    if (isNewSystem) {
      // 使用新图表系统生成
      Promise.all([
        import('../diagram-system.js'),
        import('../renderers/edgeless-renderer.js')
      ]).then(([{ DiagramEngine }, { generateDiagramToEdgeless }]) => {
        // 1. 解析DSL
        const model = DiagramEngine.parse(this._code);
        
        // 2. 计算布局
        return import('../core/base-layout.js').then(({ LayoutRegistry }) => {
          const layout = LayoutRegistry.layoutAuto(model);
          
          // 3. 生成到白板
          return generateDiagramToEdgeless(surface, layout, centerX, centerY, service);
        });
      }).then(result => {
        console.log('✅ 图表已生成到白板:', {
          层数: result.layerIds.length,
          节点数: result.nodeIds.length,
          连线数: result.edgeIds.length,
        });
        this.hide();
      }).catch(err => {
        console.error('生成失败:', err);
        this._error = '生成失败: ' + (err.message || err);
      });
    } else {
      // 使用旧系统（流程图）
      import('../element-generator.js').then(({ generateFlowchartAt }) => {
        return generateFlowchartAt(surface, this._code, centerX, centerY, service);
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

