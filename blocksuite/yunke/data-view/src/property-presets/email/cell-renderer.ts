import { EmailIcon } from '@blocksuite/icons/lit';
import { html } from 'lit';
import { state } from 'lit/decorators.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import {
  emailCellStyle,
  emailEmptyStyle,
  emailIconStyle,
  emailInputStyle,
  emailLinkStyle,
  emailTextStyle,
} from './cell-renderer-css.js';
import { emailPropertyModelConfig } from './define.js';

export class EmailCell extends BaseCellRenderer<string, string> {
  get _value(): string {
    return this.isEditing$.value
      ? (this.tempValue ?? this.value ?? '')
      : (this.value ?? '');
  }

  private _isValidEmail(email: string): boolean {
    if (!email) return false;
    // 简单的邮箱验证正则
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private _handleInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.tempValue = input.value;
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

  private _handleEmailClick(e: MouseEvent) {
    if (this.isEditing$.value) {
      e.preventDefault();
      return;
    }
    const email = this._value;
    if (this._isValidEmail(email)) {
      window.open(`mailto:${email}`, '_self');
    }
  }

  override beforeExitEditingMode() {
    const value = this._value;
    this.valueSetNextTick(value);
  }

  protected override render() {
    const email = this._value;

    // 编辑模式
    if (this.isEditing$.value) {
      return html`
        <div class="${emailCellStyle}">
          <input
            class="${emailInputStyle}"
            type="email"
            .value=${email}
            placeholder="输入邮箱地址..."
            @input=${this._handleInput}
            @keydown=${this._handleKeydown}
            @blur=${() => this._saveAndExit()}
          />
        </div>
      `;
    }

    // 只读模式 - 空值
    if (!email) {
      return html`
        <div class="${emailCellStyle}">
          <span class="${emailEmptyStyle}"></span>
        </div>
      `;
    }

    // 只读模式 - 有值
    const isValid = this._isValidEmail(email);

    return html`
      <div class="${emailCellStyle}">
        <a
          class="${emailLinkStyle}"
          href=${isValid ? `mailto:${email}` : '#'}
          @click=${this._handleEmailClick}
        >
          <span class="${emailIconStyle}">${EmailIcon()}</span>
          <span class="${emailTextStyle}">${email}</span>
        </a>
      </div>
    `;
  }

  @state()
  private accessor tempValue: string | undefined = undefined;
}

export const emailPropertyConfig = emailPropertyModelConfig.createPropertyMeta({
  icon: createIcon('EmailIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(EmailCell),
  },
});
