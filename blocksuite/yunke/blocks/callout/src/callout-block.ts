import { AutoSizeIcon, PaletteIcon } from '@blocksuite/icons/lit';
import { CaptionedBlockComponent } from '@blocksuite/yunke-components/caption';
import { createLitPortal } from '@blocksuite/yunke-components/portal';
import { DefaultInlineManagerExtension } from '@blocksuite/yunke-inline-preset';
import { type CalloutBlockModel } from '@blocksuite/yunke-model';
import { EDGELESS_TOP_CONTENTEDITABLE_SELECTOR } from '@blocksuite/yunke-shared/consts';
import {
  DocModeProvider,
  ThemeProvider,
} from '@blocksuite/yunke-shared/services';
import { unsafeCSSVarV2 } from '@blocksuite/yunke-shared/theme';
import type { BlockComponent } from '@blocksuite/std';
import { flip, offset } from '@floating-ui/dom';
import { css, html } from 'lit';
import { query } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
export class CalloutBlockComponent extends CaptionedBlockComponent<CalloutBlockModel> {
  static override styles = css`
    :host {
      display: block;
      margin: 8px 0;
    }

    .yunke-callout-block-container {
      display: flex;
      padding: 5px 10px;
      border-radius: 8px;
      transition: background-color 0.2s ease;
      position: relative;
    }

    .yunke-callout-toolbar {
      position: absolute;
      top: 4px;
      right: 4px;
      display: flex;
      gap: 4px;
      opacity: 0;
      transition: opacity 0.2s ease;
      pointer-events: none;
    }

    .yunke-callout-block-container:hover .yunke-callout-toolbar {
      opacity: 1;
      pointer-events: auto;
    }

    .yunke-callout-toolbar-button {
      width: 28px;
      height: 28px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${unsafeCSSVarV2('layer/background/overlayPanel')};
      border: 1px solid ${unsafeCSSVarV2('layer/insideBorder/border')};
      cursor: pointer;
      transition: all 0.2s ease;
      color: ${unsafeCSSVarV2('icon/primary')};
      flex-shrink: 0;
      box-sizing: border-box;
      line-height: 1;
    }

    .yunke-callout-toolbar-button:hover {
      background: ${unsafeCSSVarV2('button/grabber/default')};
      box-shadow: ${unsafeCSSVarV2('shadow/1')};
    }

    .yunke-callout-toolbar-button svg {
      font-size: 20px;
      display: block;
      flex-shrink: 0;
    }

    .yunke-callout-emoji-container {
      margin-right: 10px;
      margin-top: 14px;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: font-size 0.2s ease;
    }
    .yunke-callout-emoji:hover {
      cursor: pointer;
      opacity: 0.7;
    }

    .yunke-callout-children {
      flex: 1;
      min-width: 0;
      padding-left: 10px;
    }

    .emoji-size-small {
      font-size: 1em;
      width: 20px;
      height: 20px;
    }

    .emoji-size-medium {
      font-size: 1.2em;
      width: 24px;
      height: 24px;
    }

    .emoji-size-large {
      font-size: 1.5em;
      width: 30px;
      height: 30px;
    }
  `;

  private _emojiMenuAbortController: AbortController | null = null;
  private _colorPickerAbortController: AbortController | null = null;
  private _sizePickerAbortController: AbortController | null = null;

  private readonly _toggleEmojiMenu = () => {
    if (this._emojiMenuAbortController) {
      this._emojiMenuAbortController.abort();
    }
    this._emojiMenuAbortController = new AbortController();

    const theme = this.std.get(ThemeProvider).theme$.value;

    createLitPortal({
      template: html`<yunke-emoji-menu
        .theme=${theme}
        .onEmojiSelect=${(data: any) => {
          this.model.props.emoji = data.native;
        }}
      ></yunke-emoji-menu>`,
      portalStyles: {
        zIndex: 'var(--yunke-z-index-popover)',
      },
      container: this.host,
      computePosition: {
        referenceElement: this._emojiButton,
        placement: 'bottom-start',
        middleware: [flip(), offset(4)],
        autoUpdate: { animationFrame: true },
      },
      abortController: this._emojiMenuAbortController,
      closeOnClickAway: true,
    });
  };

