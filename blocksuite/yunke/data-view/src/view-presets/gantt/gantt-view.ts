import { css, html, LitElement } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { computed } from '@preact/signals-core';
import type { DataViewManager } from '../../core/view-manager/view-manager.js';

import { GanttSingleView } from './gantt-view-manager.js';
import type { GanttViewData, GanttTask, TimelineConfig } from './define.js';
import { GanttTimelineHeader } from './components/gantt-timeline-header.js';
import './components/gantt-task-bar.js';
import {
  ganttLogger as logger,
  escapeHtml,
  getStatusDisplayName,
  getPriorityDisplayName,
  getTaskBarColor,
  getTaskBorderColor,
  isSameDay,
  getWeekStart,
} from './gantt-utils.js';
import { openTaskConfigPanel } from './gantt-task-config.js';
import { showTaskContextMenu } from './gantt-context-menu.js';
import {
  generateTimelineUnits,
  calculateTaskPosition,
  calculateTaskWidth,
  calculateTodayPosition,
  type TimelineUnit,
} from './gantt-timeline.js';

/**
 * 甘特图主视图组件
 */
@customElement('gantt-view')
export class GanttView extends LitElement {
  static {
  }
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--yunke-background-primary-color);
      font-family: var(--yunke-font-family);
      font-size: 14px;
      color: var(--yunke-text-primary-color);
      overflow: hidden;
    }

    .gantt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--yunke-border-color);
      background: var(--yunke-background-primary-color);
      min-height: 48px;
      flex-shrink: 0;
    }

    .gantt-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--yunke-text-primary-color);
    }

    .gantt-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .gantt-button {
      padding: 6px 12px;
      border: 1px solid var(--yunke-border-color);
      border-radius: 6px;
      background: var(--yunke-background-primary-color);
      color: var(--yunke-text-primary-color);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--yunke-hover-color);
        border-color: var(--yunke-primary-color);
      }
      
      &.primary {
        background: var(--yunke-primary-color);
        color: white;
        border-color: var(--yunke-primary-color);
        
        &:hover {
          background: var(--yunke-primary-color-hover);
        }
      }
    }

    .gantt-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: var(--yunke-background-primary-color);
    }

    /* 甘特图主体 - 专业甘特图布局 */
    .gantt-main {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    /* 左侧任务列表 */
    .task-list-column {
      width: 300px;
      flex-shrink: 0;
      border-right: 2px solid var(--yunke-border-color);
      background: var(--yunke-background-secondary-color);
      display: flex;
      flex-direction: column;
    }

    .task-list-header {
      height: 50px;
      padding: 12px 16px;
      font-weight: 600;
      color: var(--yunke-text-primary-color);
      border-bottom: 1px solid var(--yunke-border-color);
      display: flex;
      align-items: center;
      background: var(--yunke-background-primary-color);
    }

    .task-list-body {
      flex: 1;
      overflow-y: auto;
    }

    .task-row {
      height: 28px; /* 从32px进一步减少到28px */
      padding: 4px 16px; /* 从6px减少到4px */
      border-bottom: 1px solid var(--yunke-border-color);
      display: flex;
      align-items: center;
      background: var(--yunke-background-primary-color);
      
      &:hover {
        background: var(--yunke-hover-color);
      }
    }

    .task-name-display {
      font-size: 14px;
      color: var(--yunke-text-primary-color);
      cursor: pointer;
      width: 100%;
      
      &:hover {
        color: var(--yunke-primary-color);
      }
    }

    /* 右侧时间轴和甘特图区域 */
    .timeline-gantt-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    /* 时间轴头部 - 恢复正常滚动 */
    .timeline-header {
      height: 50px;
      border-bottom: 2px solid var(--yunke-border-color);
      background: var(--yunke-background-primary-color);
      display: flex;
      overflow-x: auto; /* 恢复水平滚动 */
      overflow-y: hidden;
      position: relative;
      scrollbar-width: thin;
    }
    
    /* 时间轴内容容器 - 正常布局 */
    .timeline-header-content {
      display: flex;
      flex-shrink: 0;
    }

    .timeline-unit {
      height: 100%;
      border-right: 1px solid var(--yunke-border-color);
      background: var(--yunke-background-primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
      color: var(--yunke-text-primary-color);
      flex-shrink: 0;
      
      &:hover {
        background: var(--yunke-hover-color);
      }
      
      &.today {
        background: var(--yunke-primary-color);
        color: white;
        font-weight: 600;
      }
    }

    /* 甘特图主体区域 */
    .gantt-chart-area {
      flex: 1;
      overflow: auto;
      position: relative;
      background: var(--yunke-background-primary-color);
      /* 同步滚动样式 */
      scrollbar-width: thin;
    }

    .gantt-chart-container {
      position: relative;
      min-height: 100%;
    }

    /* 垂直网格线 */
    .grid-lines {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      z-index: 1;
    }

    .grid-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 1px;
      background: var(--yunke-border-color);
      opacity: 0.5;
    }

    /* 甘特图行 - 每任务独占一行 */
    .gantt-chart-row {
      height: 28px; /* 从32px进一步减少到28px，与左侧任务行保持一致 */
      position: relative;
      width: 100%;
      
      &:hover {
        background: var(--yunke-hover-color-02);
      }
    }

    /* 任务条 - 填满格子的实心矩形 */
    .task-bar {
      position: absolute;
      top: 2px; /* 从4px减少到2px，适应更小的行高 */
      height: 24px; /* 保持24px高度 */
      border-radius: 4px;
      background: var(--yunke-primary-color);
      border: 1px solid rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      padding: 0 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: grab;
      z-index: 2;
      overflow: hidden;
      position: relative;
      
      &:hover {
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        transform: translateY(-1px);
      }
      
      /* 鼠标悬停时显示调整手柄 */
      &:hover .task-resize-handle {
        opacity: 1 !important;
      }
      
      &:active {
        cursor: grabbing;
      }
      
      /* 任务状态样式 */
      &.completed {
        opacity: 0.9;
      }
      
      &.paused {
        opacity: 0.7;
        background-image: repeating-linear-gradient(
          45deg,
          transparent,
          transparent 2px,
          rgba(255, 255, 255, 0.2) 2px,
          rgba(255, 255, 255, 0.2) 4px
        );
      }
      
      &.not_started {
        opacity: 0.6;
      }
      
      /* 优先级边框样式 */
      &.priority-urgent {
        border-left-width: 5px !important;
        box-shadow: 0 1px 3px rgba(239, 68, 68, 0.3);
      }
      
      &.priority-high {
        border-left-width: 4px !important;
        box-shadow: 0 1px 3px rgba(234, 88, 12, 0.3);
      }
      
      &.priority-medium {
        border-left-width: 3px !important;
      }
      
      &.priority-low {
        border-left-width: 2px !important;
        opacity: 0.8;
      }
    }

    /* 任务条调整手柄 */
    .task-resize-handle {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 6px;
      background: rgba(255, 255, 255, 0.4);
      opacity: 0;
      transition: all 0.2s ease;
      border-radius: 2px;
      
      &:hover {
        background: rgba(255, 255, 255, 0.8) !important;
        opacity: 1 !important;
        width: 8px;
      }
      
      &.task-resize-start {
        left: 0;
        cursor: ew-resize;
        border-top-left-radius: 4px;
        border-bottom-left-radius: 4px;
      }
      
      &.task-resize-end {
        right: 0;
        cursor: ew-resize;
        border-top-right-radius: 4px;
        border-bottom-right-radius: 4px;
      }
    }

    /* 任务进度条 */
    .task-progress-bar {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px 0 0 3px;
      z-index: 1;
      transition: width 0.3s ease;
    }

    .task-bar-label {
      font-size: 11px;
      color: white;
      font-weight: 500;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      z-index: 2;
      position: relative;
    }

    /* 任务完成指示器 */
    .task-complete-indicator {
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      width: 16px;
      height: 16px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: bold;
      color: #10b981;
      z-index: 3;
    }

    /* 当前时间线 - 红色垂直线 */
    .current-time-line {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #ff4757;
      z-index: 10;
      pointer-events: none;
    }

    .current-time-indicator {
      position: absolute;
      top: -6px;
      left: -6px;
      width: 14px;
      height: 14px;
      background: #ff4757;
      border-radius: 50%;
      border: 2px solid white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    /* 空状态 */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 300px;
      color: var(--yunke-text-secondary-color);
      font-size: 14px;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }

    .empty-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .usage-guide {
      text-align: left;
      width: 100%;
    }

    .usage-step {
      margin-bottom: 12px;
      padding: 8px 0;
    }

    .usage-step ul {
      margin: 8px 0 0 20px;
      padding: 0;
    }

    .usage-step li {
      margin-bottom: 4px;
      color: var(--yunke-text-primary-color);
    }

    .highlight {
      background: var(--yunke-primary-color-04);
      color: var(--yunke-primary-color);
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: 600;
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .gantt-header {
        padding: 8px 12px;
        min-height: 40px;
      }
      
      .gantt-title {
        font-size: 14px;
      }
      
      .task-name-cell {
        width: 200px;
      }
      
      .timeline-unit {
        height: 32px;
        font-size: 10px;
      }
    }
  `;

  /**
   * 视图管理器
   */
  @property({ attribute: false })
  accessor view!: GanttSingleView;

  /**
   * 选中的任务ID
   */
  @property({ attribute: false })
  accessor selectedTaskIds: string[] = [];

  /**
   * 是否只读模式
   */
  @property({ type: Boolean })
  accessor readonly = false;

  /**
   * 时间轴头部组件引用
   */
  @query('gantt-timeline-header')
  private accessor _timelineHeader?: GanttTimelineHeader;

  /**
   * 时间轴区域引用
   */
  @query('.timeline-area')
  private accessor _timelineArea?: HTMLElement;

  /**
   * 任务列表区域引用
   */
  @query('.task-list')
  private accessor _taskList?: HTMLElement;

  /**
   * 当前悬停的任务ID
   */
  @state()
  private accessor _hoveredTaskId: string | null = null;

  /**
   * 强制刷新标志 - 用于触发computed重新计算
   */
  @state()
  private accessor _forceRefresh: number = 0;

  /**
   * 甘特图任务数据 - 使用强制重新计算机制和数据源监听
   */

  /** 打开任务配置面板（委托给 gantt-task-config.ts） */
  private _openConfig(task: GanttTask) {
    openTaskConfigPanel(task, this.view, {
      onSave: () => {},
      onDelete: (t: GanttTask) => this.deleteTask(t),
      onForceUpdate: () => this.forceTasksDataUpdate(),
    });
  }

  /** 显示任务右键菜单（委托给 gantt-context-menu.ts） */
  private _showContextMenu(task: GanttTask, event: MouseEvent) {
    showTaskContextMenu(task, event, {
      onEdit: (t: GanttTask) => this._openConfig(t),
      onDelete: (t: GanttTask) => this.deleteTask(t),
    });
  }

  private readonly tasks$ = computed(() => {
    // 访问_forceRefresh确保每次都重新计算
    const refreshFlag = this._forceRefresh;
    logger.debug('🔍 [GanttView] Computing tasks... (refresh flag:', refreshFlag, ', timestamp:', Date.now(), ')');
    
    try {
      if (!this.view) {
        logger.debug('❌ [GanttView] No view available');
        return [];
      }

      // 强制监听数据源的变化 - 访问所有相关的signals
      const rows = this.view?.rows$?.value || [];
      const properties = this.view.properties$?.value || [];
      const dataSourceRows = this.view.dataSource.rows$.value || [];
      const dataSourceProperties = this.view.dataSource.properties$.value || [];
      
      logger.debug('📊 [GanttView] Found rows:', rows.length, rows);
      logger.debug('🔄 [GanttView] DataSource rows:', dataSourceRows.length);
      logger.debug('🔄 [GanttView] DataSource properties:', dataSourceProperties.length);
      
      if (rows.length === 0) {
        logger.debug('❌ [GanttView] No rows found');
        return [];
      }

      logger.debug('🏷️ [GanttView] Available properties:', properties.map(p => ({ 
        id: p.id, 
        type: this.view.dataSource.propertyTypeGet(p.id),
        name: p.name$?.value || 'unnamed'
      })));

      const tasks: GanttTask[] = [];

      for (const row of rows) {
        try {
          const rowId = row.rowId; // 使用正确的属性名
          logger.debug('🔍 [GanttView] Processing row ID:', rowId);
          logger.debug('📝 [GanttView] Got row object:', row);
          
          // 安全地获取属性
          const titleProperty = properties.find(
            p => {
              try {
                return this.view.dataSource.propertyTypeGet(p.id) === 'title';
              } catch (e) {
                logger.warn('⚠️ [GanttView] Error getting property type for', p.id, e);
                return false;
              }
            }
          );
          
          const dateRangeProperty = properties.find(
            p => {
              try {
                return this.view.dataSource.propertyTypeGet(p.id) === 'date-range';
              } catch (e) {
                logger.warn('⚠️ [GanttView] Error getting property type for', p.id, e);
                return false;
              }
            }
          );

          logger.debug('🏷️ [GanttView] Title property:', titleProperty?.id);
          logger.debug('📅 [GanttView] Date range property:', dateRangeProperty?.id);

          // 如果没有标题属性，跳过
          if (!titleProperty) {
            logger.debug('❌ [GanttView] No title property found, skipping row');
            continue;
          }

          let name: string;
          try {
            const titleValue = this.view.dataSource.cellValueGet(row.rowId, titleProperty.id);
            logger.debug('🔍 [GanttView] Title value structure:', titleValue, typeof titleValue);
            
            // 更完善的标题值处理逻辑
            if (typeof titleValue === 'string' && titleValue.trim()) {
              name = titleValue.trim();
            } else if (titleValue && typeof titleValue === 'object') {
              // 尝试多种可能的属性名
              if (titleValue.value && typeof titleValue.value === 'string' && titleValue.value.trim()) {
                name = titleValue.value.trim();
              } else if (titleValue.text && typeof titleValue.text === 'string' && titleValue.text.trim()) {
                name = titleValue.text.trim();
              } else if (titleValue.content && typeof titleValue.content === 'string' && titleValue.content.trim()) {
                name = titleValue.content.trim();
              } else if (titleValue.title && typeof titleValue.title === 'string' && titleValue.title.trim()) {
                name = titleValue.title.trim();
              } else if (Array.isArray(titleValue) && titleValue.length > 0) {
                // 处理数组形式的标题（可能是富文本）
                const firstItem = titleValue[0];
                if (typeof firstItem === 'string') {
                  name = firstItem.trim();
                } else if (firstItem && typeof firstItem === 'object' && firstItem.text) {
                  name = String(firstItem.text).trim();
                } else {
                  name = `任务 ${String(row.rowId).slice(-4)}`;
                }
              } else {
                // 尝试直接字符串化但避免 [object Object]
                const strValue = String(titleValue);
                if (strValue && strValue !== '[object Object]' && strValue.trim()) {
                  name = strValue.trim();
                } else {
                  name = `任务 ${String(row.rowId).slice(-4)}`;
                }
              }
            } else if (titleValue && typeof titleValue !== 'object') {
              // 非对象类型，直接转字符串
              const strValue = String(titleValue).trim();
              name = strValue || `任务 ${String(row.rowId).slice(-4)}`;
            } else {
              name = `任务 ${String(row.rowId).slice(-4)}`;
            }
            
            // 最终验证，确保名称不为空且不是 [object Object]
            if (!name || name === '[object Object]' || name.trim() === '' || name === 'undefined' || name === 'null') {
              name = `任务 ${String(row.rowId).slice(-4)}`;
            }
          } catch (e) {
            logger.warn('⚠️ [GanttView] Error getting title value:', e);
            name = `任务 ${String(row.rowId).slice(-4)}`;
          }
          
          logger.debug('📝 [GanttView] Task name:', name);

          // 处理日期范围 - 增强读取逻辑确保能读取拖拽保存的数据
          let startDate: number, endDate: number, workingDays: number[];
          
          if (dateRangeProperty) {
            try {
              const dateRangeValue = this.view.dataSource.cellValueGet(row.rowId, dateRangeProperty.id);
              logger.debug('📅 [GanttView] 读取日期范围数据:', {
                rowId: row.rowId,
                rawValue: dateRangeValue,
                valueType: typeof dateRangeValue
              });
              
              // 增强的数据结构解析逻辑 - 支持多种格式
              let dateRange = null;
              
              if (dateRangeValue) {
                // 优先级1: 嵌套value结构 {value: {startDate, endDate, workingDays}}
                if (dateRangeValue.value && typeof dateRangeValue.value === 'object') {
                  if (dateRangeValue.value.startDate && dateRangeValue.value.endDate) {
                    dateRange = dateRangeValue.value;
                    logger.debug('🎯 [GanttView] 使用嵌套value结构');
                  }
                }
                // 优先级2: 直接结构 {startDate, endDate, workingDays}
                else if (dateRangeValue.startDate && dateRangeValue.endDate) {
                  dateRange = dateRangeValue;
                  logger.debug('🎯 [GanttView] 使用直接结构');
                }
                // 优先级3: 可能的其他嵌套结构
                else if (typeof dateRangeValue === 'object') {
                  // 深层搜索可能的日期数据
                  const searchForDates = (obj: any): any => {
                    if (obj && typeof obj === 'object') {
                      // 直接检查当前对象
                      if (obj.startDate && obj.endDate) {
                        return obj;
                      }
                      // 递归搜索子对象
                      for (const key in obj) {
                        if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
                          const found = searchForDates(obj[key]);
                          if (found) return found;
                        }
                      }
                    }
                    return null;
                  };
                  
                  dateRange = searchForDates(dateRangeValue);
                  if (dateRange) {
                    logger.debug('🎯 [GanttView] 通过深层搜索找到日期数据');
                  }
                }
              }
              
              logger.debug('🔍 [GanttView] 解析后的日期范围:', dateRange);
              
              if (dateRange?.startDate && dateRange?.endDate) {
                // 验证日期数据的有效性
                const parsedStartDate = typeof dateRange.startDate === 'number' ? 
                  dateRange.startDate : Date.parse(dateRange.startDate);
                const parsedEndDate = typeof dateRange.endDate === 'number' ? 
                  dateRange.endDate : Date.parse(dateRange.endDate);
                
                if (!isNaN(parsedStartDate) && !isNaN(parsedEndDate)) {
                  startDate = parsedStartDate;
                  endDate = parsedEndDate;
                  workingDays = Array.isArray(dateRange.workingDays) ? 
                    dateRange.workingDays : [1, 2, 3, 4, 5];
                  
                  logger.debug('✅ [GanttView] 成功使用保存的日期范围:', {
                    rowId: row.rowId,
                    startDate: new Date(startDate).toLocaleDateString('zh-CN'),
                    endDate: new Date(endDate).toLocaleDateString('zh-CN'),
                    workingDays,
                    source: '已保存的拖拽数据'
                  });
                } else {
                  throw new Error('日期数据格式无效');
                }
              } else {
                throw new Error('找不到有效的日期范围数据');
              }
              
            } catch (e) {
              logger.warn('⚠️ [GanttView] 读取保存的日期范围失败，使用默认值:', {
                rowId: row.rowId,
                error: e.message
              });
              
              // 使用默认日期范围
              const now = Date.now();
              startDate = now;
              endDate = now + 7 * 24 * 60 * 60 * 1000; // 7天后
              workingDays = [1, 2, 3, 4, 5];
            }
          } else {
            // 没有日期范围属性，使用默认值
            const now = Date.now();
            startDate = now;
            endDate = now + 7 * 24 * 60 * 60 * 1000; // 7天后
            workingDays = [1, 2, 3, 4, 5];
            logger.debug('⚠️ [GanttView] No date-range property, using default dates');
          }

          const task: GanttTask = {
            id: row.rowId,
            name,
            startDate,
            endDate,
            workingDays,
            progress: this.getTaskProgress(row) || 0,
            color: this.getTaskColor(row) || '#6366f1',
            priority: this.getTaskPriority(row) || 'medium',
            status: this.getTaskStatus(row) || 'not_started',
          };

          logger.debug('✅ [GanttView] Created task:', task);
          tasks.push(task);
        } catch (e) {
          logger.error('❌ [GanttView] Error processing row:', row.rowId, e);
          // 继续处理下一行
        }
      }

      logger.debug('🎉 [GanttView] Final tasks:', tasks.length);
      return tasks;
    } catch (e) {
      logger.error('❌ [GanttView] Fatal error in tasks$ computed:', e);
      return [];
    }
  });

  /**
   * 获取任务进度
   */
  private getTaskProgress(row: any): number {
    try {
      const progressProperty = this.view?.properties$?.value?.find(
        p => {
          try {
            const name = p.name$?.value;
            return name === '进度' || name === 'Progress' || this.view.dataSource.propertyTypeGet(p.id) === 'progress';
          } catch (e) {
            return false;
          }
        }
      );
      
      if (progressProperty) {
        const value = this.view.dataSource.cellValueGet(row.rowId, progressProperty.id)?.value;
        return typeof value === 'number' ? value : 0;
      }
    } catch (e) {
      logger.warn('⚠️ [GanttView] Error getting task progress:', e);
    }
    
    return 0;
  }

  /**
   * 获取任务颜色
   */
  private getTaskColor(row: any): string {
    try {
      // 可以基于标签、优先级等确定颜色
      const tagProperty = this.view?.properties$?.value?.find(
        p => {
          try {
            return this.view.dataSource.propertyTypeGet(p.id) === 'multi-select';
          } catch (e) {
            return false;
          }
        }
      );
      
      if (tagProperty) {
        const tags = this.view.dataSource.cellValueGet(row.rowId, tagProperty.id)?.value;
        if (tags && tags.length > 0) {
          // 基于第一个标签的颜色
          return tags[0].color || '#6366f1';
        }
      }
    } catch (e) {
      logger.warn('⚠️ [GanttView] Error getting task color:', e);
    }
    
    return '#6366f1';
  }

  /**
   * 获取任务优先级
   */
  private getTaskPriority(row: any): GanttTask['priority'] {
    try {
      const priorityProperty = this.view?.properties$?.value?.find(
        p => {
          try {
            const name = p.name$?.value;
            return name === '优先级' || name === 'Priority';
          } catch (e) {
            return false;
          }
        }
      );
      
      if (priorityProperty) {
        const value = this.view.dataSource.cellValueGet(row.rowId, priorityProperty.id)?.value;
        if (typeof value === 'string') {
          return value as GanttTask['priority'];
        }
      }
    } catch (e) {
      logger.warn('⚠️ [GanttView] Error getting task priority:', e);
    }
    
    return 'medium';
  }

  /**
   * 获取任务状态
   */
  private getTaskStatus(row: any): GanttTask['status'] {
    try {
      const statusProperty = this.view?.properties$?.value?.find(
        p => {
          try {
            const name = p.name$?.value;
            return name === '状态' || name === 'Status';
          } catch (e) {
            return false;
          }
        }
      );
      
      if (statusProperty) {
        const value = this.view.dataSource.cellValueGet(row.rowId, statusProperty.id)?.value;
        if (typeof value === 'string') {
          return value as GanttTask['status'];
        }
      }
    } catch (e) {
      logger.warn('⚠️ [GanttView] Error getting task status:', e);
    }
    
    return 'not_started';
  }

  /**
   * 处理添加任务
   */
  private handleAddTask = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug('➕ [GanttView] Add task clicked');
    
    if (this.view && !this.readonly) {
      try {
        const newRowId = this.view.rowAdd({ before: false });
        logger.debug('✅ [GanttView] Added new task row:', newRowId);
        
        // 强制重新渲染
        this.requestUpdate();
      } catch (error) {
        logger.error('❌ [GanttView] Error adding task:', error);
      }
    } else {
      logger.warn('⚠️ [GanttView] Cannot add task: view not available or readonly');
    }
  };

  /**
   * 处理添加列
   */
  private handleAddColumn = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug('📋 [GanttView] Add column clicked');
    
    if (this.view && !this.readonly) {
      try {
        // 添加日期范围列 - 修复参数格式
        const columnId = this.view.propertyAdd({ before: false }, {
          type: 'date-range',
          name: '任务时间'
        });
        logger.debug('✅ [GanttView] Added new column:', columnId);
        
        // 强制重新渲染
        this.requestUpdate();
      } catch (error) {
        logger.error('❌ [GanttView] Error adding column:', error);
      }
    } else {
      logger.warn('⚠️ [GanttView] Cannot add column: view not available or readonly');
    }
  };

  /**
   * 处理今天按钮点击 - 精确定位到今天
   */
  private handleTodayClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug('📅 [GanttView] Today clicked - 定位到今天');
    
    if (this.view) {
      try {
        const now = Date.now();
        const timeline = this.view.timeline$.value;
        
        // 根据当前时间单位计算合适的时间范围
        let startDate: number;
        let endDate: number;
        
        switch (timeline?.unit || 'week') {
          case 'day':
            // 日视图：显示今天前后各7天
            const oneDay = 24 * 60 * 60 * 1000;
            startDate = now - 7 * oneDay;
            endDate = now + 14 * oneDay;
            break;
          case 'week':
            // 周视图：显示包含今天的周为中心的时间范围
            const oneWeek = 7 * 24 * 60 * 60 * 1000;
            const startOfWeek = getWeekStart(new Date(now)).getTime();
            startDate = startOfWeek - 2 * oneWeek; // 今天前2周
            endDate = startOfWeek + 6 * oneWeek;   // 今天后6周
            break;
          case 'month':
            // 月视图：显示包含今天的月为中心的时间范围
            const today = new Date(now);
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 4, 0); // 4个月范围
            startDate = startOfMonth.getTime();
            endDate = endOfMonth.getTime();
            break;
          default:
            // 默认按周处理
            const defaultOneWeek = 7 * 24 * 60 * 60 * 1000;
            const defaultStartOfWeek = getWeekStart(new Date(now)).getTime();
            startDate = defaultStartOfWeek - 2 * defaultOneWeek;
            endDate = defaultStartOfWeek + 6 * defaultOneWeek;
        }
        
        // 更新时间轴
        this.view.updateTimeline({
          startDate,
          endDate,
        });
        
        logger.debug('✅ [GanttView] 今日定位完成:', {
          unit: timeline?.unit || 'week',
          startDate: new Date(startDate).toLocaleDateString('zh-CN'),
          endDate: new Date(endDate).toLocaleDateString('zh-CN'),
          today: new Date(now).toLocaleDateString('zh-CN')
        });
        
        // 等待视图更新后滚动到今天的位置
        setTimeout(() => {
          this.scrollToToday();
        }, 100);
        
        this.requestUpdate();
      } catch (error) {
        logger.error('❌ [GanttView] Error scrolling to today:', error);
      }
    }
  };
  
  /**
   * 滚动到今天的位置 - 独立控制时间轴和甘特图滚动
   */
  private scrollToToday() {
    try {
      const timeline = this.view?.timeline$?.value;
      if (!timeline) return;
      
      const timelineUnits = generateTimelineUnits(timeline);
      const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);
      const todayPosition = calculateTodayPosition(timeline, totalWidth);
      
      if (todayPosition >= 0) {
        // 同时控制时间轴头部和甘特图主体的滚动
        const timelineHeader = this.querySelector('.timeline-header') as HTMLElement;
        const ganttChartArea = this.querySelector('.gantt-chart-area') as HTMLElement;
        
        if (timelineHeader || ganttChartArea) {
          // 计算滚动位置，居中显示今天
          const containerWidth = ganttChartArea?.clientWidth || timelineHeader?.clientWidth || 800;
          const scrollLeft = Math.max(0, todayPosition - containerWidth / 2);
          
          // 同步设置两个区域的滚动位置
          if (timelineHeader) {
            timelineHeader.scrollLeft = scrollLeft;
          }
          if (ganttChartArea) {
            ganttChartArea.scrollLeft = scrollLeft;
          }
          
          logger.debug('📍 [GanttView] 滚动到今天位置（独立滚动）:', {
            todayPosition: `${Math.round(todayPosition)}px`,
            scrollLeft: `${Math.round(scrollLeft)}px`,
            containerWidth: `${containerWidth}px`,
            timelineHeaderFound: !!timelineHeader,
            ganttChartAreaFound: !!ganttChartArea
          });
        } else {
          logger.warn('⚠️ [GanttView] 时间轴头部或甘特图区域未找到');
        }
      }
    } catch (error) {
      logger.error('❌ [GanttView] Error scrolling to today position:', error);
    }
  }

  /**
   * 处理时间单位变更
   **/
  private handleTimeUnitChange = (unit: 'day' | 'week' | 'month') => {
    logger.debug('🕒 [GanttView] Time unit changed to:', unit);
    
    if (this.view) {
      try {
        // 更新时间轴配置 - 根据单位调整宽度
        let unitWidth = 60; // 默认宽度
        switch (unit) {
          case 'day':
            unitWidth = 40;
            break;
          case 'week':
            unitWidth = 120;
            break;
          case 'month':
            unitWidth = 200;
            break;
        }
        
        this.view.updateTimeline({ 
          unit,
          unitWidth 
        });
        logger.debug('✅ [GanttView] Updated timeline unit to:', unit);
        
        // 强制重新渲染
        this.requestUpdate();
      } catch (error) {
        logger.error('❌ [GanttView] Error updating time unit:', error);
      }
    }
  };

  /**
   * 处理缩放
   */
  private handleZoomIn = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug('🔍 [GanttView] Zoom in clicked');
    
    if (this.view) {
      try {
        const currentWidth = this.view.timeline$.value?.unitWidth || 60;
        const newWidth = Math.min(currentWidth * 1.2, 200); // 最大200px
        this.view.updateTimeline({ unitWidth: newWidth });
        logger.debug('✅ [GanttView] Zoomed in, new width:', newWidth);
        
        this.requestUpdate();
      } catch (error) {
        logger.error('❌ [GanttView] Error zooming in:', error);
      }
    }
  };

  private handleZoomOut = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug('🔍 [GanttView] Zoom out clicked');
    
    if (this.view) {
      try {
        const currentWidth = this.view.timeline$.value?.unitWidth || 60;
        const newWidth = Math.max(currentWidth * 0.8, 20); // 最小20px
        this.view.updateTimeline({ unitWidth: newWidth });
        logger.debug('✅ [GanttView] Zoomed out, new width:', newWidth);
        
        this.requestUpdate();
      } catch (error) {
        logger.error('❌ [GanttView] Error zooming out:', error);
      }
    }
  };

  /**
   * 处理任务点击
   */
  private handleTaskClick = (task: GanttTask, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    logger.debug('👆 [GanttView] Task clicked:', task.name);
    
    if (event.ctrlKey || event.metaKey) {
      // 多选模式
      const isSelected = this.selectedTaskIds.includes(task.id);
      if (isSelected) {
        this.selectedTaskIds = this.selectedTaskIds.filter(id => id !== task.id);
      } else {
        this.selectedTaskIds = [...this.selectedTaskIds, task.id];
      }
    } else {
      // 单选模式
      this.selectedTaskIds = [task.id];
    }

    this.requestUpdate();
  };

  /**
   * 处理任务双击 - 打开任务配置面板
   */
  private handleTaskDoubleClick = (task: GanttTask, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    logger.debug('👆👆 [GanttView] Task double clicked:', task.name);
    
    // 打开任务配置面板
    this._openConfig(task);
  };

  /**
   * 处理任务右键菜单
   */
  private handleTaskRightClick = (task: GanttTask, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    logger.debug('🖱️ [GanttView] Task right clicked:', task.name);
    
    this._showContextMenu(task, event);
  };

  /**
   * 删除任务
   */
  private deleteTask(task: GanttTask) {
    try {
      if (this.view) {
        this.view.rowsDelete([task.id]);
        logger.debug('Task deleted:', task.id);
        this.requestUpdate();
      }
    } catch (error) {
      logger.error('Error deleting task:', error);
      alert('删除任务时出错，请稍后重试。');
    }
  }

  /**
   * 渲染头部工具栏
   */
  private renderHeader() {
    return html`
      <div class="gantt-header">
        <div class="gantt-title">甘特图</div>
        <div class="gantt-actions">
          <button 
            class="gantt-button"
            @click=${this.handleAddTask}
            title="添加新任务"
            style="background: var(--yunke-primary-color); color: white; font-weight: 600;"
          >
            + 添加任务
          </button>
          
          <button 
            class="gantt-button"
            @click=${this.handleAddColumn}
            title="添加新列"
          >
            + 添加列
          </button>
          
          <button 
            class="gantt-button"
            @click=${this.handleTodayClick}
            title="回到今天"
          >
            今天
          </button>
          
          <button 
            class="gantt-button"
            @click=${() => this.handleTimeUnitChange('day')}
            title="按天显示"
          >
            日
          </button>
          
          <button 
            class="gantt-button"
            @click=${() => this.handleTimeUnitChange('week')}
            title="按周显示"
          >
            周
          </button>
          
          <button 
            class="gantt-button"
            @click=${() => this.handleTimeUnitChange('month')}
            title="按月显示"
          >
            月
          </button>
          
          <button 
            class="gantt-button"
            @click=${this.handleZoomOut}
            title="缩小"
          >
            −
          </button>
          
          <button 
            class="gantt-button"
            @click=${this.handleZoomIn}
            title="放大"
          >
            +
          </button>
        </div>
      </div>
    `;
  }

  /**
   * 渲染专业甘特图 - 按用户规范实现
   * 特性：每任务独占一行，动态显示单位，填满格子的实心矩形条，垂直网格线，红色当前时间线
   */
  private renderRealGantt(tasks: GanttTask[]) {
    const timeline = this.view?.timeline$?.value;
    if (!timeline) return html`<div class="gantt-content">Loading...</div>`;

    // 使用用户选择的时间单位，不再强制周显示
    const timelineUnits = generateTimelineUnits(timeline);
    const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);
    const todayPosition = calculateTodayPosition(timeline, totalWidth);

    logger.debug('🎯 [GanttView] 渲染专业甘特图 (动态单位):', {
      taskCount: tasks.length,
      timelineWidth: totalWidth,
      timelineUnit: timeline.unit, // 显示当前时间单位
      timelineStart: new Date(timeline.startDate).toLocaleDateString(),
      timelineEnd: new Date(timeline.endDate).toLocaleDateString(),
      todayPosition: todayPosition >= 0 ? `${Math.round(todayPosition)}px` : '不在范围内',
      timelineUnits: timelineUnits.length
    });

    return html`
      <div class="gantt-content">
        <!-- 甘特图主体 - 专业布局：左侧任务列表 + 右侧时间轴 -->
        <div class="gantt-main">
          <!-- 左侧任务列表列（300px固定宽度）-->
          <div class="task-list-column">
            <div class="task-list-header">任务名称</div>
            <div class="task-list-body">
              ${tasks.map((task, index) => html`
                <div class="task-row" style="border-bottom: 1px solid var(--yunke-border-color);">
                  <div class="task-name-display" 
                       @click=${() => this._openConfig(task)}
                       @contextmenu=${(e: MouseEvent) => this.handleTaskRightClick(task, e)}
                       title="双击编辑任务">
                    ${task.name}
                  </div>
                </div>
              `)}
            </div>
          </div>

          <!-- 右侧时间轴和甘特图区域 -->
          <div class="timeline-gantt-area">
            <!-- 时间轴头部（动态单位显示）-->
            <div class="timeline-header">
              <div class="timeline-header-content" style="width: ${totalWidth}px;">
                ${timelineUnits.map(unit => html`
                  <div 
                    class="timeline-unit ${unit.isToday ? 'today' : ''}"
                    style="width: ${unit.width}px; min-width: ${unit.width}px;"
                    title="${unit.tooltip}"
                  >
                    ${unit.label}
                  </div>
                `)}
              </div>
            </div>

            <!-- 甘特图主体区域 -->
            <div class="gantt-chart-area">
              <div class="gantt-chart-container" style="width: ${totalWidth}px; min-width: ${totalWidth}px;">
                <!-- 垂直网格线（按时间单位分隔）-->
                <div class="grid-lines">
                  ${timelineUnits.map((unit, index) => {
                    const leftPosition = timelineUnits.slice(0, index + 1).reduce((sum, u) => sum + u.width, 0);
                    return html`
                      <div 
                        class="grid-line"
                        style="left: ${leftPosition}px;"
                      ></div>
                    `;
                  })}
                </div>

                <!-- 红色当前时间线（今日线）-->
                ${todayPosition >= 0 && todayPosition <= totalWidth ? html`
                  <div class="current-time-line" style="left: ${todayPosition}px;">
                    <div class="current-time-indicator"></div>
                  </div>
                ` : ''}

                <!-- 任务行和任务条（每任务独占一行）-->
                ${tasks.map((task, taskIndex) => html`
                  <div class="gantt-chart-row" style="top: ${taskIndex * 28}px; height: 28px; position: relative;">
                    ${this.renderTaskBarOnTimeline(task, timeline, totalWidth)}
                  </div>
                `)}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * 在专业甘特图布局中渲染任务条 - 精确对齐时间轴的实心矩形条
   */
  private renderTaskBarOnTimeline(task: GanttTask, timeline: TimelineConfig, totalWidth: number) {
    const startDate = new Date(timeline.startDate);
    const endDate = new Date(timeline.endDate);
    const taskStart = new Date(task.startDate);
    const taskEnd = new Date(task.endDate);

    // 如果任务在时间轴范围外，不显示
    if (taskEnd < startDate || taskStart > endDate) {
      logger.debug('⚠️ [GanttView] 任务超出时间轴范围，不显示:', task.name);
      return html``;
    }

    // 精确计算任务条在时间轴上的位置，确保与时间轴对齐
    const left = calculateTaskPosition(taskStart, timeline, totalWidth);
    const width = calculateTaskWidth(taskStart, taskEnd, timeline, totalWidth);

    // 根据任务状态和优先级确定颜色
    const taskColor = getTaskBarColor(task.status, task.priority);
    const taskBorderColor = getTaskBorderColor(task.priority);

    // 计算任务持续天数
    const taskDuration = taskEnd.getTime() - taskStart.getTime();
    const durationDays = Math.ceil(taskDuration / (24 * 60 * 60 * 1000));

    logger.debug('📊 [GanttView] 任务条位置计算 (精确对齐时间轴):', {
      taskName: task.name,
      left: `${Math.round(left)}px`,
      width: `${Math.round(width)}px`,
      startDate: taskStart.toLocaleDateString('zh-CN'),
      endDate: taskEnd.toLocaleDateString('zh-CN'),
      duration: `${durationDays}天`,
      status: task.status,
      priority: task.priority,
      color: taskColor,
      timelineUnit: timeline.unit,
      修复说明: '任务时间与顶部时间轴精确对齐'
    });

    return html`
      <div 
        class="task-bar ${task.status} priority-${task.priority}"
        data-task-id="${task.id}"
        style="
          left: ${left}px; 
          width: ${width}px;
          background: ${taskColor};
          border-left: 4px solid ${taskBorderColor};
          position: absolute;
          top: 2px;
          height: 24px;
          cursor: grab;
          user-select: none;
        "
        @mousedown=${(e: MouseEvent) => {
          logger.debug('🖱️ Task mousedown triggered:', task.name);
          if (e.button === 0) { // 只处理左键
            this.handleTaskDragStart(task, e);
          }
        }}
        @click=${(e: MouseEvent) => {
          if (!this._draggedTask) { // 只有在非拖拽状态下才处理点击
            this.handleTaskClick(task, e);
          }
        }}
        @dblclick=${(e: MouseEvent) => {
          if (!this._draggedTask) {
            this.handleTaskDoubleClick(task, e);
          }
        }}
        @contextmenu=${(e: MouseEvent) => this.handleTaskRightClick(task, e)}
        title="${task.name}: ${taskStart.toLocaleDateString('zh-CN')} - ${taskEnd.toLocaleDateString('zh-CN')} (${durationDays}天)\n状态: ${getStatusDisplayName(task.status)}\n优先级: ${getPriorityDisplayName(task.priority)}\n进度: ${task.progress}%\n🖱️ 拖拽任务条中间移动，拖拽两端调整时间"
      >
        <!-- 左侧调整手柄（调整开始时间）-->
        <div 
          class="task-resize-handle task-resize-start"
          @mousedown=${(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            logger.debug('🔧 Left resize handle clicked:', task.name);
            if (e.button === 0) {
              this.handleTaskResizeStartDrag(task, e);
            }
          }}
          title="拖拽调整任务开始时间"
        ></div>
        
        <!-- 任务进度条 -->
        ${task.progress > 0 ? html`
          <div class="task-progress-bar" style="width: ${task.progress}%"></div>
        ` : ''}
        
        <!-- 任务标签 -->
        <div class="task-bar-label">${task.name}</div>
        
        <!-- 完成指示器 -->
        ${task.progress >= 100 ? html`<div class="task-complete-indicator">✓</div>` : ''}
        
        <!-- 右侧调整手柄（调整结束时间）-->
        <div 
          class="task-resize-handle task-resize-end"
          @mousedown=${(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            logger.debug('🔧 Right resize handle clicked:', task.name);
            if (e.button === 0) {
              this.handleTaskResizeEndDrag(task, e);
            }
          }}
          title="拖拽调整任务结束时间"
        ></div>
      </div>
    `;
  }

  // getTaskBarColor, getTaskBorderColor 宸茶縼绉诲埌 gantt-utils.ts
  // calculateTaskPosition 绛夊凡杩佺Щ鍒?gantt-timeline.ts

  /**
   * 处理任务名称更改
   */
  private handleTaskNameChange = (task: GanttTask, event: Event) => {
    const input = event.target as HTMLInputElement;
    const newName = input.value.trim();
    
    if (newName && newName !== task.name) {
      logger.debug('📝 [GanttView] Updating task name:', task.id, newName);
      
      // 找到标题属性并更新
      const properties = this.view?.properties$?.value || [];
      const titleProperty = properties.find(
        p => this.view.dataSource.propertyTypeGet(p.id) === 'title'
      );
      
      if (titleProperty) {
        try {
          this.view.dataSource.cellValueChange(task.id, titleProperty.id, newName);
          logger.debug('✅ [GanttView] Task name updated successfully');
        } catch (error) {
          logger.error('❌ [GanttView] Error updating task name:', error);
        }
      }
    }
  };

  /**
   * 当前拖拽的任务信息 - 包含DOM元素引用和当前计算的时间
   */
  @state()
  private accessor _draggedTask: {
    task: GanttTask;
    dragType: 'move' | 'resize-start' | 'resize-end';
    startX: number;
    originalStartDate: number;
    originalEndDate: number;
    currentStartDate?: number; // 当前计算的开始时间
    currentEndDate?: number;   // 当前计算的结束时间
    timelineConfig: TimelineConfig;
    totalWidth: number;
    element: HTMLElement; // 添加元素引用
  } | null = null;

  /**
   * 处理任务条拖拽开始 - 使用当前时间轴配置
   */
  private handleTaskDragStart = (task: GanttTask, event: MouseEvent) => {
    logger.debug('🚚 [GanttView] 任务拖拽开始（使用当前时间轴）:', task.name, event.button);
    
    event.preventDefault();
    event.stopPropagation();
    
    const timeline = this.view?.timeline$?.value;
    if (!timeline) {
      logger.debug('❌ No timeline available');
      return;
    }
    
    // 使用当前的时间轴配置，不再强制周显示
    const timelineUnits = generateTimelineUnits(timeline);
    const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);
    
    logger.debug('📊 [修复] 时间轴信息（使用当前单位）:', { 
      unit: timeline.unit,
      totalWidth, 
      units: timelineUnits.length,
      修复说明: '使用用户选择的时间单位而不是强制周显示'
    });
    
    // 获取当前点击的元素
    const targetElement = event.currentTarget as HTMLElement;
    logger.debug('🎯 Target element:', targetElement, targetElement.dataset.taskId);
    
    this._draggedTask = {
      task,
      dragType: 'move',
      startX: event.clientX,
      originalStartDate: task.startDate,
      originalEndDate: task.endDate,
      timelineConfig: timeline, // 使用当前时间轴配置
      totalWidth,
      element: targetElement // 保存元素引用
    };
    
    logger.debug('✅ [修复] 拖拽状态设置（时间轴一致性）:', {
      taskName: task.name,
      timelineUnit: timeline.unit,
      totalWidth,
      startX: event.clientX
    });
    
    // 添加全局鼠标事件监听
    document.addEventListener('mousemove', this.handleTaskDragMove, { passive: false });
    document.addEventListener('mouseup', this.handleTaskDragEnd, { passive: false });
    
    // 添加拖拽样式
    targetElement.style.opacity = '0.8';
    targetElement.style.cursor = 'grabbing';
    targetElement.style.zIndex = '1000';
    
    logger.debug('🎯 [修复] 拖拽监听器已添加，使用当前时间轴配置');
  };

  /**
   * 处理任务条开始时间拖拽 - 使用当前时间轴配置
   */
  private handleTaskResizeStartDrag = (task: GanttTask, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    logger.debug('🔧 [GanttView] Task resize start drag (使用当前时间轴):', task.name);
    
    const timeline = this.view?.timeline$?.value;
    if (!timeline) return;
    
    // 使用当前的时间轴配置，不再强制周显示
    const timelineUnits = generateTimelineUnits(timeline);
    const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);
    
    // 获取当前点击的元素
    const targetElement = event.currentTarget as HTMLElement;
    const taskBarElement = targetElement.closest('.task-bar') as HTMLElement;
    
    this._draggedTask = {
      task,
      dragType: 'resize-start',
      startX: event.clientX,
      originalStartDate: task.startDate,
      originalEndDate: task.endDate,
      timelineConfig: timeline, // 使用当前时间轴配置
      totalWidth,
      element: taskBarElement // 保存任务条元素引用
    };
    
    document.addEventListener('mousemove', this.handleTaskDragMove, { passive: false });
    document.addEventListener('mouseup', this.handleTaskDragEnd, { passive: false });
    
    // 改变鼠标样式
    document.body.style.cursor = 'ew-resize';
    
    logger.debug('✅ [修复] 左侧调整手柄拖拽设置（使用当前时间轴）:', {
      taskName: task.name,
      timelineUnit: timeline.unit,
      totalWidth
    });
  };

  /**
   * 处理任务条结束时间拖拽 - 使用当前时间轴配置
   */
  private handleTaskResizeEndDrag = (task: GanttTask, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    logger.debug('🔧 [GanttView] Task resize end drag (使用当前时间轴):', task.name);
    
    const timeline = this.view?.timeline$?.value;
    if (!timeline) return;
    
    // 使用当前的时间轴配置，不再强制周显示
    const timelineUnits = generateTimelineUnits(timeline);
    const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);
    
    // 获取当前点击的元素
    const targetElement = event.currentTarget as HTMLElement;
    const taskBarElement = targetElement.closest('.task-bar') as HTMLElement;
    
    this._draggedTask = {
      task,
      dragType: 'resize-end',
      startX: event.clientX,
      originalStartDate: task.startDate,
      originalEndDate: task.endDate,
      timelineConfig: timeline, // 使用当前时间轴配置
      totalWidth,
      element: taskBarElement // 保存任务条元素引用
    };
    
    document.addEventListener('mousemove', this.handleTaskDragMove, { passive: false });
    document.addEventListener('mouseup', this.handleTaskDragEnd, { passive: false });
    
    document.body.style.cursor = 'ew-resize';
    
    logger.debug('✅ [修复] 右侧调整手柄拖拽设置（使用当前时间轴）:', {
      taskName: task.name,
      timelineUnit: timeline.unit,
      totalWidth
    });
  };

  /**
   * 处理任务拖拽移动 - 支持移动和调整大小
   */
  private handleTaskDragMove = (event: MouseEvent) => {
    if (!this._draggedTask) {
      logger.debug('⚠️ No drag state available');
      return;
    }
    
    event.preventDefault();
    
    const { task, dragType, startX, originalStartDate, originalEndDate, timelineConfig, totalWidth, element } = this._draggedTask;
    const deltaX = event.clientX - startX;
    
    // 计算时间轴范围
    const timelineStart = new Date(timelineConfig.startDate);
    const timelineEnd = new Date(timelineConfig.endDate);
    const timelineSpan = timelineEnd.getTime() - timelineStart.getTime();
    
    // 计算基础时间偏移
    const baseTimeOffset = (deltaX / totalWidth) * timelineSpan;
    
    // 最小任务长度为1天
    const minDuration = 24 * 60 * 60 * 1000; // 1天
    
    let newStartDate: number;
    let newEndDate: number;
    
    // 根据拖拽类型处理不同的调整逻辑
    switch (dragType) {
      case 'resize-start':
        // 调整开始时间，保持结束时间不变
        newStartDate = originalStartDate + baseTimeOffset;
        newEndDate = originalEndDate;
        
        // 确保开始时间不晚于结束时间
        if (newStartDate >= newEndDate - minDuration) {
          newStartDate = newEndDate - minDuration;
        }
        
        // 限制在时间轴范围内
        if (newStartDate < timelineStart.getTime()) {
          newStartDate = timelineStart.getTime();
        }
        
        logger.debug('🔧 [调整开始时间]:', {
          原开始: new Date(originalStartDate).toLocaleDateString('zh-CN'),
          新开始: new Date(newStartDate).toLocaleDateString('zh-CN'),
          结束: new Date(newEndDate).toLocaleDateString('zh-CN'),
          拖拽像素: deltaX,
          时间偏移天数: Math.round(baseTimeOffset / (24 * 60 * 60 * 1000) * 10) / 10
        });
        break;
        
      case 'resize-end':
        // 调整结束时间，保持开始时间不变
        newStartDate = originalStartDate;
        newEndDate = originalEndDate + baseTimeOffset;
        
        // 确保结束时间不早于开始时间
        if (newEndDate <= newStartDate + minDuration) {
          newEndDate = newStartDate + minDuration;
        }
        
        // 限制在时间轴范围内
        if (newEndDate > timelineEnd.getTime()) {
          newEndDate = timelineEnd.getTime();
        }
        
        logger.debug('🔧 [调整结束时间]:', {
          开始: new Date(newStartDate).toLocaleDateString('zh-CN'),
          原结束: new Date(originalEndDate).toLocaleDateString('zh-CN'),
          新结束: new Date(newEndDate).toLocaleDateString('zh-CN'),
          拖拽像素: deltaX,
          时间偏移天数: Math.round(baseTimeOffset / (24 * 60 * 60 * 1000) * 10) / 10
        });
        break;
        
      case 'move':
      default:
        // 移动整个任务
        newStartDate = originalStartDate + baseTimeOffset;
        newEndDate = originalEndDate + baseTimeOffset;
        
        // 限制在时间轴范围内
        const taskDuration = originalEndDate - originalStartDate;
        if (newStartDate < timelineStart.getTime()) {
          newStartDate = timelineStart.getTime();
          newEndDate = newStartDate + taskDuration;
        }
        if (newEndDate > timelineEnd.getTime()) {
          newEndDate = timelineEnd.getTime();
          newStartDate = newEndDate - taskDuration;
        }
        
        logger.debug('🚚 [移动任务]:', {
          原开始: new Date(originalStartDate).toLocaleDateString('zh-CN'),
          新开始: new Date(newStartDate).toLocaleDateString('zh-CN'),
          原结束: new Date(originalEndDate).toLocaleDateString('zh-CN'),
          新结束: new Date(newEndDate).toLocaleDateString('zh-CN'),
          拖拽像素: deltaX,
          时间偏移天数: Math.round(baseTimeOffset / (24 * 60 * 60 * 1000) * 10) / 10
        });
        break;
    }
    
    // 直接更新保存的元素位置
    if (element && element.parentNode) {
      const taskStartOffset = Math.max(0, newStartDate - timelineStart.getTime());
      const taskDurationForWidth = newEndDate - Math.max(newStartDate, timelineStart.getTime());
      
      const left = (taskStartOffset / timelineSpan) * totalWidth;
      const width = Math.max(40, (taskDurationForWidth / timelineSpan) * totalWidth);
      
      element.style.left = `${left}px`;
      element.style.width = `${width}px`;
      element.style.transform = 'translateY(-2px)';
      element.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      
      logger.debug('✅ [更新元素位置]:', { 
        操作类型: dragType,
        拖拽像素: deltaX,
        left: `${Math.round(left)}px`, 
        width: `${Math.round(width)}px`,
        时间偏移天数: Math.round(baseTimeOffset / (24 * 60 * 60 * 1000) * 10) / 10
      });
    } else {
      logger.debug('⚠️ Element reference lost or removed from DOM');
    }
    
    // 保存计算结果到拖拽状态，以便在拖拽结束时使用
    this._draggedTask.currentStartDate = newStartDate;
    this._draggedTask.currentEndDate = newEndDate;
  };

  /**
   * 处理任务拖拽结束 - 支持移动和调整大小
   */
  private handleTaskDragEnd = (event: MouseEvent) => {
    if (!this._draggedTask) {
      logger.debug('⚠️ No drag state to end');
      return;
    }
    
    event.preventDefault();
    logger.debug('🏁 [GanttView] 任务拖拽结束（支持调整大小）');
    
    const { task, dragType, currentStartDate, currentEndDate, element } = this._draggedTask;
    
    // 使用已经计算好的时间值，如果没有则使用原始值（移动操作）
    let finalStartDate: number;
    let finalEndDate: number;
    
    if (currentStartDate !== undefined && currentEndDate !== undefined) {
      finalStartDate = currentStartDate;
      finalEndDate = currentEndDate;
    } else {
      // 回退到重新计算（移动操作的兼容性）
      const { startX, originalStartDate, originalEndDate, timelineConfig, totalWidth } = this._draggedTask;
      const deltaX = event.clientX - startX;
      const timelineStart = new Date(timelineConfig.startDate);
      const timelineEnd = new Date(timelineConfig.endDate);
      const timelineSpan = timelineEnd.getTime() - timelineStart.getTime();
      const baseTimeOffset = (deltaX / totalWidth) * timelineSpan;
      
      finalStartDate = originalStartDate + baseTimeOffset;
      finalEndDate = originalEndDate + baseTimeOffset;
      
      // 限制在时间轴范围内
      const taskDuration = originalEndDate - originalStartDate;
      if (finalStartDate < timelineStart.getTime()) {
        finalStartDate = timelineStart.getTime();
        finalEndDate = finalStartDate + taskDuration;
      }
      if (finalEndDate > timelineEnd.getTime()) {
        finalEndDate = timelineEnd.getTime();
        finalStartDate = finalEndDate - taskDuration;
      }
    }
    
    logger.debug('💾 [GanttView] 拖拽结束，保存调整后的时间:', {
      taskId: task.id,
      taskName: task.name,
      dragType,
      最终开始: new Date(finalStartDate).toLocaleDateString('zh-CN'),
      最终结束: new Date(finalEndDate).toLocaleDateString('zh-CN'),
      操作类型: dragType === 'resize-start' ? '调整开始时间' : 
               dragType === 'resize-end' ? '调整结束时间' : '移动任务'
    });
    
    // 先清理拖拽状态和事件监听
    this._draggedTask = null;
    document.removeEventListener('mousemove', this.handleTaskDragMove);
    document.removeEventListener('mouseup', this.handleTaskDragEnd);
    document.body.style.cursor = '';
    
    // 固定元素到最终位置，防止回跳
    if (element && element.parentNode) {
      const timelineStart = new Date(this.view?.timeline$?.value?.startDate || Date.now());
      const timelineEnd = new Date(this.view?.timeline$?.value?.endDate || Date.now());
      const timelineSpan = timelineEnd.getTime() - timelineStart.getTime();
      // 使用当前时间轴配置，不强制周显示
      const currentTimeline = this.view?.timeline$?.value;
      const timelineUnits = currentTimeline ? generateTimelineUnits(currentTimeline) : [];
      const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);
      
      const taskStartOffset = Math.max(0, finalStartDate - timelineStart.getTime());
      const taskDurationForWidth = finalEndDate - Math.max(finalStartDate, timelineStart.getTime());
      const finalLeft = (taskStartOffset / timelineSpan) * totalWidth;
      const finalWidth = Math.max(40, (taskDurationForWidth / timelineSpan) * totalWidth);
      
      // 固定到最终位置并锁定，防止任何回跳
      element.style.left = `${finalLeft}px`;
      element.style.width = `${finalWidth}px`;
      element.style.opacity = '';
      element.style.cursor = '';
      element.style.zIndex = '';
      element.style.transform = '';
      element.style.boxShadow = '';
      
      // 添加一个标记，防止重新渲染时重新计算位置
      element.setAttribute('data-drag-final-position', 'true');
      element.setAttribute('data-final-left', `${finalLeft}`);
      element.setAttribute('data-final-width', `${finalWidth}`);
      
      logger.debug('🔒 [GanttView] 锁定调整后的最终位置:', {
        dragType,
        finalLeft: `${Math.round(finalLeft)}px`,
        finalWidth: `${Math.round(finalWidth)}px`,
        locked: true
      });
    }
    
    // 异步保存数据，避免立即触发渲染
    setTimeout(() => {
      this.updateTaskDateRange(task.id, finalStartDate, finalEndDate, task.workingDays);
      
      // 保存完成后，移除位置锁定标记
      setTimeout(() => {
        if (element && element.parentNode) {
          element.removeAttribute('data-drag-final-position');
          element.removeAttribute('data-final-left');
          element.removeAttribute('data-final-width');
          logger.debug('🔓 [GanttView] 解除位置锁定，调整大小数据保存完成');
        }
      }, 100);
    }, 0);
    
    logger.debug('✅ [GanttView] 任务调整完成（支持调整大小）');
  };

  /**
   * 实时更新任务条的视觉位置（拖拽过程中） - 修复元素查找
   */
  private updateTaskBarPosition(taskId: string, newStartDate: number, newEndDate: number) {
    // 找到对应的任务条元素 - 使用更精确的选择器
    const taskBarElement = this.querySelector(`.task-bar[data-task-id="${taskId}"]`) as HTMLElement;
    
    if (!taskBarElement) {
      logger.debug('⚠️ Task bar element not found:', taskId);
      // 尝试通过任务名称查找
      const allTaskBars = this.querySelectorAll('.task-bar');
      logger.debug('🔍 Available task bars:', Array.from(allTaskBars).map(el => (el as HTMLElement).dataset.taskId));
      return;
    }
    
    const timeline = this.view?.timeline$?.value;
    if (!timeline) return;
    
    // 重新计算位置 - 使用当前时间轴配置
    const timelineStart = new Date(timeline.startDate);
    const timelineEnd = new Date(timeline.endDate);
    const timelineSpan = timelineEnd.getTime() - timelineStart.getTime();
    
    // 使用当前时间轴配置生成时间单位，不强制周显示
    const timelineUnits = generateTimelineUnits(timeline);
    const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);
    
    const taskStartOffset = Math.max(0, newStartDate - timelineStart.getTime());
    const taskDuration = newEndDate - Math.max(newStartDate, timelineStart.getTime());
    
    const left = (taskStartOffset / timelineSpan) * totalWidth;
    const width = Math.max(40, (taskDuration / timelineSpan) * totalWidth);
    
    // 更新元素位置
    taskBarElement.style.left = `${left}px`;
    taskBarElement.style.width = `${width}px`;
    taskBarElement.style.transform = 'translateY(-2px)';
    taskBarElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    
    logger.debug('✅ Updated visual position successfully:', { 
      taskId,
      left: `${Math.round(left)}px`, 
      width: `${Math.round(width)}px` 
    });
  }

  /**
   * 更新任务的日期范围到数据源 - 修复时序问题，避免回到顶部
   */
  private updateTaskDateRange(taskId: string, startDate: number, endDate: number, workingDays: number[]) {
    try {
      logger.debug('💾 [GanttView] 开始更新任务日期范围（修复时序）:', {
        taskId,
        startDate: new Date(startDate).toLocaleDateString('zh-CN'),
        endDate: new Date(endDate).toLocaleDateString('zh-CN'),
        workingDays,
        timestamp: new Date().toLocaleTimeString()
      });
      
      const properties = this.view?.properties$?.value || [];
      const dateRangeProperty = properties.find(p => {
        try {
          return this.view.dataSource.propertyTypeGet(p.id) === 'date-range';
        } catch (e) {
          return false;
        }
      });
      
      if (!dateRangeProperty) {
        logger.error('❌ [GanttView] 找不到日期范围属性，无法保存拖拽位置');
        return;
      }
      
      logger.debug('🏷️ [GanttView] 找到日期范围属性:', dateRangeProperty.id);
      
      // 直接同步保存数据，不使用setTimeout避免时序问题
      const dateRangeData = {
        startDate,
        endDate,
        workingDays
      };
      
      logger.debug('📤 [GanttView] 直接同步保存数据（避免时序问题）:', dateRangeData);
      
      // 使用直接格式保存，这个格式在读取时兼容性最好
      this.view.dataSource.cellValueChange(taskId, dateRangeProperty.id, dateRangeData);
      
      // 立即验证是否保存成功
      const verifyData = this.view.dataSource.cellValueGet(taskId, dateRangeProperty.id);
      logger.debug('🔍 [GanttView] 立即验证保存结果:', verifyData);
      
      if (verifyData && verifyData.startDate && verifyData.endDate) {
        logger.debug('✅ [GanttView] 数据同步保存成功:', {
          startDate: new Date(verifyData.startDate).toLocaleDateString('zh-CN'),
          endDate: new Date(verifyData.endDate).toLocaleDateString('zh-CN'),
          workingDays: verifyData.workingDays
        });
      } else {
        logger.warn('⚠️ [GanttView] 数据保存验证失败，尝试嵌套格式');
        
        // 如果直接格式失败，尝试嵌套格式
        const nestedData = {
          value: {
            startDate,
            endDate,
            workingDays
          }
        };
        
        this.view.dataSource.cellValueChange(taskId, dateRangeProperty.id, nestedData);
        logger.debug('📤 [GanttView] 尝试嵌套格式保存:', nestedData);
      }
      
      // 延迟很短时间再触发更新，确保数据已写入
      setTimeout(() => {
        this.forceTasksDataUpdate();
      }, 10); // 只延迟10ms，最小化时序问题
      
    } catch (error) {
      logger.error('❌ [GanttView] 更新任务日期范围时发生错误:', error);
    }
  }
  
  /**
   * 强制触发任务数据更新 - 优化版本，减少震动
   */
  private forceTasksDataUpdate() {
    logger.debug('🔄 [GanttView] 优化强制触发任务数据更新（减少震动）...');
    
    // 1. 更新强制刷新标志
    this._forceRefresh = Date.now() + Math.random();
    
    // 2. 强制访问所有相关的signals触发重新计算
    if (this.view) {
      const rows = this.view.rows$?.value;
      const properties = this.view.properties$?.value;
      const dataSourceRows = this.view.dataSource.rows$.value;
      
      logger.debug('📊 [GanttView] 优化强制访问信号:', {
        rowsCount: rows?.length,
        propertiesCount: properties?.length,
        dataSourceRowsCount: dataSourceRows?.length,
        forceRefreshValue: this._forceRefresh
      });
    }
    
    // 3. 触发computed重新计算
    const updatedTasks = this.tasks$.value;
    logger.debug('🎯 [GanttView] 优化强制重新计算任务数量:', updatedTasks.length);
    
    // 4. 只进行一次重新渲染，避免多次渲染造成震动
    this.requestUpdate();
    
    logger.debug('✅ [GanttView] 优化数据更新完成，避免多次渲染震动');
  }

  /**
   * 清理拖拽效果
   */
  private cleanupDragEffects(taskId: string) {
    const taskBarElement = this.querySelector(`[data-task-id="${taskId}"]`) as HTMLElement;
    if (taskBarElement) {
      taskBarElement.style.boxShadow = '';
      taskBarElement.style.transform = '';
      taskBarElement.style.zIndex = '';
      taskBarElement.style.opacity = '';
      taskBarElement.style.cursor = '';
    }
  }
  // isSameDay 和 getWeekNumber 已迁移到 gantt-utils.ts

  /**
   * 渲染空状态
   */
  private renderEmptyState() {
    return html`
      <div class="empty-state">
        <div class="empty-icon">📊</div>
        <div style="font-weight: 600; margin-bottom: 16px; font-size: 16px;">甘特图使用指南</div>
        
        <div class="usage-guide">
          <div class="usage-step">
            <strong>1. 创建基础数据：</strong>
            <ul>
              <li>点击 <span class="highlight">"+添加任务"</span> 创建多个任务行</li>
              <li>点击 <span class="highlight">"+添加列"</span> 添加 <strong>日期范围列</strong>（必须！）</li>
            </ul>
          </div>
          
          <div class="usage-step">
            <strong>2. 设置任务时间：</strong>
            <ul>
              <li><strong>双击任务条</strong> 打开任务配置面板</li>
              <li>在面板中设置开始时间、结束时间、状态、优先级等</li>
              <li>或在日期范围列中直接编辑时间</li>
            </ul>
          </div>
          
          <div class="usage-step">
            <strong>3. 任务管理：</strong>
            <ul>
              <li><strong>删除任务</strong>：在配置面板中点击"删除任务"按钮</li>
              <li><strong>编辑任务</strong>：双击任务条或任务名称</li>
              <li><strong>查看进度</strong>：任务条显示不同颜色表示状态</li>
            </ul>
          </div>
          
          <div class="usage-step">
            <strong>4. 甘特图会自动显示：</strong>
            <ul>
              <li>任务条的位置 = 任务开始时间</li>
              <li>任务条的长度 = 任务持续时间</li>
              <li>任务重叠 = 同时进行的并行任务</li>
            </ul>
          </div>
        </div>
        
        <div style="margin-top: 16px; padding: 12px; background: var(--yunke-background-warning-color); border-radius: 6px; color: var(--yunke-text-primary-color); font-size: 13px;">
          <strong>💡 关键操作：</strong><br>
          • <strong>设置时间</strong>：双击任务条 → 配置面板 → 设置开始/结束时间<br>
          • <strong>删除任务</strong>：双击任务条 → 配置面板 → 点击"删除任务"<br>
          • <strong>必须先添加日期范围列，甘特图才能正确显示时间关系！</strong>
        </div>
      </div>
    `;
  }

  override render() {
    if (!this.view) {
      return this.renderEmptyState();
    }

    // 强制访问所有相关的signals以确保响应式更新
    const forceRefreshFlag = this._forceRefresh; // 访问强制刷新标志
    const viewDataSignal = this.view.data$?.value; // 访问视图数据
    const rowsSignal = this.view.rows$?.value; // 访问行数据
    const propertiesSignal = this.view.properties$?.value; // 访问属性数据
    
    logger.debug('🎨 [GanttView] Render called with refresh flag:', forceRefreshFlag);
    logger.debug('🔄 [GanttView] View data signal:', viewDataSignal ? 'available' : 'null');
    logger.debug('📊 [GanttView] Rows signal:', rowsSignal?.length || 0);
    logger.debug('🏷️ [GanttView] Properties signal:', propertiesSignal?.length || 0);

    const tasks = this.tasks$.value;
    
    logger.debug('🎯 [GanttView] Rendering with tasks count:', tasks.length);

    if (tasks.length === 0) {
      return html`
        ${this.renderHeader()}
        ${this.renderEmptyState()}
      `;
    }

    return html`
      ${this.renderHeader()}
      ${this.renderRealGantt(tasks)}
    `;
  }

  /**
   * 组件连接时的回调
   */
  override connectedCallback() {
    super.connectedCallback();
    logger.debug('🔗 [GanttView] Connected callback called');
    logger.debug('📊 [GanttView] View prop:', this.view);
    logger.debug('🔒 [GanttView] Readonly prop:', this.readonly);
  }

  /**
   * 属性更新时的回调
   */
  override willUpdate(changedProperties: Map<string, unknown>) {
    super.willUpdate(changedProperties);
    logger.debug('🔄 [GanttView] Will update called with changes:', changedProperties);
    if (changedProperties.has('view')) {
      logger.debug('👁️ [GanttView] View changed to:', this.view);
    }
  }

  /**
   * 移除滚动同步功能 - 恢复简单独立滚动
   */
  private syncScroll() {
    logger.debug('🔄 [GanttView] 使用独立滚动，无需同步功能');
    // 不需要复杂的滚动同步，每个区域独立滚动即可
  }
  
  // 存储当前的滚动处理器，用于清理
  private _currentScrollHandler?: () => void;
  private _currentTaskListScrollHandler?: () => void;

  override firstUpdated() {
    logger.debug('🎯 [GanttView] First updated - setting up scroll sync');
    // 延迟一点确保DOM完全渲染
    setTimeout(() => {
      this.syncScroll();
    }, 100);
  }
  
  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    
    // 每次更新后重新设置滚动同步，确保DOM更新后同步功能正常
    if (changedProperties.has('view') || changedProperties.has('_forceRefresh')) {
      logger.debug('🔄 [GanttView] View updated - re-syncing scroll');
      setTimeout(() => {
        this.syncScroll();
      }, 100); // 增加延迟确保DOM完全更新
    }
  }
}