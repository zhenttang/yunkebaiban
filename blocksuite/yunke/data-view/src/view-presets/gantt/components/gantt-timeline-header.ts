import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { format } from 'date-fns/format';
import { addDays, addWeeks, addMonths, startOfWeek, getISOWeek } from 'date-fns';
import { computed, signal } from '@preact/signals-core';
import type { TimelineConfig, GanttViewData } from '../define.js';

/**
 * 时间轴单位数据
 */
export interface TimelineUnit {
  date: Date;
  endDate: Date;
  label: string;
  position: number;
  width: number;
  isWeekend: boolean;
  isToday: boolean;
  isWorkingDay: boolean;
}

/**
 * 甘特图时间轴头部组件
 */
@customElement('gantt-timeline-header')
export class GanttTimelineHeader extends LitElement {
  static override styles = css`
    :host {
      display: block;
      background: var(--yunke-background-primary-color);
      border-bottom: 1px solid var(--yunke-border-color);
      position: sticky;
      top: 0;
      z-index: 10;
      user-select: none;
    }

    .timeline-header {
      display: flex;
      height: 40px;
      font-size: 12px;
      font-weight: 500;
      color: var(--yunke-text-primary-color);
    }

    .timeline-unit {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 40px;
      height: 100%;
      border-right: 1px solid var(--yunke-border-color);
      background: var(--yunke-background-primary-color);
      transition: background-color 0.2s ease;
      cursor: pointer;
      
      &:hover {
        background: var(--yunke-hover-color);
      }
    }

    .timeline-unit.today {
      background: color-mix(in srgb, var(--yunke-primary-color) 10%, transparent);
      color: var(--yunke-primary-color);
      font-weight: 600;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--yunke-primary-color);
      }
    }

    .timeline-unit.weekend {
      background: var(--yunke-background-secondary-color);
      color: var(--yunke-text-secondary-color);
    }

    .timeline-unit.non-working-day {
      background: color-mix(in srgb, var(--yunke-background-secondary-color) 50%, transparent);
      color: var(--yunke-text-secondary-color);
    }

    .timeline-unit.selected {
      background: var(--yunke-primary-color);
      color: white;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .timeline-header {
        height: 32px;
        font-size: 10px;
      }
      
      .timeline-unit {
        min-width: 32px;
      }
    }

    /* 紧凑模式 */
    :host([compact]) .timeline-header {
      height: 28px;
      font-size: 10px;
    }
    
    :host([compact]) .timeline-unit {
      min-width: 24px;
    }
  `;

  /**
   * 时间轴配置
   */
  @property({ attribute: false })
  accessor timeline!: TimelineConfig;

  /**
   * 是否为紧凑模式
   */
  @property({ type: Boolean, reflect: true })
  accessor compact = false;

  /**
   * 选中的时间单位
   */
  @property({ attribute: false })
  accessor selectedUnits: Date[] = [];

  /**
   * 时间轴单位点击事件
   */
  @property({ attribute: false })
  accessor onUnitClick?: (date: Date, event: MouseEvent) => void;

  /**
   * 时间轴单位悬停事件
   */
  @property({ attribute: false })
  accessor onUnitHover?: (date: Date | null, event: MouseEvent) => void;

  /**
   * 缓存的时间轴单位
   */
  @state()
  private accessor _cachedUnits: TimelineUnit[] = [];

  /**
   * 生成时间轴单位
   */
  private generateTimelineUnits(): TimelineUnit[] {
    const { startDate, endDate, unit, unitWidth = 60, workingDays } = this.timeline;
    const units: TimelineUnit[] = [];
    
    let current = new Date(startDate);
    const end = new Date(endDate);
    let position = 0;

    while (current <= end) {
      const unitStart = new Date(current);
      let unitEnd: Date;
      let label: string;
      let width: number;

      switch (unit) {
        case 'day':
          unitEnd = addDays(current, 1);
          label = format(current, 'MM-dd');
          width = unitWidth;
          current = addDays(current, 1);
          break;

        case 'week':
          // 调整到周一开始
          const weekStart = startOfWeek(current, { weekStartsOn: 1 });
          unitEnd = addWeeks(weekStart, 1);
          label = `W${getISOWeek(current)}`;
          width = unitWidth * 7; // 一周的宽度
          current = addWeeks(current, 1);
          break;

        case 'month':
          unitEnd = addMonths(current, 1);
          label = format(current, 'yyyy-MM');
          width = unitWidth * this.getDaysInMonth(current);
          current = addMonths(current, 1);
          break;

        default:
          throw new Error(`Unsupported unit: ${unit}`);
      }

      const isWeekend = this.isWeekend(unitStart);
      const isToday = this.isToday(unitStart);
      const isWorkingDay = workingDays.includes(unitStart.getDay());

      units.push({
        date: unitStart,
        endDate: unitEnd,
        label,
        position,
        width,
        isWeekend,
        isToday,
        isWorkingDay,
      });

      position += width;
    }

    return units;
  }

