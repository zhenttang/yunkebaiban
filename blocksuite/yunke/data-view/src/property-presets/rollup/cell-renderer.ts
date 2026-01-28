import { html } from 'lit';
import { repeat } from 'lit/directives/repeat.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import {
  rollupCellStyle,
  rollupConfigStyle,
  rollupEmptyStyle,
  rollupListItemStyle,
  rollupListStyle,
  rollupNumberStyle,
  rollupPercentStyle,
  rollupValueStyle,
} from './cell-renderer-css.js';
import {
  calculateRollup,
  rollupPropertyModelConfig,
  type RollupFunction,
} from './define.js';

interface RollupPropertyData {
  relationPropertyId: string;
  targetPropertyId: string;
  rollupFunction: RollupFunction;
  format?: {
    decimals?: number;
    showAsPercent?: boolean;
  };
}

type RollupValue = string | number | unknown[] | null;

export class RollupCell extends BaseCellRenderer<
  RollupValue,
  RollupValue,
  RollupPropertyData
> {
  private _calculateValue(): RollupValue {
    const { relationPropertyId, targetPropertyId, rollupFunction } = this.propertyData ?? {};
    
    if (!relationPropertyId) {
      return null;
    }

    try {
      const view = this.view;
      if (!view) return null;

      // 获取关联字段的值
      const relationValue = view.cellRawGet(this.rowId, relationPropertyId);
      if (!relationValue || !Array.isArray(relationValue)) {
        return calculateRollup([], rollupFunction ?? 'count');
      }

      // 如果不需要目标字段（如 count），直接计算
      if (!targetPropertyId || rollupFunction === 'count') {
        return calculateRollup(relationValue, rollupFunction ?? 'count');
      }

      // 获取关联记录的目标字段值
      // 注意：这里需要从关联表中获取数据，目前使用模拟数据
      const targetValues = relationValue.map((relation: { recordId?: string }) => {
        // 在实际实现中，这里应该从关联表中获取 targetPropertyId 对应的值
        // 目前返回模拟数据
        return relation.recordId ? Math.random() * 100 : null;
      });

      return calculateRollup(targetValues, rollupFunction ?? 'count');
    } catch (e) {
      console.warn('Rollup calculation error:', e);
      return null;
    }
  }

  private _formatValue(value: RollupValue): string {
    if (value == null) return '';
    
    const format = this.propertyData?.format;
    const rollupFunction = this.propertyData?.rollupFunction;
    
    if (typeof value === 'number') {
      let result = value;
      
      if (format?.decimals !== undefined) {
        result = parseFloat(value.toFixed(format.decimals));
      }
      
      if (format?.showAsPercent || rollupFunction === 'percent_empty' || rollupFunction === 'percent_filled') {
        return `${result}%`;
      }
      
      return String(result);
    }
    
    if (Array.isArray(value)) {
      return value.map(v => String(v)).join(', ');
    }
    
    return String(value);
  }

  override beforeEnterEditMode() {
    return false; // 汇总字段不允许编辑
  }

  protected override render() {
    const { relationPropertyId, rollupFunction } = this.propertyData ?? {};
    
    // 未配置关联字段
    if (!relationPropertyId) {
      return html`
        <div class="${rollupCellStyle}">
          <span class="${rollupConfigStyle}">请配置汇总设置</span>
        </div>
      `;
    }

    const calculatedValue = this._calculateValue();
    
    // 空值
    if (calculatedValue == null || calculatedValue === '') {
      return html`
        <div class="${rollupCellStyle}">
          <span class="${rollupEmptyStyle}">-</span>
        </div>
      `;
    }

    // 显示原始值列表
    if (rollupFunction === 'show_original' && Array.isArray(calculatedValue)) {
      return html`
        <div class="${rollupCellStyle}">
          <div class="${rollupListStyle}">
            ${repeat(
              calculatedValue.slice(0, 5),
              (_, i) => i,
              (item) => html`
                <span class="${rollupListItemStyle}">${String(item)}</span>
              `
            )}
            ${calculatedValue.length > 5 
              ? html`<span class="${rollupListItemStyle}">+${calculatedValue.length - 5}</span>`
              : ''
            }
          </div>
        </div>
      `;
    }

    // 数值型结果
    if (typeof calculatedValue === 'number') {
      const isPercent = rollupFunction === 'percent_empty' || rollupFunction === 'percent_filled';
      return html`
        <div class="${rollupCellStyle}">
          <span class="${isPercent ? rollupPercentStyle : rollupNumberStyle}">
            ${this._formatValue(calculatedValue)}
          </span>
        </div>
      `;
    }

    // 其他值
    return html`
      <div class="${rollupCellStyle}">
        <span class="${rollupValueStyle}">${this._formatValue(calculatedValue)}</span>
      </div>
    `;
  }
}

export const rollupPropertyConfig = rollupPropertyModelConfig.createPropertyMeta({
  icon: createIcon('FunctionIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(RollupCell),
  },
});
