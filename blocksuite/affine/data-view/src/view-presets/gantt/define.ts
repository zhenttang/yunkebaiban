import type { GroupBy, GroupProperty } from '../../core/common/types.js';
import type { FilterGroup } from '../../core/filter/types.js';
import type { Sort } from '../../core/sort/types.js';
import { type BasicViewDataType, viewType } from '../../core/view/data-view.js';
import { GanttSingleView } from './gantt-view-manager.js';

export const ganttViewType = viewType('gantt');

/**
 * 甘特图列配置
 */
export type GanttViewColumn = {
  id: string;
  width: number;
  hide?: boolean;
  /** 甘特图专用配置 */
  ganttConfig?: {
    /** 任务条颜色 */
    color?: string;
    /** 任务条模式：solid-实心，striped-条纹，dotted-点状 */
    pattern?: 'solid' | 'striped' | 'dotted';
    /** 是否显示在时间轴上 */
    showInTimeline?: boolean;
  };
};

/**
 * 任务依赖关系
 */
export type TaskDependency = {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  /** 依赖类型 */
  type: 'finish-to-start' | 'start-to-start' | 'finish-to-finish' | 'start-to-finish';
  /** 延迟天数，可以为负数 */
  lag?: number;
  /** 是否允许拖拽时自动调整 */
  isFlexible?: boolean;
};

/**
 * 时间轴配置
 */
export type TimelineConfig = {
  /** 开始日期 (Unix 时间戳) */
  startDate: number;
  /** 结束日期 (Unix 时间戳) */
  endDate: number;
  /** 时间单位 */
  unit: 'day' | 'week' | 'month';
  /** 是否显示周末 */
  showWeekends: boolean;
  /** 工作日配置，1=周一，7=周日 */
  workingDays: number[];
  /** 每个时间单位的像素宽度 */
  unitWidth?: number;
};

/**
 * 显示选项配置
 */
export type DisplayConfig = {
  /** 是否显示关键路径 */
  showCriticalPath: boolean;
  /** 是否显示进度条 */
  showProgress: boolean;
  /** 紧凑模式 */
  compactMode: boolean;
  /** 是否显示依赖关系 */
  showDependencies: boolean;
  /** 是否显示工作日网格 */
  showWorkingDayGrid: boolean;
};

/**
 * 甘特图任务数据
 */
export type GanttTask = {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  workingDays: number[];
  progress: number;
  color: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
};

/**
 * 甘特图视图数据类型
 */
type GanttDataType = {
  columns: GanttViewColumn[];
  filter: FilterGroup;
  groupBy?: GroupBy;
  groupProperties?: GroupProperty[];
  sort?: Sort;
  header?: {
    titleColumn?: string;
    iconColumn?: string;
    imageColumn?: string;
  };
  
  /** 甘特图专用配置 */
  timeline: TimelineConfig;
  dependencies: TaskDependency[];
  display: DisplayConfig;
};

export type GanttViewData = BasicViewDataType<
  typeof ganttViewType.type,
  GanttDataType
>;

/**
 * 甘特图视图模型配置
 */
export const ganttViewModel = ganttViewType.createModel<GanttViewData>({
  defaultName: '甘特图',
  dataViewManager: GanttSingleView,
  defaultData: viewManager => {
    const now = Date.now();
    const oneMonthLater = now + 30 * 24 * 60 * 60 * 1000; // 30天后
    
    return {
      mode: 'gantt',
      columns: viewManager.dataSource.properties$.value.map(id => ({
        id,
        width: 200,
        hide: false,
        ganttConfig: {
          color: '#6366f1',
          pattern: 'solid',
          showInTimeline: true,
        },
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
      
      // 甘特图专用配置
      timeline: {
        startDate: now,
        endDate: oneMonthLater,
        unit: 'day',
        showWeekends: true,
        workingDays: [1, 2, 3, 4, 5], // 周一到周五
        unitWidth: 60,
      },
      dependencies: [],
      display: {
        showCriticalPath: false,
        showProgress: true,
        compactMode: false,
        showDependencies: true,
        showWorkingDayGrid: true,
      },
    };
  },
});