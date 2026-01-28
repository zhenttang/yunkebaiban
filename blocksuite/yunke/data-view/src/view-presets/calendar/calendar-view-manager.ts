import {
  insertPositionToIndex,
  type InsertToPosition,
} from '@blocksuite/yunke-shared/utils';
import { computed, type ReadonlySignal } from '@preact/signals-core';

import { evalFilter } from '../../core/filter/eval.js';
import { FilterTrait, filterTraitKey } from '../../core/filter/trait.js';
import type { FilterGroup } from '../../core/filter/types.js';
import { emptyFilterGroup } from '../../core/filter/utils.js';
import { PropertyBase } from '../../core/view-manager/property.js';
import { SingleViewBase } from '../../core/view-manager/single-view.js';
import type { CalendarConfig, CalendarViewData } from './define.js';

/**
 * 日历事件数据
 */
export interface CalendarEvent {
  rowId: string;
  title: string;
  startDate: number;
  endDate?: number;
  color?: string;
}

/**
 * 日历单视图管理器
 */
export class CalendarSingleView extends SingleViewBase<CalendarViewData> {
  propertiesRaw$ = computed(() => {
    const needShow = new Set(this.dataSource.properties$.value);
    const result: string[] = [];
    this.data$.value?.columns.forEach(v => {
      if (needShow.has(v.id)) {
        result.push(v.id);
        needShow.delete(v.id);
      }
    });
    result.push(...needShow);
    return result.map(id => this.propertyGetOrCreate(id));
  });

  properties$ = computed(() => {
    return this.propertiesRaw$.value.filter(property => !property.hide$.value);
  });

  detailProperties$ = computed(() => {
    return this.propertiesRaw$.value.filter(
      property => property.type$.value !== 'title'
    );
  });

  filter$ = computed(() => {
    return this.data$.value?.filter ?? emptyFilterGroup;
  });

  filterTrait = this.traitSet(
    filterTraitKey,
    new FilterTrait(this.filter$, this, {
      filterSet: filter => {
        this.dataUpdate(() => {
          return {
            filter,
          };
        });
      },
    })
  );

  mainProperties$ = computed(() => {
    return (
      this.data$.value?.header ?? {
        titleColumn: this.propertiesRaw$.value.find(
          property => property.type$.value === 'title'
        )?.id,
        iconColumn: 'type',
      }
    );
  });

  readonly$ = computed(() => {
    return this.manager.readonly$.value;
  });

  /**
   * 日历配置
   */
  calendarConfig$: ReadonlySignal<CalendarConfig | undefined> = computed(() => {
    return this.data$.value?.calendar;
  });

  /**
   * 日期属性 ID
   */
  datePropertyId$ = computed(() => {
    return this.calendarConfig$.value?.datePropertyId;
  });

  /**
   * 获取日历事件列表
   */
  calendarEvents$ = computed(() => {
    const events: CalendarEvent[] = [];
    const datePropertyId = this.datePropertyId$.value;
    const titlePropertyId = this.mainProperties$.value.titleColumn;

    if (!datePropertyId) {
      return events;
    }

    for (const row of this.rows$.value) {
      const dateCell = this.cellGetOrCreate(row.rowId, datePropertyId);
      const dateValue = dateCell.value$.value as number | undefined;

      if (!dateValue) continue;

      let title = '';
      if (titlePropertyId) {
        const titleCell = this.cellGetOrCreate(row.rowId, titlePropertyId);
        title = titleCell.stringValue$.value ?? '';
      }

      events.push({
        rowId: row.rowId,
        title,
        startDate: dateValue,
        endDate: undefined, // TODO: 支持结束日期
      });
    }

    return events;
  });

  get columns(): CalendarColumn[] {
    return this.propertiesRaw$.value.filter(property => !property.hide$.value);
  }

  get filter(): FilterGroup {
    return this.view?.filter ?? emptyFilterGroup;
  }

  get header() {
    return this.view?.header;
  }

  get type(): string {
    return this.view?.mode ?? 'calendar';
  }

  get view() {
    return this.data$.value;
  }

  get calendarConfig() {
    return this.view?.calendar;
  }

  /**
   * 更新日历配置
   */
  updateCalendarConfig(config: Partial<CalendarConfig>): void {
    this.dataUpdate(data => {
      return {
        calendar: {
          ...data.calendar,
          ...config,
        },
      };
    });
  }

