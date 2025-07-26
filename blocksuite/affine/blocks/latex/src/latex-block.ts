import { selectBlock } from '@blocksuite/affine-block-note';
import { CaptionedBlockComponent } from '@blocksuite/affine-components/caption';
import { createLitPortal } from '@blocksuite/affine-components/portal';
import type { LatexBlockModel } from '@blocksuite/affine-model';
import { BlockSelection } from '@blocksuite/std';
import type { Placement } from '@floating-ui/dom';
import { effect } from '@preact/signals-core';
import katex from 'katex';
import { html, render } from 'lit';
import { query } from 'lit/decorators.js';

import { latexBlockStyles } from './styles.js';

export class LatexBlockComponent extends CaptionedBlockComponent<LatexBlockModel> {
  static override styles = latexBlockStyles;

  private _editorAbortController: AbortController | null = null;

  get editorPlacement(): Placement {
    return 'bottom';
  }

  get isBlockSelected() {
    const blockSelection = this.selection.filter(BlockSelection);
    return blockSelection.some(
      selection => selection.blockId === this.model.id
    );
  }

  override firstUpdated(props: Map<string, unknown>) {
    super.firstUpdated(props);

    const { disposables } = this;

    this._editorAbortController?.abort();
    this._editorAbortController = new AbortController();
    disposables.add(() => {
      this._editorAbortController?.abort();
    });

    const katexContainer = this._katexContainer;
    if (!katexContainer) return;

    disposables.add(
      effect(() => {
        const latex = this.model.props.latex$.value;
        console.log('LaTeX content:', JSON.stringify(latex), 'length:', latex.length);

        katexContainer.replaceChildren();
        // @ts-expect-error lit hack won't fix
        delete katexContainer['_$litPart$'];

        if (latex.length === 0) {
          render(
            html`<span class="latex-block-empty-placeholder">Equation</span>`,
            katexContainer
          );
        } else {
          try {
            // 强制检查文档模式
            if (document.compatMode === 'BackCompat') {
              console.warn('Document is in quirks mode, this may cause KaTeX issues');
            }
            
            katex.render(latex, katexContainer, {
              displayMode: true,
              strict: false, // 允许一些非标准的LaTeX语法
              throwOnError: false, // 不抛出错误，而是显示错误信息
            });
          } catch (error) {
            console.warn('LaTeX rendering failed:', error, 'for latex:', latex);
            katexContainer.replaceChildren();
            // @ts-expect-error lit hack won't fix
            delete katexContainer['_$litPart$'];
            render(
              html`<span class="latex-block-error-placeholder" @click=${this._clearInvalidLatex}>Invalid LaTeX: ${latex.substring(0, 20)}${latex.length > 20 ? '...' : ''} (click to clear)</span>`,
              katexContainer
            );
          }
        }
      })
    );
  }

  private _clearInvalidLatex = () => {
    this.model.props.latex$.value = '';
  };

  private _handleClick() {
    if (this.store.readonly) return;

    if (this.isBlockSelected) {
      this.toggleEditor();
    } else {
      this.selectBlock();
    }
  }

  removeEditor(portal: HTMLDivElement) {
    portal.remove();
  }

  override renderBlock() {
    return html`
      <div
        contenteditable="false"
        class="latex-block-container"
        @click=${this._handleClick}
      >
        <div class="katex"></div>
      </div>
    `;
  }

  selectBlock() {
    this.host.command.exec(selectBlock, {
      focusBlock: this,
    });
  }

  toggleEditor() {
    const katexContainer = this._katexContainer;
    if (!katexContainer) return;

    this._editorAbortController?.abort();
    this._editorAbortController = new AbortController();

    this.selection.setGroup('note', []);

    const portal = createLitPortal({
      template: html`<latex-editor-menu
        .std=${this.std}
        .latexSignal=${this.model.props.latex$}
        .abortController=${this._editorAbortController}
      ></latex-editor-menu>`,
      container: this.host,
      computePosition: {
        referenceElement: this,
        placement: this.editorPlacement,
        autoUpdate: {
          animationFrame: true,
        },
      },
      closeOnClickAway: true,
      abortController: this._editorAbortController,
      shadowDom: false,
      portalStyles: {
        zIndex: 'var(--affine-z-index-popover)',
      },
    });

    this._editorAbortController.signal.addEventListener(
      'abort',
      () => {
        this.removeEditor(portal);
      },
      { once: true }
    );
  }

  @query('.latex-block-container')
  private accessor _katexContainer!: HTMLDivElement;
}

declare global {
  interface HTMLElementTagNameMap {
    'affine-latex': LatexBlockComponent;
  }
}
