import { html } from 'lit';
import { state } from 'lit/decorators.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import {
  formulaCellStyle,
  formulaEmptyStyle,
  formulaErrorStyle,
  formulaValueStyle,
} from './cell-renderer-css.js';
import { formulaPropertyModelConfig, FORMULA_FUNCTIONS } from './define.js';

interface FormulaPropertyData {
  expression: string;
  resultType: 'text' | 'number' | 'date' | 'boolean';
  format?: {
    decimals?: number;
    prefix?: string;
    suffix?: string;
  };
}

type FormulaValue = string | number | boolean;

export class FormulaCell extends BaseCellRenderer<
  FormulaValue,
  FormulaValue,
  FormulaPropertyData
> {
  get _expression(): string {
    return this.propertyData?.expression ?? '';
  }

  get _resultType(): string {
    return this.propertyData?.resultType ?? 'text';
  }

  private _evaluateExpression(): { value: FormulaValue; error?: string } {
    const expression = this._expression;
    if (!expression) {
      return { value: '' };
    }

    try {
      // 获取当前行的所有字段值
      const rowData = this._getRowData();
      
      // 替换字段引用 {fieldName} 为实际值
      let processedExpr = expression;
      const fieldRefs = expression.match(/\{([^}]+)\}/g) || [];
      
      for (const ref of fieldRefs) {
        const fieldName = ref.slice(1, -1);
        const fieldValue = rowData[fieldName];
        
        if (fieldValue === undefined) {
          processedExpr = processedExpr.replace(ref, '""');
        } else if (typeof fieldValue === 'string') {
          processedExpr = processedExpr.replace(ref, `"${fieldValue}"`);
        } else {
          processedExpr = processedExpr.replace(ref, String(fieldValue));
        }
      }

      // 简单的表达式计算
      const result = this._safeEval(processedExpr);
      return { value: result };
    } catch (e) {
      return { value: '', error: String(e) };
    }
  }

  private _getRowData(): Record<string, unknown> {
    // 获取当前行的数据
    const data: Record<string, unknown> = {};
    
    try {
      const view = this.view;
      if (!view) return data;
      
      const properties = view.properties$.value;
      const rowId = this.rowId;
      
      for (const prop of properties) {
        if (prop.id === this.propertyId) continue; // 跳过当前公式字段
        const name = prop.name$.value;
        const value = view.cellRawGet(rowId, prop.id);
        if (name) {
          data[name] = value;
        }
      }
    } catch (e) {
      console.warn('Error getting row data:', e);
    }
    
    return data;
  }

  private _safeEval(expression: string): FormulaValue {
    // 创建一个安全的求值环境
    const safeContext = {
      ...FORMULA_FUNCTIONS,
      Math,
      Number,
      String,
      Boolean,
      Date,
      true: true,
      false: false,
      null: null,
    };

    // 使用 Function 构造器创建安全的求值函数
    const keys = Object.keys(safeContext);
    const values = Object.values(safeContext);
    
    try {
      const fn = new Function(...keys, `"use strict"; return (${expression});`);
      return fn(...values);
    } catch {
      // 如果表达式无效，尝试作为简单字符串返回
      return expression;
    }
  }

  private _formatValue(value: FormulaValue): string {
    if (value == null || value === '') return '';
    
    const format = this.propertyData?.format;
    let result = String(value);
    
    if (typeof value === 'number' && format?.decimals !== undefined) {
      result = value.toFixed(format.decimals);
    }
    
    if (format?.prefix) {
      result = format.prefix + result;
    }
    
    if (format?.suffix) {
      result = result + format.suffix;
    }
    
    return result;
  }

  override beforeEnterEditMode() {
    return false; // 公式字段不允许在单元格内编辑
  }

  protected override render() {
    const { value, error } = this._evaluateExpression();
    
    if (error) {
      return html`
        <div class="${formulaCellStyle}">
          <span class="${formulaErrorStyle}" title="${error}">#ERROR</span>
        </div>
      `;
    }
    
    if (value === '' || value == null) {
      return html`
        <div class="${formulaCellStyle}">
          <span class="${formulaEmptyStyle}">
            ${this._expression ? '计算中...' : '未设置公式'}
          </span>
        </div>
      `;
    }
    
    const displayValue = this._formatValue(value);
    
    return html`
      <div class="${formulaCellStyle}">
        <span class="${formulaValueStyle}">${displayValue}</span>
      </div>
    `;
  }

  @state()
  private accessor _error: string | undefined = undefined;
}

export const formulaPropertyConfig = formulaPropertyModelConfig.createPropertyMeta({
  icon: createIcon('FunctionIcon'),
  cellRenderer: {
    view: createFromBaseCellRenderer(FormulaCell),
  },
});
