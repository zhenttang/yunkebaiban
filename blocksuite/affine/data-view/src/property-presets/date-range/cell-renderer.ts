import {
  popMenu,
  popupTargetFromElement,
} from '@blocksuite/affine-components/context-menu';
import { DatePicker } from '@blocksuite/affine-components/date-picker';
import { createLitPortal } from '@blocksuite/affine-components/portal';
import { IS_MOBILE } from '@blocksuite/global/env';
import { flip, offset } from '@floating-ui/dom';
import { computed, signal } from '@preact/signals-core';
import { format } from 'date-fns/format';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import { BaseCellRenderer } from '../../core/property/index.js';
import { createFromBaseCellRenderer } from '../../core/property/renderer.js';
import { createIcon } from '../../core/utils/uni-icon.js';
import { 
  dateRangePropertyModelConfig,
  type DateRangeRawValue,
  type DateRangeJsonValue,
  validateDateRange,
} from './define.js';

/**
 * 日期范围单元格样式
 */
const dateRangeCellStyle = css`
  .date-range-cell {
    display: flex;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    font-size: var(--data-view-cell-text-size, 14px);
    color: var(--affine-text-primary-color);
    
    &:hover {
      background-color: var(--affine-hover-color);
    }
    
    &.editing {
      background-color: var(--affine-primary-color-04);
      border: 1px solid var(--affine-primary-color);
    }
  }
  
  .date-range-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .date-range-empty {
    color: var(--affine-text-secondary-color);
    font-style: italic;
  }
  
  .working-days-indicator {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 10px;
    color: var(--affine-text-secondary-color);
    background: var(--affine-background-secondary-color);
    padding: 2px 4px;
    border-radius: 2px;
  }
`;

/**
 * 日期范围编辑器样式
 */
const dateRangeEditorStyle = css`
  .date-range-editor {
    padding: 12px;
    background: var(--affine-background-primary-color);
    border-radius: 8px;
    box-shadow: var(--affine-shadow-2);
    min-width: 320px;
  }
  
  .date-inputs {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
  }
  
  .date-input-group {
    flex: 1;
  }
  
  .date-label {
    font-size: 12px;
    color: var(--affine-text-secondary-color);
    margin-bottom: 4px;
  }
  
  .date-separator {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    font-size: 12px;
    color: var(--affine-text-secondary-color);
  }
  
  .working-days-section {
    border-top: 1px solid var(--affine-border-color);
    padding-top: 12px;
  }
  
  .working-days-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--affine-text-primary-color);
    margin-bottom: 8px;
  }
  
  .working-days-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 4px;
  }
  
  .working-day-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 24px;
    border: 1px solid var(--affine-border-color);
    border-radius: 4px;
    background: var(--affine-background-primary-color);
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: var(--affine-primary-color);
    }
    
    &.active {
      background: var(--affine-primary-color);
      color: white;
      border-color: var(--affine-primary-color);
    }
  }
  
  .editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--affine-border-color);
  }
  
  .editor-button {
    padding: 6px 12px;
    border: 1px solid var(--affine-border-color);
    border-radius: 4px;
    background: var(--affine-background-primary-color);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: var(--affine-hover-color);
    }
    
    &.primary {
      background: var(--affine-primary-color);
      color: white;
      border-color: var(--affine-primary-color);
      
      &:hover {
        background: var(--affine-primary-color-hover);
      }
    }
  }
`;

/**
 * 日期范围单元格渲染器
 */
export class DateRangeCell extends BaseCellRenderer<DateRangeJsonValue, DateRangeRawValue> {
  static override styles = [dateRangeCellStyle, dateRangeEditorStyle];

  private _prevPortalAbortController: AbortController | null = null;

  /**
   * 临时编辑值
   */
  tempValue$ = signal<DateRangeRawValue | undefined>();

  /**
   * 工作日标签映射
   */
  private readonly dayLabels = ['日', '一', '二', '三', '四', '五', '六'];

