import type { InsertToPosition } from '@blocksuite/yunke-shared/utils';
import { SignalWatcher, WithDisposable } from '@blocksuite/global/lit';
import { ShadowlessElement } from '@blocksuite/std';
import { computed } from '@preact/signals-core';
import { css, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { repeat } from 'lit/directives/repeat.js';

import { createUniComponentFromWebComponent, renderUniLit } from '../../../core/utils/uni-component/index.js';
import { DataViewUIBase, DataViewUILogicBase } from '../../../core/view/data-view-base.js';
import type { CalendarSingleView, CalendarEvent } from '../calendar-view-manager.js';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const WEEKDAYS_FROM_MONDAY = ['一', '二', '三', '四', '五', '六', '日'];

/**
 * 日历视图 UI 逻辑
 */
export class CalendarViewUILogic extends DataViewUILogicBase<CalendarSingleView> {
  override get type(): string {
    return 'calendar';
  }

  // 实现抽象方法
  override clearSelection = (): void => {
    this.setSelection(undefined);
  };

  override addRow = (position: InsertToPosition): string | undefined => {
    return this.view.rowAdd(position);
  };

  override focusFirstCell = (): void => {
    // 日历视图没有传统的单元格概念
  };

  override showIndicator = (_evt: MouseEvent): boolean => {
    return false;
  };

  override hideIndicator = (): void => {
    // 日历视图不需要拖拽指示器
  };

  override moveTo = (_id: string, _evt: MouseEvent): void => {
    // 日历视图的拖拽移动逻辑
  };

  get rootUILogic() {
    return this.root;
  }

  renderer = createUniComponentFromWebComponent(CalendarViewUI);

  currentDate$ = computed(() => {
    return this.view.calendarConfig?.currentDate ?? Date.now();
  });

  displayMode$ = computed(() => {
    return this.view.calendarConfig?.displayMode ?? 'month';
  });

  weekStartDay$ = computed(() => {
    return this.view.calendarConfig?.weekStartDay ?? 1;
  });

  /**
   * 获取当前月份的日历网格数据
   */
  calendarGrid$ = computed(() => {
    const currentDate = new Date(this.currentDate$.value);
    const displayMode = this.displayMode$.value;
    const weekStartDay = this.weekStartDay$.value;
    const events = this.view.calendarEvents$.value;

    if (displayMode === 'month') {
      return this.getMonthGrid(currentDate, weekStartDay, events);
    } else if (displayMode === 'week') {
      return this.getWeekGrid(currentDate, weekStartDay, events);
    } else {
      return this.getDayGrid(currentDate, events);
    }
  });

  private getMonthGrid(
    date: Date,
    weekStartDay: number,
    events: CalendarEvent[]
  ): CalendarDay[][] {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // 获取当月第一天
    const firstDay = new Date(year, month, 1);
    // 获取当月最后一天
    const lastDay = new Date(year, month + 1, 0);
    
    // 计算起始偏移（需要显示上个月的几天）
    let startOffset = firstDay.getDay() - weekStartDay;
    if (startOffset < 0) startOffset += 7;
    
    const grid: CalendarDay[][] = [];
    let currentWeek: CalendarDay[] = [];
    
    // 填充上个月的日期
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const dayDate = new Date(year, month - 1, dayNum);
      currentWeek.push({
        date: dayDate,
        dayNumber: dayNum,
        isCurrentMonth: false,
        isToday: this.isToday(dayDate),
        events: this.getEventsForDate(dayDate, events),
      });
    }
    
    // 填充当月日期
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(year, month, day);
      currentWeek.push({
        date: dayDate,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: this.isToday(dayDate),
        events: this.getEventsForDate(dayDate, events),
      });
      
      if (currentWeek.length === 7) {
        grid.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // 填充下个月的日期
    let nextMonthDay = 1;
    while (currentWeek.length < 7 && currentWeek.length > 0) {
      const dayDate = new Date(year, month + 1, nextMonthDay);
      currentWeek.push({
        date: dayDate,
        dayNumber: nextMonthDay,
        isCurrentMonth: false,
        isToday: this.isToday(dayDate),
        events: this.getEventsForDate(dayDate, events),
      });
      nextMonthDay++;
    }
    
    if (currentWeek.length > 0) {
      grid.push(currentWeek);
    }
    
    return grid;
  }

  private getWeekGrid(
    date: Date,
    weekStartDay: number,
    events: CalendarEvent[]
  ): CalendarDay[][] {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    let diff = day - weekStartDay;
    if (diff < 0) diff += 7;
    startOfWeek.setDate(startOfWeek.getDate() - diff);

    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      week.push({
        date: dayDate,
        dayNumber: dayDate.getDate(),
        isCurrentMonth: true,
        isToday: this.isToday(dayDate),
        events: this.getEventsForDate(dayDate, events),
      });
    }

    return [week];
  }

  private getDayGrid(date: Date, events: CalendarEvent[]): CalendarDay[][] {
    return [[{
      date: date,
      dayNumber: date.getDate(),
      isCurrentMonth: true,
      isToday: this.isToday(date),
      events: this.getEventsForDate(date, events),
    }]];
  }

  private isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  private getEventsForDate(date: Date, events: CalendarEvent[]): CalendarEvent[] {
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    
    return events.filter(event => {
      return event.startDate >= dayStart && event.startDate < dayEnd;
    });
  }

  /**
   * 获取当前显示的标题（年月）
   */
  headerTitle$ = computed(() => {
    const date = new Date(this.currentDate$.value);
    const displayMode = this.displayMode$.value;
    
    if (displayMode === 'month') {
      return `${date.getFullYear()}年${date.getMonth() + 1}月`;
    } else if (displayMode === 'week') {
      const weekStart = new Date(date);
      const day = weekStart.getDay();
      const diff = day - (this.weekStartDay$.value);
      if (diff < 0) weekStart.setDate(weekStart.getDate() + diff + 7);
      else weekStart.setDate(weekStart.getDate() - diff);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${weekStart.getFullYear()}年${weekStart.getMonth() + 1}月 ${weekStart.getDate()}-${weekEnd.getDate()}日`;
      } else {
        return `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
      }
    } else {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    }
  });
}

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