  /**
   * 检查是否为周末
   */
  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 周日或周六
  }

  /**
   * 检查是否为今天
   */
  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  }

  /**
   * 获取月份天数
   */
  private getDaysInMonth(date: Date): number {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  /**
   * 检查时间单位是否被选中
   */
  private isUnitSelected(date: Date): boolean {
    return this.selectedUnits.some(selectedDate => 
      selectedDate.getTime() === date.getTime()
    );
  }

  /**
   * 处理时间单位点击
   */
  private handleUnitClick = (unit: TimelineUnit, event: MouseEvent) => {
    event.stopPropagation();
    this.onUnitClick?.(unit.date, event);
  };

  /**
   * 处理时间单位悬停
   */
  private handleUnitMouseEnter = (unit: TimelineUnit, event: MouseEvent) => {
    this.onUnitHover?.(unit.date, event);
  };

  /**
   * 处理鼠标离开
   */
  private handleMouseLeave = (event: MouseEvent) => {
    this.onUnitHover?.(null, event);
  };

  /**
   * 获取时间单位的 CSS 类名
   */
  private getUnitClasses(unit: TimelineUnit): string {
    const classes = ['timeline-unit'];
    
    if (unit.isToday) classes.push('today');
    if (unit.isWeekend) classes.push('weekend');
    if (!unit.isWorkingDay) classes.push('non-working-day');
    if (this.isUnitSelected(unit.date)) classes.push('selected');
    
    return classes.join(' ');
  }

  /**
   * 获取时间单位的工具提示
   */
  private getUnitTooltip(unit: TimelineUnit): string {
    const dateStr = format(unit.date, 'yyyy年MM月dd日');
    const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][unit.date.getDay()];
    
    let tooltip = `${dateStr} ${dayName}`;
    
    if (unit.isToday) tooltip += ' (今天)';
    if (unit.isWeekend) tooltip += ' (周末)';
    if (!unit.isWorkingDay) tooltip += ' (非工作日)';
    
    return tooltip;
  }

  override willUpdate(changedProperties: Map<string, unknown>) {
    super.willUpdate(changedProperties);
    
    // 如果时间轴配置发生变化，重新生成单位
    if (changedProperties.has('timeline')) {
      this._cachedUnits = this.generateTimelineUnits();
    }
  }

  override firstUpdated() {
    this._cachedUnits = this.generateTimelineUnits();
  }

  override render() {
    if (!this.timeline || this._cachedUnits.length === 0) {
      return html`<div class="timeline-header"></div>`;
    }

    return html`
      <div 
        class="timeline-header"
        @mouseleave=${this.handleMouseLeave}
      >
        ${this._cachedUnits.map(unit => html`
          <div
            class=${this.getUnitClasses(unit)}
            style="width: ${unit.width}px;"
            title=${this.getUnitTooltip(unit)}
            @click=${(e: MouseEvent) => this.handleUnitClick(unit, e)}
            @mouseenter=${(e: MouseEvent) => this.handleUnitMouseEnter(unit, e)}
          >
            ${unit.label}
          </div>
        `)}
      </div>
    `;
  }

  /**
   * 获取时间轴总宽度
   */
  getTimelineWidth(): number {
    return this._cachedUnits.reduce((total, unit) => total + unit.width, 0);
  }

  /**
   * 根据日期获取 X 坐标位置
   */
  getPositionByDate(date: Date): number {
    const targetTime = date.getTime();
    
    for (let i = 0; i < this._cachedUnits.length; i++) {
      const unit = this._cachedUnits[i];
      const unitStartTime = unit.date.getTime();
      const unitEndTime = unit.endDate.getTime();
      
      if (targetTime >= unitStartTime && targetTime < unitEndTime) {
        // 在当前单位内，计算精确位置
        const progress = (targetTime - unitStartTime) / (unitEndTime - unitStartTime);
        return unit.position + (progress * unit.width);
      }
    }
    
    // 如果日期超出范围，返回边界位置
    if (targetTime < this._cachedUnits[0].date.getTime()) {
      return 0;
    } else {
      const lastUnit = this._cachedUnits[this._cachedUnits.length - 1];
      return lastUnit.position + lastUnit.width;
    }
  }

  /**
   * 根据 X 坐标获取对应的日期
   */
  getDateByPosition(x: number): Date {
    for (const unit of this._cachedUnits) {
      if (x >= unit.position && x < unit.position + unit.width) {
        // 在当前单位内，计算精确日期
        const progress = (x - unit.position) / unit.width;
        const unitDuration = unit.endDate.getTime() - unit.date.getTime();
        return new Date(unit.date.getTime() + (progress * unitDuration));
      }
    }
    
    // 如果位置超出范围，返回边界日期
    if (x < 0) {
      return this._cachedUnits[0].date;
    } else {
      return this._cachedUnits[this._cachedUnits.length - 1].endDate;
    }
  }

  /**
   * 滚动到指定日期
   */
  scrollToDate(date: Date, behavior: ScrollBehavior = 'smooth') {
    const position = this.getPositionByDate(date);
    const container = this.parentElement;
    
    if (container && container.scrollTo) {
      container.scrollTo({
        left: position - container.clientWidth / 2,
        behavior,
      });
    }
  }

  /**
   * 滚动到今天
   */
  scrollToToday(behavior: ScrollBehavior = 'smooth') {
    this.scrollToDate(new Date(), behavior);
  }
}