  /**
   * 格式化显示值
   */
  formattedValue$ = computed(() => {
    const value = this.tempValue$.value || this.value;
    if (!value || (!value.startDate && !value.endDate)) {
      return '';
    }

    const startStr = value.startDate ? format(value.startDate, 'yyyy/MM/dd') : '';
    const endStr = value.endDate ? format(value.endDate, 'yyyy/MM/dd') : '';

    if (startStr && endStr) {
      return `${startStr} ~ ${endStr}`;
    } else if (startStr) {
      return `${startStr} ~`;
    } else if (endStr) {
      return `~ ${endStr}`;
    }

    return '';
  });

  /**
   * 工作日指示器文本
   */
  workingDaysText$ = computed(() => {
    const value = this.tempValue$.value || this.value;
    if (!value?.workingDays || value.workingDays.length === 7) {
      return '';
    }

    if (value.workingDays.length === 5 && 
        JSON.stringify(value.workingDays.sort()) === JSON.stringify([1, 2, 3, 4, 5])) {
      return '工作日';
    }

    return value.workingDays.map(day => this.dayLabels[day]).join('');
  });

  /**
   * 打开日期范围编辑器
   */
  private readonly openEditor = () => {
    if (
      this._prevPortalAbortController &&
      !this._prevPortalAbortController.signal.aborted
    ) {
      return;
    }

    // 初始化临时值
    this.tempValue$.value = this.value ? {
      ...this.value,
      workingDays: this.value.workingDays || [1, 2, 3, 4, 5],
    } : {
      startDate: null,
      endDate: null,
      workingDays: [1, 2, 3, 4, 5],
      timezone: 'Asia/Shanghai',
      includeEndDate: true,
    };

    this._prevPortalAbortController?.abort();
    const abortController = new AbortController();
    abortController.signal.addEventListener(
      'abort',
      () => {
        this.selectCurrentCell(false);
      },
      { once: true }
    );
    this._prevPortalAbortController = abortController;

    if (IS_MOBILE) {
      // 移动端使用弹出菜单
      this.openMobileEditor(abortController);
    } else {
      // 桌面端使用浮动编辑器
      this.openDesktopEditor(abortController);
    }
  };

  /**
   * 打开移动端编辑器
   */
  private openMobileEditor(abortController: AbortController) {
    popMenu(popupTargetFromElement(this), {
      options: {
        title: {
          text: this.property.name$.value,
        },
        onClose: () => {
          abortController.abort();
        },
        items: [
          () => this.renderEditor(),
        ],
      },
    });
  }

  /**
   * 打开桌面端编辑器
   */
  private openDesktopEditor(abortController: AbortController) {
    const root = createLitPortal({
      abortController,
      closeOnClickAway: true,
      computePosition: {
        referenceElement: this,
        placement: 'bottom-start',
        middleware: [offset(8), flip()],
      },
      template: () => this.renderEditor(),
    });

    root.style.zIndex = '1002';
  }

