import { CloseIcon, PlusIcon } from '@blocksuite/icons/lit';
import { html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import {
  personAddButtonStyle,
  personAvatarImgStyle,
  personAvatarStyle,
  personCellStyle,
  personDropdownItemStyle,
  personDropdownStyle,
  personEmptyStyle,
  personItemStyle,
  personNameStyle,
  personRemoveButtonStyle,
  personSearchInputStyle,
} from './cell-renderer-css.js';
import { personPropertyModelConfig, type PersonValue } from './define.js';

interface PersonPropertyData {
  allowMultiple: boolean;
  notifyOnAssign: boolean;
}

// 模拟的成员列表（实际项目中应从工作区获取）
const MOCK_MEMBERS: PersonValue[] = [
  { userId: '1', name: '张三', email: 'zhangsan@example.com' },
  { userId: '2', name: '李四', email: 'lisi@example.com' },
  { userId: '3', name: '王五', email: 'wangwu@example.com' },
  { userId: '4', name: '赵六', email: 'zhaoliu@example.com' },
  { userId: '5', name: '钱七', email: 'qianqi@example.com' },
];

export class PersonCell extends BaseCellRenderer<
  PersonValue | PersonValue[] | null,
  PersonValue | PersonValue[] | null,
  PersonPropertyData
> {
  get _value(): PersonValue[] {
    const value = this.value;
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [value];
  }

  get _allowMultiple(): boolean {
    return this.propertyData?.allowMultiple ?? false;
  }

  private _getInitials(name: string): string {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  }

  private _handleAddPerson(person: PersonValue) {
    const currentValue = this._value;
    
    // 检查是否已存在
    if (currentValue.some(p => p.userId === person.userId)) {
      return;
    }

    let newValue: PersonValue | PersonValue[];
    if (this._allowMultiple) {
      newValue = [...currentValue, person];
    } else {
      newValue = person;
    }

    this.valueSetNextTick(newValue);
    this._showDropdown = false;
  }

  private _handleRemovePerson(userId: string) {
    const currentValue = this._value;
    const newValue = currentValue.filter(p => p.userId !== userId);
    
    if (this._allowMultiple) {
      this.valueSetNextTick(newValue.length > 0 ? newValue : null);
    } else {
      this.valueSetNextTick(null);
    }
  }

  private _getFilteredMembers(): PersonValue[] {
    const search = this._searchText.toLowerCase();
    const currentIds = this._value.map(p => p.userId);
    
    return MOCK_MEMBERS.filter(m => {
      if (currentIds.includes(m.userId)) return false;
      if (!search) return true;
      return m.name.toLowerCase().includes(search) || 
             (m.email?.toLowerCase().includes(search) ?? false);
    });
  }

  private _renderPerson(person: PersonValue) {
    const avatar = person.avatar
      ? html`<img class="${personAvatarImgStyle}" src="${person.avatar}" alt="${person.name}" />`
      : html`<div class="${personAvatarStyle}">${this._getInitials(person.name)}</div>`;

    return html`
      <div class="${personItemStyle}">
        ${avatar}
        <span class="${personNameStyle}" title="${person.name}">${person.name}</span>
        ${this.isEditing$.value
          ? html`
              <span 
                class="${personRemoveButtonStyle}"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this._handleRemovePerson(person.userId);
                }}
              >
                ${CloseIcon()}
              </span>
            `
          : nothing
        }
      </div>
    `;
  }

  private _renderDropdown() {
    const members = this._getFilteredMembers();

    return html`
      <div class="${personDropdownStyle}">
        <input
          class="${personSearchInputStyle}"
          type="text"
          placeholder="搜索成员..."
          .value=${this._searchText}
          @input=${(e: Event) => {
            this._searchText = (e.target as HTMLInputElement).value;
          }}
          @click=${(e: Event) => e.stopPropagation()}
        />
        ${members.length > 0
          ? repeat(
              members,
              m => m.userId,
              m => html`
                <div 
                  class="${personDropdownItemStyle}"
                  @click=${() => this._handleAddPerson(m)}
                >
                  ${m.avatar
                    ? html`<img class="${personAvatarImgStyle}" src="${m.avatar}" alt="${m.name}" />`
                    : html`<div class="${personAvatarStyle}">${this._getInitials(m.name)}</div>`
                  }
                  <span>${m.name}</span>
                  ${m.email ? html`<span style="color: var(--yunke-text-secondary-color); font-size: 12px;">${m.email}</span>` : nothing}
                </div>
              `
            )
          : html`<div style="padding: 12px; text-align: center; color: var(--yunke-text-secondary-color);">无匹配成员</div>`
        }
      </div>
    `;
  }

  protected override render() {
    const persons = this._value;

    if (persons.length === 0 && !this.isEditing$.value) {
      return html`
        <div class="${personCellStyle}">
          <span class="${personEmptyStyle}"></span>
        </div>
      `;
    }

    return html`
      <div class="${personCellStyle}" style="position: relative;">
        ${repeat(
          persons,
          p => p.userId,
          p => this._renderPerson(p)
        )}
        ${this.isEditing$.value && (this._allowMultiple || persons.length === 0)
          ? html`
              <div 
                class="${personAddButtonStyle}"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this._showDropdown = !this._showDropdown;
                }}
              >
                ${PlusIcon()}
              </div>
            `
          : nothing
        }
        ${this._showDropdown ? this._renderDropdown() : nothing}
      </div>
    `;
  }

  @state()
  private accessor _showDropdown = false;

  @state()
  private accessor _searchText = '';
}

export const personPropertyConfig = personPropertyModelConfig.createPropertyMeta({
  icon: createIcon('SinglePersonIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(PersonCell),
  },
});