  /**
   * 设置日期属性
   */
  setDateProperty(propertyId: string): void {
    this.updateCalendarConfig({ datePropertyId: propertyId });
  }

  /**
   * 设置显示模式
   */
  setDisplayMode(mode: CalendarConfig['displayMode']): void {
    this.updateCalendarConfig({ displayMode: mode });
  }

  /**
   * 设置当前日期
   */
  setCurrentDate(date: number): void {
    this.updateCalendarConfig({ currentDate: date });
  }

  /**
   * 导航到上一个周期
   */
  navigatePrevious(): void {
    const config = this.calendarConfig;
    if (!config) return;

    const current = new Date(config.currentDate);
    switch (config.displayMode) {
      case 'month':
        current.setMonth(current.getMonth() - 1);
        break;
      case 'week':
        current.setDate(current.getDate() - 7);
        break;
      case 'day':
        current.setDate(current.getDate() - 1);
        break;
    }
    this.setCurrentDate(current.getTime());
  }

  /**
   * 导航到下一个周期
   */
  navigateNext(): void {
    const config = this.calendarConfig;
    if (!config) return;

    const current = new Date(config.currentDate);
    switch (config.displayMode) {
      case 'month':
        current.setMonth(current.getMonth() + 1);
        break;
      case 'week':
        current.setDate(current.getDate() + 7);
        break;
      case 'day':
        current.setDate(current.getDate() + 1);
        break;
    }
    this.setCurrentDate(current.getTime());
  }

  /**
   * 导航到今天
   */
  navigateToday(): void {
    this.setCurrentDate(Date.now());
  }

  /**
   * 添加新事件（新行）
   */
  addEvent(date: number): string {
    const rowId = this.rowAdd('end');
    const datePropertyId = this.datePropertyId$.value;
    
    if (datePropertyId) {
      const cell = this.cellGetOrCreate(rowId, datePropertyId);
      cell.valueSet(date);
    }
    
    return rowId;
  }

  /**
   * 更新事件日期
   */
  updateEventDate(rowId: string, newDate: number): void {
    const datePropertyId = this.datePropertyId$.value;
    if (!datePropertyId) return;

    const cell = this.cellGetOrCreate(rowId, datePropertyId);
    cell.valueSet(newDate);
  }

  isShow(rowId: string): boolean {
    if (this.filter$.value?.conditions.length) {
      const rowMap = Object.fromEntries(
        this.properties$.value.map(column => [
          column.id,
          column.cellGetOrCreate(rowId).jsonValue$.value,
        ])
      );
      return evalFilter(this.filter$.value, rowMap);
    }
    return true;
  }

  propertyGetOrCreate(columnId: string): CalendarColumn {
    return new CalendarColumn(this, columnId);
  }
}

type CalendarColumnData = CalendarViewData['columns'][number];

export class CalendarColumn extends PropertyBase {
  override move(position: InsertToPosition): void {
    this.calendarView.dataUpdate(view => {
      const columnIndex = view.columns.findIndex(v => v.id === this.id);
      if (columnIndex < 0) {
        return {};
      }
      const columns = [...view.columns];
      const [column] = columns.splice(columnIndex, 1);
      if (!column) {
        return {};
      }
      const index = insertPositionToIndex(position, columns);
      columns.splice(index, 0, column);
      return {
        columns,
      };
    });
  }

  override hideSet(hide: boolean): void {
    this.viewDataUpdate(data => {
      return {
        ...data,
        hide,
      };
    });
  }

  hide$ = computed(() => {
    const hideFromViewData = this.viewData$.value?.hide;
    if (hideFromViewData != null) {
      return hideFromViewData;
    }
    const defaultShow = this.meta$.value?.config.fixed?.defaultShow;
    if (defaultShow != null) {
      return !defaultShow;
    }
    return false;
  });

  viewData$ = computed(() => {
    return this.calendarView.data$.value?.columns.find(v => v.id === this.id);
  });

  viewDataUpdate(
    updater: (viewData: CalendarColumnData) => Partial<CalendarColumnData>
  ): void {
    this.calendarView.dataUpdate(data => {
      return {
        ...data,
        columns: data.columns.map(v =>
          v.id === this.id ? { ...v, ...updater(v) } : v
        ),
      };
    });
  }

  constructor(
    private readonly calendarView: CalendarSingleView,
    columnId: string
  ) {
    super(calendarView, columnId);
  }
}
