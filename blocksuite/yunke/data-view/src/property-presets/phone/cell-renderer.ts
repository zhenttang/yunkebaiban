import { TelephoneIcon } from '@blocksuite/icons/lit';
import { html } from 'lit';
import { state } from 'lit/decorators.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import {
  phoneCellStyle,
  phoneEmptyStyle,
  phoneIconStyle,
  phoneInputStyle,
  phoneLinkStyle,
  phoneTextStyle,
} from './cell-renderer-css.js';
import { phonePropertyModelConfig } from './define.js';

export class PhoneCell extends BaseCellRenderer<string, string> {
  get _value(): string {
    return this.isEditing$.value
      ? (this.tempValue ?? this.value ?? '')
      : (this.value ?? '');
  }

  private _formatPhone(phone: string): string {
    // 简单的电话号码格式化
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // 中国手机号格式: 138 1234 5678
      return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  }

  private _isValidPhone(phone: string): boolean {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 7 && cleaned.length <= 15;
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

  private _handlePhoneClick(e: MouseEvent) {
    if (this.isEditing$.value) {
      e.preventDefault();
      return;
    }
    const phone = this._value;
    if (this._isValidPhone(phone)) {
      const cleaned = phone.replace(/\D/g, '');
      window.open(`tel:${cleaned}`, '_self');
    }
  }

  override beforeExitEditingMode() {
    const value = this._value;
    this.valueSetNextTick(value);
  }

  protected override render() {
    const phone = this._value;

    // 编辑模式
    if (this.isEditing$.value) {
      return html`
        <div class="${phoneCellStyle}">
          <input
            class="${phoneInputStyle}"
            type="tel"
            .value=${phone}
            placeholder="输入电话号码..."
            @input=${this._handleInput}
            @keydown=${this._handleKeydown}
            @blur=${() => this._saveAndExit()}
          />
        </div>
      `;
    }

    // 只读模式 - 空值
    if (!phone) {
      return html`
        <div class="${phoneCellStyle}">
          <span class="${phoneEmptyStyle}"></span>
        </div>
      `;
    }

    // 只读模式 - 有值
    const isValid = this._isValidPhone(phone);
    const displayPhone = this._formatPhone(phone);

    return html`
      <div class="${phoneCellStyle}">
        <a
          class="${phoneLinkStyle}"
          href=${isValid ? `tel:${phone.replace(/\D/g, '')}` : '#'}
          @click=${this._handlePhoneClick}
        >
          <span class="${phoneIconStyle}">${TelephoneIcon()}</span>
          <span class="${phoneTextStyle}">${displayPhone}</span>
        </a>
      </div>
    `;
  }

  @state()
  private accessor tempValue: string | undefined = undefined;
}

export const phonePropertyConfig = phonePropertyModelConfig.createPropertyMeta({
  icon: createIcon('TelephoneIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(PhoneCell),
  },
});
