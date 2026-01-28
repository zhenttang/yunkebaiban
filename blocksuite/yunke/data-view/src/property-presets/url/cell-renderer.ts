import { LinkIcon } from '@blocksuite/icons/lit';
import { html, nothing } from 'lit';
import { state } from 'lit/decorators.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import {
  urlCellStyle,
  urlEmptyStyle,
  urlIconStyle,
  urlInputStyle,
  urlLinkStyle,
  urlTextStyle,
} from './cell-renderer-css.js';
import { urlPropertyModelConfig } from './define.js';

interface UrlValue {
  url: string;
  title?: string;
}

interface UrlPropertyData {
  showTitle: boolean;
}

export class UrlCell extends BaseCellRenderer<UrlValue, UrlValue, UrlPropertyData> {
  get _value(): UrlValue {
    return this.isEditing$.value
      ? (this.tempValue ?? this.value ?? { url: '', title: '' })
      : (this.value ?? { url: '', title: '' });
  }

  get _showTitle() {
    return this.propertyData?.showTitle ?? false;
  }

  private _isValidUrl(url: string): boolean {
    if (!url) return false;
    try {
      // 如果没有协议，添加 https://
      const urlWithProtocol = url.match(/^https?:\/\//) ? url : `https://${url}`;
      new URL(urlWithProtocol);
      return true;
    } catch {
      return false;
    }
  }

  private _getDisplayUrl(url: string): string {
    if (!url) return '';
    try {
      const urlObj = new URL(url.match(/^https?:\/\//) ? url : `https://${url}`);
      return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname : '');
    } catch {
      return url;
    }
  }

  private _getFullUrl(url: string): string {
    if (!url) return '';
    return url.match(/^https?:\/\//) ? url : `https://${url}`;
  }

  private _handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.tempValue = { url: input.value, title: this._value.title };
  }

  private _handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this._saveAndExit();
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      this.tempValue = undefined;
      this.selectCurrentCell(false);
    }
  }

  private _saveAndExit() {
    const value = this._value;
    this.valueSetNextTick(value);
    this.selectCurrentCell(false);
  }

  private _handleLinkClick(e: MouseEvent) {
    if (this.isEditing$.value) {
      e.preventDefault();
      return;
    }
    const url = this._value.url;
    if (this._isValidUrl(url)) {
      window.open(this._getFullUrl(url), '_blank', 'noopener,noreferrer');
    }
  }

  override beforeExitEditingMode() {
    const value = this._value;
    this.valueSetNextTick(value);
  }

  protected override render() {
    const { url, title } = this._value;

    // 编辑模式
    if (this.isEditing$.value) {
      return html`
        <div class="${urlCellStyle}">
          <input
            class="${urlInputStyle}"
            type="text"
            .value=${url}
            placeholder="输入 URL..."
            @input=${this._handleInput}
            @keydown=${this._handleKeydown}
            @blur=${() => this._saveAndExit()}
          />
        </div>
      `;
    }

    // 只读模式 - 空值
    if (!url) {
      return html`
        <div class="${urlCellStyle}">
          <span class="${urlEmptyStyle}"></span>
        </div>
      `;
    }

    // 只读模式 - 有值
    const displayText = this._showTitle && title ? title : this._getDisplayUrl(url);
    const isValid = this._isValidUrl(url);

    return html`
      <div class="${urlCellStyle}">
        <a
          class="${urlLinkStyle}"
          href=${isValid ? this._getFullUrl(url) : nothing}
          target="_blank"
          rel="noopener noreferrer"
          @click=${this._handleLinkClick}
        >
          <span class="${urlIconStyle}">${LinkIcon()}</span>
          <span class="${urlTextStyle}">${displayText}</span>
        </a>
      </div>
    `;
  }

  @state()
  private accessor tempValue: UrlValue | undefined = undefined;
}

export const urlPropertyConfig = urlPropertyModelConfig.createPropertyMeta({
  icon: createIcon('LinkIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(UrlCell),
  },
});