/**
 * 日历视图 UI 组件
 */
export class CalendarViewUI extends DataViewUIBase<CalendarViewUILogic> {
  static override styles = css`
    calendar-view-ui {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 400px;
      background: var(--yunke-background-primary-color);
      border-radius: 8px;
      overflow: hidden;
    }

    .calendar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      border-bottom: 1px solid var(--yunke-border-color);
    }

    .calendar-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--yunke-text-primary-color);
    }

    .calendar-nav {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .calendar-nav-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 4px;
      background: var(--yunke-background-secondary-color);
      color: var(--yunke-text-primary-color);
      cursor: pointer;
      transition: background 0.2s;
    }

    .calendar-nav-btn:hover {
      background: var(--yunke-hover-color);
    }

    .calendar-today-btn {
      padding: 4px 12px;
      border: 1px solid var(--yunke-border-color);
      border-radius: 4px;
      background: transparent;
      color: var(--yunke-text-primary-color);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .calendar-today-btn:hover {
      background: var(--yunke-hover-color);
    }

    .calendar-mode-selector {
      display: flex;
      gap: 4px;
      margin-left: 16px;
    }

    .calendar-mode-btn {
      padding: 4px 12px;
      border: 1px solid var(--yunke-border-color);
      border-radius: 4px;
      background: transparent;
      color: var(--yunke-text-secondary-color);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .calendar-mode-btn.active {
      background: var(--yunke-brand-color);
      color: white;
      border-color: var(--yunke-brand-color);
    }

    .calendar-mode-btn:hover:not(.active) {
      background: var(--yunke-hover-color);
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      padding: 8px 16px;
      background: var(--yunke-background-secondary-color);
    }

    .calendar-weekday {
      text-align: center;
      font-size: 12px;
      font-weight: 500;
      color: var(--yunke-text-secondary-color);
      padding: 8px 0;
    }

    .calendar-grid {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0 16px 16px;
      overflow-y: auto;
    }

    .calendar-week {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      flex: 1;
      min-height: 80px;
    }

    .calendar-day {
      border: 1px solid var(--yunke-border-color);
      border-right: none;
      border-bottom: none;
      padding: 4px;
      min-height: 80px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .calendar-day:last-child {
      border-right: 1px solid var(--yunke-border-color);
    }

    .calendar-week:last-child .calendar-day {
      border-bottom: 1px solid var(--yunke-border-color);
    }

    .calendar-day:hover {
      background: var(--yunke-hover-color);
    }

    .calendar-day.other-month {
      background: var(--yunke-background-secondary-color);
    }

    .calendar-day.other-month .day-number {
      color: var(--yunke-text-tertiary-color);
    }

    .calendar-day.today {
      background: rgba(var(--yunke-brand-color-rgb), 0.1);
    }

    .day-number {
      font-size: 14px;
      font-weight: 500;
      color: var(--yunke-text-primary-color);
      margin-bottom: 4px;
    }

    .calendar-day.today .day-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      background: var(--yunke-brand-color);
      color: white;
      border-radius: 50%;
    }

    .day-events {
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: hidden;
    }

    .day-event {
      padding: 2px 6px;
      font-size: 11px;
      background: var(--yunke-brand-color);
      color: white;
      border-radius: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      cursor: pointer;
    }

    .day-event:hover {
      opacity: 0.9;
    }

    .day-more {
      font-size: 11px;
      color: var(--yunke-text-secondary-color);
      padding: 2px 0;
    }

    .no-date-property {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: var(--yunke-text-secondary-color);
      gap: 12px;
    }

    .no-date-property-icon {
      font-size: 48px;
      opacity: 0.5;
    }

    .no-date-property-text {
      font-size: 14px;
    }
  `;

