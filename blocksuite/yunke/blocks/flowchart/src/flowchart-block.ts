import { CaptionedBlockComponent } from '@blocksuite/yunke-components/caption';
import {
  EDGELESS_TOP_CONTENTEDITABLE_SELECTOR,
} from '@blocksuite/yunke-shared/consts';
import {
  DocModeProvider,
  NotificationProvider,
} from '@blocksuite/yunke-shared/services';
import type { BlockComponent } from '@blocksuite/std';
import { effect } from '@preact/signals-core';
import { html, nothing } from 'lit';
import type { TemplateResult } from 'lit';
import { state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref } from 'lit/directives/ref.js';

import type { FlowchartBlockModel } from './flowchart-model.js';
import { flowchartBlockStyles } from './styles.js';
import { parseDSL } from './dsl-parser.js';
import { renderDiagramToSVG } from './svg-renderer.js';
import { DSL_EXAMPLES } from './examples.js';

// 从核心模块导入 FlowchartService（需要在框架中注册）
// import { FlowchartService } from '@yunke/core/modules/flowchart';

export class FlowchartBlockComponent extends CaptionedBlockComponent<FlowchartBlockModel> {
  static override styles = flowchartBlockStyles;

  @state()
  private accessor _modalOpen = false;

  @state()
  private accessor _diagramSvg = '';

  @state()
  private accessor _error = '';

  @state()
  private accessor _loading = false;

  @state()
  private accessor _hasChanges = false;

  @state()
  private accessor _nodeCount = 0;

  @state()
  private accessor _edgeCount = 0;

  private _currentCode = '';

  get notificationService() {
    return this.std.getOptional(NotificationProvider);
  }

  get readonly() {
    return this.store.readonly;
  }

  override get topContenteditableElement() {
    if (this.std.get(DocModeProvider).getEditorMode() === 'edgeless') {
      return this.closest<BlockComponent>(
        EDGELESS_TOP_CONTENTEDITABLE_SELECTOR
      );
    }
    return this.rootComponent;
  }

  private async _renderDiagram(code?: string) {
    const text = code || this.model.props.text$.value.toString();
    
    if (!text.trim()) {
      this._diagramSvg = '';
      this._error = '';
      this._nodeCount = 0;
      this._edgeCount = 0;
      return;
    }

    this._loading = true;
    this._error = '';

    try {
      // 🔥 集成 Yunke Flow DSL 解析器
      // 这里需要导入 FlowchartService，目前使用临时实现
      const result = await this._parseDslAndRender(text);
      this._diagramSvg = result.svg;
      this._nodeCount = result.nodeCount;
      this._edgeCount = result.edgeCount;
    } catch (error) {
      console.error('Flowchart render error:', error);
      this._error = error instanceof Error ? error.message : 'Unknown error';
      this._diagramSvg = '';
      this._nodeCount = 0;
      this._edgeCount = 0;
    } finally {
      this._loading = false;
    }
  }

  /**
   * 解析 DSL 并渲染为 SVG
   */
  private async _parseDslAndRender(dslCode: string): Promise<{
    svg: string;
    nodeCount: number;
    edgeCount: number;
  }> {
    // 解析 DSL
    const diagram = parseDSL(dslCode);
    
    // 渲染为 SVG
    const result = renderDiagramToSVG(diagram);
    
    return result;
  }

  private _openEditor() {
    if (this.readonly) return;
    this._modalOpen = true;
    this._currentCode = this.model.props.text$.value.toString();
    this._hasChanges = false;
  }

  private _closeEditor() {
    this._modalOpen = false;
    this._hasChanges = false;
  }

  private _handleCodeChange(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    this._currentCode = textarea.value;
    this._hasChanges = true;
    
    // 实时预览
    this._renderDiagram(this._currentCode);
  }

  private _handleSave() {
    // 保存代码到模型
    const text = this.model.props.text$.value;
    text.delete(0, text.length);
    text.insert(this._currentCode, 0);
    
    this._hasChanges = false;
    this.notificationService?.toast('保存成功');
    this._closeEditor();
  }

  private _handlePlaceholderClick() {
    this._openEditor();
  }