  /**
   * 渲染编辑器
   */
  private renderEditor() {
    return html`
      <div class="date-range-editor">
        <div class="date-inputs">
          <div class="date-input-group">
            <div class="date-label">开始日期</div>
            ${this.renderDatePicker('start')}
          </div>
          <div class="date-separator">~</div>
          <div class="date-input-group">
            <div class="date-label">结束日期</div>
            ${this.renderDatePicker('end')}
          </div>
        </div>
        
        <div class="working-days-section">
          <div class="working-days-title">工作日设置</div>
          <div class="working-days-grid">
            ${this.dayLabels.map((label, index) => this.renderWorkingDayToggle(index, label))}
          </div>
        </div>
        
        <div class="editor-actions">
          <button class="editor-button" @click=${this.cancelEdit}>
            取消
          </button>
          <button class="editor-button primary" @click=${this.confirmEdit}>
            确定
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 渲染日期选择器
   */
  private renderDatePicker(type: 'start' | 'end') {
    const datePicker = new DatePicker();
    const currentValue = this.tempValue$.value;
    
    datePicker.padding = 0;
    datePicker.value = type === 'start' 
      ? (currentValue?.startDate || Date.now())
      : (currentValue?.endDate || Date.now());

    datePicker.onChange = (date: Date) => {
      if (type === 'start') {
        this.tempValue$.value = {
          ...this.tempValue$.value!,
          startDate: date.getTime(),
        };
      } else {
        this.tempValue$.value = {
          ...this.tempValue$.value!,
          endDate: date.getTime(),
        };
      }
    };

    datePicker.onClear = () => {
      if (type === 'start') {
        this.tempValue$.value = {
          ...this.tempValue$.value!,
          startDate: null,
        };
      } else {
        this.tempValue$.value = {
          ...this.tempValue$.value!,
          endDate: null,
        };
      }
    };

    return datePicker;
  }

  /**
   * 渲染工作日切换按钮
   */
  private renderWorkingDayToggle(dayIndex: number, label: string) {
    const isActive = this.tempValue$.value?.workingDays?.includes(dayIndex) ?? false;
    
    return html`
      <button 
        class="working-day-toggle ${isActive ? 'active' : ''}"
        title="${this.getDayName(dayIndex)}"
        @click=${() => this.toggleWorkingDay(dayIndex)}
      >
        ${label}
      </button>
    `;
  }

  /**
   * 切换工作日
   */
  private toggleWorkingDay(dayIndex: number) {
    const currentWorkingDays = this.tempValue$.value?.workingDays || [];
    const newWorkingDays = currentWorkingDays.includes(dayIndex)
      ? currentWorkingDays.filter(d => d !== dayIndex)
      : [...currentWorkingDays, dayIndex].sort((a, b) => a - b);

    this.tempValue$.value = {
      ...this.tempValue$.value!,
      workingDays: newWorkingDays,
    };
  }

  /**
   * 获取星期名称
   */
  private getDayName(dayIndex: number): string {
    return ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][dayIndex];
  }

  /**
   * 确认编辑
   */
  private confirmEdit = () => {
    const tempValue = this.tempValue$.value;
    if (!tempValue) return;

    // 验证日期范围
    const validation = validateDateRange(tempValue);
    if (!validation.isValid) {
      // TODO: 显示错误提示
      console.warn('Invalid date range:', validation.error);
      return;
    }

    this.valueSetNextTick(tempValue);
    this.tempValue$.value = undefined;
    this._prevPortalAbortController?.abort();
  };

  /**
   * 取消编辑
   */
  private cancelEdit = () => {
    this.tempValue$.value = undefined;
    this._prevPortalAbortController?.abort();
  };

  override afterEnterEditingMode() {
    this.openEditor();
  }

  override beforeExitEditingMode() {
    this._prevPortalAbortController?.abort();
  }

  override render() {
    const formattedValue = this.formattedValue$.value;
    const workingDaysText = this.workingDaysText$.value;
    const isEmpty = !formattedValue;

    return html`
      <div 
        class="date-range-cell ${this.editing ? 'editing' : ''}"
        @click=${this.openEditor}
      >
        <span class="date-range-text ${isEmpty ? 'date-range-empty' : ''}">
          ${isEmpty ? '选择日期范围' : formattedValue}
        </span>
        ${workingDaysText ? html`
          <span class="working-days-indicator">
            ${workingDaysText}
          </span>
        ` : ''}
      </div>
    `;
  }
}

/**
 * 日期范围属性配置
 */
export const dateRangePropertyConfig = dateRangePropertyModelConfig.createPropertyMeta({
  icon: createIcon('DateTimeIcon'), // 使用日期图标
  cellRenderer: {
    view: createFromBaseCellRenderer(DateRangeCell),
  },
});