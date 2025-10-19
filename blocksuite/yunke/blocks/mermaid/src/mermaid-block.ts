import { CaptionedBlockComponent } from '@blocksuite/yunke-components/caption';
import { focusTextModel, type RichText } from '@blocksuite/yunke-rich-text';
import {
  EDGELESS_TOP_CONTENTEDITABLE_SELECTOR,
} from '@blocksuite/yunke-shared/consts';
import {
  DocModeProvider,
  NotificationProvider,
} from '@blocksuite/yunke-shared/services';
import type { BlockComponent } from '@blocksuite/std';
import { BlockSelection, TextSelection } from '@blocksuite/std';
import {
  getInlineRangeProvider,
  INLINE_ROOT_ATTR,
  type InlineRangeProvider,
  type InlineRootElement,
} from '@blocksuite/std/inline';
import { effect, signal } from '@preact/signals-core';
import { html, nothing, type TemplateResult } from 'lit';
import { property, query, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { ref, createRef, type Ref } from 'lit/directives/ref.js';
import mermaid from 'mermaid';
import { v4 as uuidv4 } from 'uuid';

import type { MermaidBlockModel } from './mermaid-model.js';
import { MermaidBlockService } from './mermaid-service.js';
import { mermaidBlockStyles } from './styles.js';

// 初始化 Mermaid
mermaid.initialize({
  startOnLoad: false,
  suppressErrorRendering: true,
  theme: 'default',
  themeVariables: {
    primaryColor: '#1e96ed',
    primaryTextColor: '#333',
    primaryBorderColor: '#1e96ed',
    lineColor: '#333',
    secondaryColor: '#f8f9fa',
    tertiaryColor: '#fff',
  },
});

export class MermaidBlockComponent extends CaptionedBlockComponent<MermaidBlockModel> {
  static override styles = mermaidBlockStyles;

  private _modalRef: Ref<HTMLDivElement> = createRef();
  private _diagramId = `mermaid-${uuidv4()}`;

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

  private _currentCode = '';

  get notificationService() {
    return this.std.getOptional(NotificationProvider);
  }

  get readonly() {
    return this.store.readonly;
  }

  get service() {
    return this.std.get(MermaidBlockService);
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
      return;
    }

    this._loading = true;
    this._error = '';

    try {
      const { svg } = await mermaid.render(this._diagramId, text);
      this._diagramSvg = svg;
    } catch (error) {
      console.error('Mermaid render error:', error);
      this._error = error instanceof Error ? error.message : 'Unknown error';
      this._diagramSvg = '';
    } finally {
      this._loading = false;
    }
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
  }

  private _handleSave() {
    // 保存代码到模型
    this.model.props.text$.clear();
    this.model.props.text$.insert(0, this._currentCode);
    
    // 重新渲染图表
    this._renderDiagram(this._currentCode);
    
    this._hasChanges = false;
    this.notificationService?.toast('保存成功');
    this._closeEditor();
  }

  private _handlePlaceholderClick() {
    this._openEditor();
  }

  override connectedCallback() {
    super.connectedCallback();
    
    // 监听文本变化
    const disposable = effect(() => {
      const text = this.model.props.text$.value.toString();
      this._renderDiagram();
    });

    this._disposables.add(disposable);
    
    // 初始渲染
    this._renderDiagram();
  }

  private _renderPlaceholder(): TemplateResult {
    return html`
      <div class="affine-mermaid-placeholder" @click=${this._handlePlaceholderClick}>
        <div class="placeholder-content">
          <div class="placeholder-icon">📊</div>
          <div class="placeholder-text">点击创建 Mermaid 图表</div>
          <div class="placeholder-desc">流程图、序列图、甘特图等</div>
        </div>
      </div>
    `;
  }

  private _renderImage(): TemplateResult {
    if (this._loading) {
      return html`
        <div class="affine-mermaid-loading">
          正在渲染图表...
        </div>
      `;
    }

    if (this._error) {
      return html`
        <div class="affine-mermaid-error">
          Mermaid 图表错误: ${this._error}
        </div>
      `;
    }

    return html`
      <div 
        class="affine-mermaid-preview"
        .innerHTML=${this._diagramSvg}
      ></div>
    `;
  }

  private _renderToolbar(): TemplateResult {
    if (this.readonly) return nothing;

    return html`
      <div class="affine-mermaid-toolbar">
        <button
          class="affine-mermaid-edit-button"
          @click=${this._openEditor}
          title="编辑图表"
        >
          ✏️ 编辑
        </button>
      </div>
    `;
  }

  private _renderModal(): TemplateResult {
    if (!this._modalOpen) return nothing;

    return html`
      <div 
        class="affine-mermaid-modal-overlay"
        @click=${(e: Event) => {
          if ((e.target as HTMLElement).classList.contains('affine-mermaid-modal-overlay')) {
            this._closeEditor();
          }
        }}
      >
        <div class="affine-mermaid-modal" @click=${(e: Event) => e.stopPropagation()}>
          <div class="affine-mermaid-modal-header">
            <h3>Mermaid 图表编辑器</h3>
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
          <div class="affine-mermaid-modal-body">
            <div class="editor-container">
              <textarea
                class="code-editor"
                .value=${this._currentCode}
                @input=${this._handleCodeChange}
                placeholder="输入 Mermaid 图表代码，例如:

flowchart TD
    A[开始] --> B{判断条件}
    B -->|是| C[执行操作]
    B -->|否| D[跳过]
    C --> E[结束]
    D --> E"
                spellcheck="false"
                ${ref((el?: Element) => {
                  if (el && this._modalOpen) {
                    // 延迟聚焦，确保DOM已完全渲染
                    setTimeout(() => {
                      (el as HTMLTextAreaElement).focus();
                      (el as HTMLTextAreaElement).setSelectionRange(this._currentCode.length, this._currentCode.length);
                    }, 100);
                  }
                })}
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  override renderBlock(): TemplateResult {
    const classes = classMap({
      'affine-mermaid-container': true,
      'selected': this.selected,
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