  private _handleExampleChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const exampleKey = select.value;
    if (exampleKey && DSL_EXAMPLES[exampleKey]) {
      this._currentCode = DSL_EXAMPLES[exampleKey].code;
      this._hasChanges = true;
      this._renderDiagram(this._currentCode);
    }
  }

  override connectedCallback() {
    super.connectedCallback();
    
    // 监听文本变化
    const disposable = effect(() => {
      this.model.props.text$.value.toString();
      this._renderDiagram();
    });

    this._disposables.add(disposable);
    
    // 初始渲染
    this._renderDiagram();
  }

  private _renderPlaceholder(): TemplateResult {
    return html`
      <div class="yunke-flowchart-placeholder" @click=${this._handlePlaceholderClick}>
        <div class="placeholder-content">
          <div class="placeholder-icon">🔀</div>
          <div class="placeholder-text">点击创建 Yunke Flow 图表</div>
          <div class="placeholder-desc">使用 DSL 描述系统架构、流程图、拓扑结构</div>
        </div>
      </div>
    `;
  }

  private _renderImage(): TemplateResult {
    if (this._loading) {
      return html`
        <div class="yunke-flowchart-loading">
          正在渲染图表...
        </div>
      `;
    }

    if (this._error) {
      return html`
        <div class="yunke-flowchart-error">
          ❌ 图表渲染错误

${this._error}
        </div>
      `;
    }

    return html`
      <div class="yunke-flowchart-preview" .innerHTML=${this._diagramSvg}></div>
    `;
  }

  private _renderToolbar() {
    if (this.readonly) return nothing;

    return html`
      <div class="yunke-flowchart-toolbar">
        <button
          class="yunke-flowchart-edit-button"
          @click=${this._openEditor}
          title="编辑图表"
        >
          ✏️ 编辑
        </button>
        ${this._nodeCount > 0 ? html`
          <span style="margin-left: auto; font-size: 12px; color: var(--affine-text-secondary-color);">
            ${this._nodeCount} 个节点 · ${this._edgeCount} 条连线
          </span>
        ` : nothing}
      </div>
    `;
  }

  private _renderModal() {
    if (!this._modalOpen) return nothing;

    return html`
      <div 
        class="yunke-flowchart-modal-overlay"
        @click=${(e: Event) => {
          if ((e.target as HTMLElement).classList.contains('yunke-flowchart-modal-overlay')) {
            this._closeEditor();
          }
        }}
      >
        <div class="yunke-flowchart-modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="yunke-flowchart-modal-header">
            <h3>🔀 Yunke Flow 图表编辑器</h3>
            <div class="header-buttons">
              ${this._hasChanges ? html`
                <button 
                  class="save-button" 
                  @click=${this._handleSave}
                  title="保存图表"
                >
                  💾 保存
                </button>
              ` : nothing}
              <button class="close-button" @click=${this._closeEditor}>✕</button>
            </div>
          </div>
          
          <div class="example-selector">
            <label>💡 快速开始:</label>
            <select @change=${this._handleExampleChange}>
              <option value="">选择示例...</option>
              ${Object.entries(DSL_EXAMPLES).map(([key, example]) => html`
                <option value=${key}>${example.name}</option>
              `)}
            </select>
          </div>

          <div class="yunke-flowchart-modal-body">
            <div class="editor-container">
              <textarea
                class="code-editor"
                .value=${this._currentCode}
                @input=${this._handleCodeChange}
                placeholder="输入 Yunke Flow DSL 代码，例如:

diagram &quot;我的架构图&quot; {
  node app label &quot;应用&quot;
  node db label &quot;数据库&quot;
  
  app -> db : &quot;查询数据&quot;
}"
                spellcheck="false"
                ${ref((el?: Element) => {
                  if (el && this._modalOpen) {
                    setTimeout(() => {
                      (el as HTMLTextAreaElement).focus();
                      (el as HTMLTextAreaElement).setSelectionRange(
                        this._currentCode.length,
                        this._currentCode.length
                      );
                    }, 100);
                  }
                })}
              ></textarea>
            </div>
            <div class="preview-container">
              ${this._loading ? html`
                <div class="yunke-flowchart-loading">正在渲染预览...</div>
              ` : this._error ? html`
                <div class="yunke-flowchart-error">${this._error}</div>
              ` : this._diagramSvg ? html`
                <div class="preview-content" .innerHTML=${this._diagramSvg}></div>
                <div class="diagram-stats">
                  ${this._nodeCount} 节点 · ${this._edgeCount} 连线
                </div>
              ` : html`
                <div style="color: var(--affine-text-secondary-color); text-align: center;">
                  预览将显示在这里
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  override renderBlock(): TemplateResult {
    const classes = classMap({
      'yunke-flowchart-container': true,
      'selected': !!this.selected$.value,
    });

    return html`
      <div class=${classes}>
        ${this._renderToolbar()}
        ${this.model.props.text$.value.toString().trim() && this._diagramSvg
          ? this._renderImage()
          : this._renderPlaceholder()}
      </div>
      ${this._renderModal()}
    `;
  }
}