  private handlePrevious = () => {
    this.logic.view.navigatePrevious();
  };

  private handleNext = () => {
    this.logic.view.navigateNext();
  };

  private handleToday = () => {
    this.logic.view.navigateToday();
  };

  private handleModeChange = (mode: 'month' | 'week' | 'day') => {
    this.logic.view.setDisplayMode(mode);
  };

  private handleDayClick = (day: CalendarDay) => {
    // 点击日期添加新事件
    this.logic.view.addEvent(day.date.getTime());
  };

  private handleEventClick = (event: CalendarEvent, e: Event) => {
    e.stopPropagation();
    // 打开详情面板
    this.logic.rootUILogic.openDetailPanel({
      view: this.logic.view,
      rowId: event.rowId,
    });
  };

  override render() {
    const datePropertyId = this.logic.view.datePropertyId$.value;
    const displayMode = this.logic.displayMode$.value;
    const weekStartDay = this.logic.weekStartDay$.value;
    const weekdays = weekStartDay === 0 ? WEEKDAYS : WEEKDAYS_FROM_MONDAY;

    // 渲染数据库头部（包含视图切换器）
    const headerWidget = renderUniLit(this.logic.root.config.headerWidget, {
      dataViewLogic: this.logic,
    });

    if (!datePropertyId) {
      return html`
        ${headerWidget}
        <div class="no-date-property">
          <div class="no-date-property-icon">📅</div>
          <div class="no-date-property-text">
            请先添加一个日期类型的属性，然后在视图设置中选择它作为日历的日期字段
          </div>
        </div>
      `;
    }

    const grid = this.logic.calendarGrid$.value;

    return html`
      ${headerWidget}
      <div class="calendar-header">
        <div class="calendar-title">${this.logic.headerTitle$.value}</div>
        <div class="calendar-nav">
          <button class="calendar-nav-btn" @click=${this.handlePrevious}>
            ◀
          </button>
          <button class="calendar-today-btn" @click=${this.handleToday}>
            今天
          </button>
          <button class="calendar-nav-btn" @click=${this.handleNext}>
            ▶
          </button>
          <div class="calendar-mode-selector">
            <button
              class="calendar-mode-btn ${displayMode === 'month' ? 'active' : ''}"
              @click=${() => this.handleModeChange('month')}
            >
              月
            </button>
            <button
              class="calendar-mode-btn ${displayMode === 'week' ? 'active' : ''}"
              @click=${() => this.handleModeChange('week')}
            >
              周
            </button>
            <button
              class="calendar-mode-btn ${displayMode === 'day' ? 'active' : ''}"
              @click=${() => this.handleModeChange('day')}
            >
              日
            </button>
          </div>
        </div>
      </div>

      <div class="calendar-weekdays">
        ${weekdays.map(day => html`<div class="calendar-weekday">${day}</div>`)}
      </div>

      <div class="calendar-grid">
        ${repeat(
          grid,
          (_, weekIndex) => weekIndex,
          week => html`
            <div class="calendar-week">
              ${repeat(
                week,
                day => day.date.getTime(),
                day => html`
                  <div
                    class="calendar-day ${classMap({
                      'other-month': !day.isCurrentMonth,
                      'today': day.isToday,
                    })}"
                    @click=${() => this.handleDayClick(day)}
                  >
                    <div class="day-number">${day.dayNumber}</div>
                    <div class="day-events">
                      ${day.events.slice(0, 3).map(
                        event => html`
                          <div
                            class="day-event"
                            @click=${(e: Event) => this.handleEventClick(event, e)}
                          >
                            ${event.title || '无标题'}
                          </div>
                        `
                      )}
                      ${day.events.length > 3
                        ? html`<div class="day-more">
                            +${day.events.length - 3} 更多
                          </div>`
                        : nothing}
                    </div>
                  </div>
                `
              )}
            </div>
          `
        )}
      </div>
    `;
  }
}
