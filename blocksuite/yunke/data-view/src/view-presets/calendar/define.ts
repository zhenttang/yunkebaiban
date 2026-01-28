import type { GroupBy, GroupProperty } from '../../core/common/types.js';
import type { FilterGroup } from '../../core/filter/types.js';
import type { Sort } from '../../core/sort/types.js';
import { type BasicViewDataType, viewType } from '../../core/view/data-view.js';
import { CalendarSingleView } from './calendar-view-manager.js';

export const calendarViewType = viewType('calendar');

/**
 * 日历视图列配置
 */
export type CalendarViewColumn = {
  id: string;
  hide?: boolean;
};

/**
 * 日历显示模式
 */
export type CalendarDisplayMode = 'month' | 'week' | 'day';

/**
 * 日历配置
 */
export type CalendarConfig = {
  /** 日期字段 ID - 用于确定事件在日历上的位置 */
  datePropertyId?: string;
  /** 结束日期字段 ID - 可选，用于显示跨天事件 */
  endDatePropertyId?: string;
  /** 显示模式 */
  displayMode: CalendarDisplayMode;
  /** 周起始日 0=周日, 1=周一 */
  weekStartDay: 0 | 1;
  /** 是否显示周末 */
  showWeekends: boolean;
  /** 是否显示周数 */
  showWeekNumbers: boolean;
  /** 当前查看的日期 (Unix 时间戳) */
  currentDate: number;
};

/**
 * 日历视图数据类型
 */
type CalendarDataType = {
  columns: CalendarViewColumn[];
  filter: FilterGroup;
  groupBy?: GroupBy;
  groupProperties?: GroupProperty[];
  sort?: Sort;
  header: {
    titleColumn?: string;
    iconColumn?: string;
    coverColumn?: string;
  };
  /** 日历专用配置 */
  calendar: CalendarConfig;
};

export type CalendarViewData = BasicViewDataType<
  typeof calendarViewType.type,
  CalendarDataType
>;

/**
 * 日历视图模型配置
 */
export const calendarViewModel = calendarViewType.createModel<CalendarViewData>({
  defaultName: '日历视图',
  dataViewManager: CalendarSingleView,
  defaultData: viewManager => {
    // 查找日期类型的属性
    const datePropertyId = viewManager.dataSource.properties$.value.find(
      id => {
        const type = viewManager.dataSource.propertyTypeGet(id);
        return type === 'date' || type === 'date-range';
      }
    );

    return {
      columns: viewManager.dataSource.properties$.value.map(id => ({
        id,
        hide: false,
      })),
      filter: {
        type: 'group',
        op: 'and',
        conditions: [],
      },
      header: {
        titleColumn: viewManager.dataSource.properties$.value.find(
          id => viewManager.dataSource.propertyTypeGet(id) === 'title'
        ),
        iconColumn: 'type',
      },
      groupProperties: [],
      calendar: {
        datePropertyId,
        displayMode: 'month',
        weekStartDay: 1, // 周一开始
        showWeekends: true,
        showWeekNumbers: false,
        currentDate: Date.now(),
      },
    };
  },
});
