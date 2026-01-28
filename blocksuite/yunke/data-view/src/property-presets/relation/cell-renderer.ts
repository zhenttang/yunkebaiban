import { CloseIcon, LinkIcon, PlusIcon } from '@blocksuite/icons/lit';
import { html, nothing } from 'lit';
import { state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import {
  relationAddButtonStyle,
  relationCellStyle,
  relationDropdownItemStyle,
  relationDropdownStyle,
  relationEmptyStyle,
  relationIconStyle,
  relationItemStyle,
  relationItemTextStyle,
  relationRemoveButtonStyle,
  relationSearchInputStyle,
} from './cell-renderer-css.js';
import { relationPropertyModelConfig, type RelationValue } from './define.js';

interface RelationPropertyData {
  targetTableId: string;
  targetPropertyId?: string;
  isTwoWay: boolean;
  allowMultiple: boolean;
}

// 模拟的目标记录列表（实际项目中应从目标表获取）
const MOCK_RECORDS: RelationValue[] = [
  { recordId: 'rec1', displayValue: '项目 A - 任务管理' },
  { recordId: 'rec2', displayValue: '项目 B - 产品设计' },
  { recordId: 'rec3', displayValue: '项目 C - 技术开发' },
  { recordId: 'rec4', displayValue: '项目 D - 市场营销' },
  { recordId: 'rec5', displayValue: '项目 E - 客户服务' },
];

export class RelationCell extends BaseCellRenderer<
  RelationValue[],
  RelationValue[],
  RelationPropertyData
> {
  get _value(): RelationValue[] {
    return this.value ?? [];
  }

  get _allowMultiple(): boolean {
    return this.propertyData?.allowMultiple ?? true;
  }

  private _handleAddRelation(record: RelationValue) {
    const currentValue = this._value;
    
    // 检查是否已存在
    if (currentValue.some(r => r.recordId === record.recordId)) {
      return;
    }

    let newValue: RelationValue[];
    if (this._allowMultiple) {
      newValue = [...currentValue, record];
    } else {
      newValue = [record];
    }

    this.valueSetNextTick(newValue);
    this._showDropdown = false;
  }

  private _handleRemoveRelation(recordId: string) {
    const newValue = this._value.filter(r => r.recordId !== recordId);
    this.valueSetNextTick(newValue);
  }

  private _handleRecordClick(record: RelationValue) {
    // TODO: 跳转到关联记录
    console.log('Navigate to record:', record.recordId);
  }

  private _getFilteredRecords(): RelationValue[] {
    const search = this._searchText.toLowerCase();
    const currentIds = this._value.map(r => r.recordId);
    
    return MOCK_RECORDS.filter(r => {
      if (currentIds.includes(r.recordId)) return false;
      if (!search) return true;
      return r.displayValue.toLowerCase().includes(search);
    });
  }

  private _renderRelationItem(relation: RelationValue) {
    return html`
      <div class="${relationItemStyle}">
        <span class="${relationIconStyle}">${LinkIcon()}</span>
        <span 
          class="${relationItemTextStyle}" 
          title="${relation.displayValue}"
          @click=${() => this._handleRecordClick(relation)}
        >
          ${relation.displayValue}
        </span>
        ${this.isEditing$.value
          ? html`
              <span 
                class="${relationRemoveButtonStyle}"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this._handleRemoveRelation(relation.recordId);
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
    const records = this._getFilteredRecords();

    return html`
      <div class="${relationDropdownStyle}">
        <input
          class="${relationSearchInputStyle}"
          type="text"
          placeholder="搜索记录..."
          .value=${this._searchText}
          @input=${(e: Event) => {
            this._searchText = (e.target as HTMLInputElement).value;
          }}
          @click=${(e: Event) => e.stopPropagation()}
        />
        ${records.length > 0
          ? repeat(
              records,
              r => r.recordId,
              r => html`
                <div 
                  class="${relationDropdownItemStyle}"
                  @click=${() => this._handleAddRelation(r)}
                >
                  <span class="${relationIconStyle}">${LinkIcon()}</span>
                  <span>${r.displayValue}</span>
                </div>
              `
            )
          : html`<div style="padding: 12px; text-align: center; color: var(--yunke-text-secondary-color);">无匹配记录</div>`
        }
      </div>
    `;
  }

  protected override render() {
    const relations = this._value;

    if (relations.length === 0 && !this.isEditing$.value) {
      return html`
        <div class="${relationCellStyle}">
          <span class="${relationEmptyStyle}"></span>
        </div>
      `;
    }

    return html`
      <div class="${relationCellStyle}" style="position: relative;">
        ${repeat(
          relations,
          r => r.recordId,
          r => this._renderRelationItem(r)
        )}
        ${this.isEditing$.value && (this._allowMultiple || relations.length === 0)
          ? html`
              <div 
                class="${relationAddButtonStyle}"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  this._showDropdown = !this._showDropdown;
                }}
              >
                ${PlusIcon()}
                <span>添加关联</span>
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

export const relationPropertyConfig = relationPropertyModelConfig.createPropertyMeta({
  icon: createIcon('LinkIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(RelationCell),
  },
});