  private readonly _toggleColorPicker = () => {
    if (this._colorPickerAbortController) {
      this._colorPickerAbortController.abort();
    }
    this._colorPickerAbortController = new AbortController();

    createLitPortal({
      template: html`<yunke-callout-color-picker
        .selectedColor=${this.model.props.background$.value || 'grey'}
        .onColorSelect=${(color: string) => {
          this.model.props.background = color;
          this._colorPickerAbortController?.abort();
        }}
      ></yunke-callout-color-picker>`,
      portalStyles: {
        zIndex: 'var(--yunke-z-index-popover)',
      },
      container: this.host,
      computePosition: {
        referenceElement: this._containerElement,
        placement: 'bottom-start',
        middleware: [flip(), offset(4)],
        autoUpdate: { animationFrame: true },
      },
      abortController: this._colorPickerAbortController,
      closeOnClickAway: true,
    });
  };

  private readonly _toggleSizePicker = () => {
    if (this._sizePickerAbortController) {
      this._sizePickerAbortController.abort();
    }
    this._sizePickerAbortController = new AbortController();

    createLitPortal({
      template: html`<yunke-callout-size-picker
        .selectedSize=${this.model.props.emojiSize$.value || 'medium'}
        .onSizeSelect=${(size: string) => {
          this.model.props.emojiSize = size;
          this._sizePickerAbortController?.abort();
        }}
      ></yunke-callout-size-picker>`,
      portalStyles: {
        zIndex: 'var(--yunke-z-index-popover)',
      },
      container: this.host,
      computePosition: {
        referenceElement: this._emojiButton,
        placement: 'bottom-end',
        middleware: [flip(), offset(4)],
        autoUpdate: { animationFrame: true },
      },
      abortController: this._sizePickerAbortController,
      closeOnClickAway: true,
    });
  };

  get attributeRenderer() {
    return this.inlineManager.getRenderer();
  }

  get attributesSchema() {
    return this.inlineManager.getSchema();
  }

  get embedChecker() {
    return this.inlineManager.embedChecker;
  }

  get inlineManager() {
    return this.std.get(DefaultInlineManagerExtension.identifier);
  }

  @query('.yunke-callout-emoji')
  private accessor _emojiButton!: HTMLElement;

  @query('.yunke-callout-block-container')
  private accessor _containerElement!: HTMLElement;

  override get topContenteditableElement() {
    if (this.std.get(DocModeProvider).getEditorMode() === 'edgeless') {
      return this.closest<BlockComponent>(
        EDGELESS_TOP_CONTENTEDITABLE_SELECTOR
      );
    }
    return this.rootComponent;
  }

  override renderBlock() {
    const emoji = this.model.props.emoji$.value;
    const background = this.model.props.background$.value || 'grey';
    const emojiSize = this.model.props.emojiSize$.value || 'medium';

    return html`
      <div
        class="yunke-callout-block-container"
        style=${styleMap({
          backgroundColor: `var(--yunke-v2-block-callout-background-${background})`,
        })}
      >
        <div
          @click=${this._toggleEmojiMenu}
          contenteditable="false"
          class="yunke-callout-emoji-container emoji-size-${emojiSize}"
          style=${styleMap({
            display: emoji.length === 0 ? 'none' : undefined,
          })}
        >
          <span class="yunke-callout-emoji">${emoji}</span>
        </div>
        <div class="yunke-callout-children">
          ${this.renderChildren(this.model)}
        </div>
        <div class="yunke-callout-toolbar" contenteditable="false">
          <div
            class="yunke-callout-toolbar-button"
            @click=${this._toggleColorPicker}
            title="选择背景颜色"
          >
            ${PaletteIcon()}
          </div>
          <div
            class="yunke-callout-toolbar-button"
            @click=${this._toggleSizePicker}
            title="调整emoji大小"
          >
            ${AutoSizeIcon()}
          </div>
        </div>
      </div>
    `;
  }
}
