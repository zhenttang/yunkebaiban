import { css, html, LitElement } from 'lit';
import { customElement, property, state, query } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { computed } from '@preact/signals-core';
import type { DataViewManager } from '../../core/view-manager/view-manager.js';

import { GanttSingleView } from './gantt-view-manager.js';
import type { GanttViewData, GanttTask, TimelineConfig } from './define.js';
import { GanttTimelineHeader } from './components/gantt-timeline-header.js'; // 引入时间轴头部组件
import './components/gantt-task-bar.js'; // 引入任务条组件

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
      background: var(--affine-background-primary-color);
      font-family: var(--affine-font-family);
      font-size: 14px;
      color: var(--affine-text-primary-color);
      overflow: hidden;
    }

    .gantt-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--affine-border-color);
      background: var(--affine-background-primary-color);
      min-height: 48px;
      flex-shrink: 0;
    }

    .gantt-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--affine-text-primary-color);
    }

    .gantt-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .gantt-button {
      padding: 6px 12px;
      border: 1px solid var(--affine-border-color);
      border-radius: 6px;
      background: var(--affine-background-primary-color);
      color: var(--affine-text-primary-color);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--affine-hover-color);
        border-color: var(--affine-primary-color);
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

    .gantt-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      background: var(--affine-background-primary-color);
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
      border-right: 2px solid var(--affine-border-color);
      background: var(--affine-background-secondary-color);
      display: flex;
      flex-direction: column;
    }

    .task-list-header {
      height: 50px;
      padding: 12px 16px;
      font-weight: 600;
      color: var(--affine-text-primary-color);
      border-bottom: 1px solid var(--affine-border-color);
      display: flex;
      align-items: center;
      background: var(--affine-background-primary-color);
    }

    .task-list-body {
      flex: 1;
      overflow-y: auto;
    }

    .task-row {
      height: 28px; /* 从32px进一步减少到28px */
      padding: 4px 16px; /* 从6px减少到4px */
      border-bottom: 1px solid var(--affine-border-color);
      display: flex;
      align-items: center;
      background: var(--affine-background-primary-color);
      
      &:hover {
        background: var(--affine-hover-color);
      }
    }

    .task-name-display {
      font-size: 14px;
      color: var(--affine-text-primary-color);
      cursor: pointer;
      width: 100%;
      
      &:hover {
        color: var(--affine-primary-color);
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
      border-bottom: 2px solid var(--affine-border-color);
      background: var(--affine-background-primary-color);
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
      border-right: 1px solid var(--affine-border-color);
      background: var(--affine-background-primary-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 500;
      color: var(--affine-text-primary-color);
      flex-shrink: 0;
      
      &:hover {
        background: var(--affine-hover-color);
      }
      
      &.today {
        background: var(--affine-primary-color);
        color: white;
        font-weight: 600;
      }
    }

    /* 甘特图主体区域 */
    .gantt-chart-area {
      flex: 1;
      overflow: auto;
      position: relative;
      background: var(--affine-background-primary-color);
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
      background: var(--affine-border-color);
      opacity: 0.5;
    }

    /* 甘特图行 - 每任务独占一行 */
    .gantt-chart-row {
      height: 28px; /* 从32px进一步减少到28px，与左侧任务行保持一致 */
      position: relative;
      width: 100%;
      
      &:hover {
        background: var(--affine-hover-color-02);
      }
    }

    /* 任务条 - 填满格子的实心矩形 */
    .task-bar {
      position: absolute;
      top: 2px; /* 从4px减少到2px，适应更小的行高 */
      height: 24px; /* 保持24px高度 */
      border-radius: 4px;
      background: var(--affine-primary-color);
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
      color: var(--affine-text-secondary-color);
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
      color: var(--affine-text-primary-color);
    }

    .highlight {
      background: var(--affine-primary-color-04);
      color: var(--affine-primary-color);
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
  private readonly tasks$ = computed(() => {
    // 访问_forceRefresh确保每次都重新计算
    const refreshFlag = this._forceRefresh;
    console.log('🔍 [GanttView] Computing tasks... (refresh flag:', refreshFlag, ', timestamp:', Date.now(), ')');
    
    try {
      if (!this.view) {
        console.log('❌ [GanttView] No view available');
        return [];
      }

      // 强制监听数据源的变化 - 访问所有相关的signals
      const rows = this.view?.rows$?.value || [];
      const properties = this.view.properties$?.value || [];
      const dataSourceRows = this.view.dataSource.rows$.value || [];
      const dataSourceProperties = this.view.dataSource.properties$.value || [];
      
      console.log('📊 [GanttView] Found rows:', rows.length, rows);
      console.log('🔄 [GanttView] DataSource rows:', dataSourceRows.length);
      console.log('🔄 [GanttView] DataSource properties:', dataSourceProperties.length);
      
      if (rows.length === 0) {
        console.log('❌ [GanttView] No rows found');
        return [];
      }

      console.log('🏷️ [GanttView] Available properties:', properties.map(p => ({ 
        id: p.id, 
        type: this.view.dataSource.propertyTypeGet(p.id),
        name: p.name$?.value || 'unnamed'
      })));

      const tasks: GanttTask[] = [];

      for (const row of rows) {
        try {
          const rowId = row.rowId; // 使用正确的属性名
          console.log('🔍 [GanttView] Processing row ID:', rowId);
          console.log('📝 [GanttView] Got row object:', row);
          
          // 安全地获取属性
          const titleProperty = properties.find(
            p => {
              try {
                return this.view.dataSource.propertyTypeGet(p.id) === 'title';
              } catch (e) {
                console.warn('⚠️ [GanttView] Error getting property type for', p.id, e);
                return false;
              }
            }
          );
          
          const dateRangeProperty = properties.find(
            p => {
              try {
                return this.view.dataSource.propertyTypeGet(p.id) === 'date-range';
              } catch (e) {
                console.warn('⚠️ [GanttView] Error getting property type for', p.id, e);
                return false;
              }
            }
          );

          console.log('🏷️ [GanttView] Title property:', titleProperty?.id);
          console.log('📅 [GanttView] Date range property:', dateRangeProperty?.id);

          // 如果没有标题属性，跳过
          if (!titleProperty) {
            console.log('❌ [GanttView] No title property found, skipping row');
            continue;
          }

          let name: string;
          try {
            const titleValue = this.view.dataSource.cellValueGet(row.rowId, titleProperty.id);
            console.log('🔍 [GanttView] Title value structure:', titleValue, typeof titleValue);
            
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
            console.warn('⚠️ [GanttView] Error getting title value:', e);
            name = `任务 ${String(row.rowId).slice(-4)}`;
          }
          
          console.log('📝 [GanttView] Task name:', name);

          // 处理日期范围 - 增强读取逻辑确保能读取拖拽保存的数据
          let startDate: number, endDate: number, workingDays: number[];
          
          if (dateRangeProperty) {
            try {
              const dateRangeValue = this.view.dataSource.cellValueGet(row.rowId, dateRangeProperty.id);
              console.log('📅 [GanttView] 读取日期范围数据:', {
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
                    console.log('🎯 [GanttView] 使用嵌套value结构');
                  }
                }
                // 优先级2: 直接结构 {startDate, endDate, workingDays}
                else if (dateRangeValue.startDate && dateRangeValue.endDate) {
                  dateRange = dateRangeValue;
                  console.log('🎯 [GanttView] 使用直接结构');
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
                    console.log('🎯 [GanttView] 通过深层搜索找到日期数据');
                  }
                }
              }
              
              console.log('🔍 [GanttView] 解析后的日期范围:', dateRange);
              
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
                  
                  console.log('✅ [GanttView] 成功使用保存的日期范围:', {
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
              console.warn('⚠️ [GanttView] 读取保存的日期范围失败，使用默认值:', {
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
            console.log('⚠️ [GanttView] No date-range property, using default dates');
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

          console.log('✅ [GanttView] Created task:', task);
          tasks.push(task);
        } catch (e) {
          console.error('❌ [GanttView] Error processing row:', row.rowId, e);
          // 继续处理下一行
        }
      }

      console.log('🎉 [GanttView] Final tasks:', tasks.length);
      return tasks;
    } catch (e) {
      console.error('❌ [GanttView] Fatal error in tasks$ computed:', e);
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
      console.warn('⚠️ [GanttView] Error getting task progress:', e);
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
      console.warn('⚠️ [GanttView] Error getting task color:', e);
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
      console.warn('⚠️ [GanttView] Error getting task priority:', e);
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
      console.warn('⚠️ [GanttView] Error getting task status:', e);
    }
    
    return 'not_started';
  }

  /**
   * 处理添加任务
   */
  private handleAddTask = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('➕ [GanttView] Add task clicked');
    
    if (this.view && !this.readonly) {
      try {
        const newRowId = this.view.rowAdd({ before: false });
        console.log('✅ [GanttView] Added new task row:', newRowId);
        
        // 强制重新渲染
        this.requestUpdate();
      } catch (error) {
        console.error('❌ [GanttView] Error adding task:', error);
      }
    } else {
      console.warn('⚠️ [GanttView] Cannot add task: view not available or readonly');
    }
  };

  /**
   * 处理添加列
   */
  private handleAddColumn = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📋 [GanttView] Add column clicked');
    
    if (this.view && !this.readonly) {
      try {
        // 添加日期范围列 - 修复参数格式
        const columnId = this.view.propertyAdd({ before: false }, {
          type: 'date-range',
          name: '任务时间'
        });
        console.log('✅ [GanttView] Added new column:', columnId);
        
        // 强制重新渲染
        this.requestUpdate();
      } catch (error) {
        console.error('❌ [GanttView] Error adding column:', error);
      }
    } else {
      console.warn('⚠️ [GanttView] Cannot add column: view not available or readonly');
    }
  };

  /**
   * 处理今天按钮点击 - 精确定位到今天
   */
  private handleTodayClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📅 [GanttView] Today clicked - 定位到今天');
    
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
            const startOfWeek = this.getWeekStart(new Date(now)).getTime();
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
            const defaultStartOfWeek = this.getWeekStart(new Date(now)).getTime();
            startDate = defaultStartOfWeek - 2 * defaultOneWeek;
            endDate = defaultStartOfWeek + 6 * defaultOneWeek;
        }
        
        // 更新时间轴
        this.view.updateTimeline({
          startDate,
          endDate,
        });
        
        console.log('✅ [GanttView] 今日定位完成:', {
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
        console.error('❌ [GanttView] Error scrolling to today:', error);
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
      
      const timelineUnits = this.generateTimelineUnits(timeline);
      const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);
      const todayPosition = this.calculateTodayPosition(timeline, totalWidth);
      
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
          
          console.log('📍 [GanttView] 滚动到今天位置（独立滚动）:', {
            todayPosition: `${Math.round(todayPosition)}px`,
            scrollLeft: `${Math.round(scrollLeft)}px`,
            containerWidth: `${containerWidth}px`,
            timelineHeaderFound: !!timelineHeader,
            ganttChartAreaFound: !!ganttChartArea
          });
        } else {
          console.warn('⚠️ [GanttView] 时间轴头部或甘特图区域未找到');
        }
      }
    } catch (error) {
      console.error('❌ [GanttView] Error scrolling to today position:', error);
    }
  }

  /**
   * 处理时间单位变更
   **/
  private handleTimeUnitChange = (unit: 'day' | 'week' | 'month') => {
    console.log('🕒 [GanttView] Time unit changed to:', unit);
    
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
        console.log('✅ [GanttView] Updated timeline unit to:', unit);
        
        // 强制重新渲染
        this.requestUpdate();
      } catch (error) {
        console.error('❌ [GanttView] Error updating time unit:', error);
      }
    }
  };

  /**
   * 处理缩放
   */
  private handleZoomIn = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔍 [GanttView] Zoom in clicked');
    
    if (this.view) {
      try {
        const currentWidth = this.view.timeline$.value?.unitWidth || 60;
        const newWidth = Math.min(currentWidth * 1.2, 200); // 最大200px
        this.view.updateTimeline({ unitWidth: newWidth });
        console.log('✅ [GanttView] Zoomed in, new width:', newWidth);
        
        this.requestUpdate();
      } catch (error) {
        console.error('❌ [GanttView] Error zooming in:', error);
      }
    }
  };

  private handleZoomOut = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔍 [GanttView] Zoom out clicked');
    
    if (this.view) {
      try {
        const currentWidth = this.view.timeline$.value?.unitWidth || 60;
        const newWidth = Math.max(currentWidth * 0.8, 20); // 最小20px
        this.view.updateTimeline({ unitWidth: newWidth });
        console.log('✅ [GanttView] Zoomed out, new width:', newWidth);
        
        this.requestUpdate();
      } catch (error) {
        console.error('❌ [GanttView] Error zooming out:', error);
      }
    }
  };

  /**
   * 处理任务点击
   */
  private handleTaskClick = (task: GanttTask, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('👆 [GanttView] Task clicked:', task.name);
    
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
    console.log('👆👆 [GanttView] Task double clicked:', task.name);
    
    // 打开任务配置面板
    this.openTaskConfigPanel(task);
  };

  /**
   * 打开任务配置面板
   */
  private openTaskConfigPanel(task: GanttTask) {
    console.log('⚙️ [GanttView] Opening task config panel for:', task.name);
    
    // 移除已存在的配置面板
    const existingPanel = document.querySelector('.task-config-panel');
    if (existingPanel) {
      existingPanel.remove();
    }
    
    // 创建任务配置面板
    const configPanel = this.createTaskConfigPanel(task);
    
    // 添加到文档中
    document.body.appendChild(configPanel);
    
    // 自动聚焦到第一个输入框
    setTimeout(() => {
      const firstInput = configPanel.querySelector('input') as HTMLInputElement;
      if (firstInput) {
        firstInput.focus();
        firstInput.select();
      }
    }, 100); // 延迟确保DOM已渲染
  }

  /**
   * 创建任务配置面板
   */
  private createTaskConfigPanel(task: GanttTask): HTMLElement {
    const panel = document.createElement('div');
    panel.className = 'task-config-panel';
    
    // 获取任务的当前数据
    const startDate = new Date(task.startDate);
    const endDate = new Date(task.endDate);
    
    // 获取当前任务的实际数据（从数据源获取）
    const properties = this.view?.properties$?.value || [];
    
    // 获取当前状态
    let currentStatus = task.status;
    try {
      const statusProperty = properties.find(p => {
        try {
          const name = p.name$?.value;
          return name === '状态' || name === 'Status' || this.view.dataSource.propertyTypeGet(p.id) === 'select';
        } catch (e) {
          return false;
        }
      });
      if (statusProperty) {
        const statusValue = this.view.dataSource.cellValueGet(task.id, statusProperty.id);
        if (statusValue?.value) {
          currentStatus = statusValue.value;
        }
      }
    } catch (e) {
      console.warn('⚠️ [GanttView] Error getting current status:', e);
    }
    
    // 获取当前进度
    let currentProgress = task.progress;
    try {
      const progressProperty = properties.find(p => {
        try {
          const name = p.name$?.value;
          return name === '进度' || name === 'Progress' || this.view.dataSource.propertyTypeGet(p.id) === 'progress';
        } catch (e) {
          return false;
        }
      });
      if (progressProperty) {
        const progressValue = this.view.dataSource.cellValueGet(task.id, progressProperty.id);
        if (progressValue?.value !== undefined) {
          currentProgress = progressValue.value;
        }
      }
    } catch (e) {
      console.warn('⚠️ [GanttView] Error getting current progress:', e);
    }
    
    // 获取当前优先级
    let currentPriority = task.priority;
    try {
      const priorityProperty = properties.find(p => {
        try {
          const name = p.name$?.value;
          return name === '优先级' || name === 'Priority';
        } catch (e) {
          return false;
        }
      });
      if (priorityProperty) {
        const priorityValue = this.view.dataSource.cellValueGet(task.id, priorityProperty.id);
        if (priorityValue?.value) {
          currentPriority = priorityValue.value;
        }
      }
    } catch (e) {
      console.warn('⚠️ [GanttView] Error getting current priority:', e);
    }
    
    console.log('🔧 [GanttView] Creating config panel with current values:', {
      name: task.name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      status: currentStatus,
      progress: currentProgress,
      priority: currentPriority
    });
    
    panel.innerHTML = `
      <div class="task-config-overlay">
        <div class="task-config-content">
          <div class="task-config-header">
            <h3>任务配置</h3>
            <button class="task-config-close" aria-label="关闭">×</button>
          </div>
          
          <div class="task-config-body">
            <div class="config-row">
              <label>任务名称：</label>
              <input type="text" class="task-name-input" value="${task.name}" placeholder="请输入任务名称">
            </div>
            
            <div class="config-row">
              <label>开始时间：</label>
              <input type="date" class="task-start-date" value="${startDate.toISOString().split('T')[0]}">
            </div>
            
            <div class="config-row">
              <label>结束时间：</label>
              <input type="date" class="task-end-date" value="${endDate.toISOString().split('T')[0]}">
            </div>
            
            <div class="config-row">
              <label>任务状态：</label>
              <select class="task-status-select">
                <option value="not_started" ${currentStatus === 'not_started' ? 'selected' : ''}>未开始</option>
                <option value="in_progress" ${currentStatus === 'in_progress' ? 'selected' : ''}>进行中</option>
                <option value="completed" ${currentStatus === 'completed' ? 'selected' : ''}>已完成</option>
                <option value="paused" ${currentStatus === 'paused' ? 'selected' : ''}>已暂停</option>
              </select>
            </div>
            
            <div class="config-row">
              <label>完成进度：</label>
              <input type="range" class="task-progress-slider" min="0" max="100" value="${currentProgress}" step="5">
              <span class="progress-display">${currentProgress}%</span>
            </div>
            
            <div class="config-row">
              <label>优先级：</label>
              <select class="task-priority-select">
                <option value="low" ${currentPriority === 'low' ? 'selected' : ''}>低</option>
                <option value="medium" ${currentPriority === 'medium' ? 'selected' : ''}>中</option>
                <option value="high" ${currentPriority === 'high' ? 'selected' : ''}>高</option>
                <option value="urgent" ${currentPriority === 'urgent' ? 'selected' : ''}>紧急</option>
              </select>
            </div>
            
            <div class="config-row">
              <label>工作日：</label>
              <div class="working-days">
                ${['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day, index) => `
                  <label class="day-checkbox">
                    <input type="checkbox" value="${index + 1}" ${task.workingDays.includes(index + 1) ? 'checked' : ''}>
                    ${day}
                  </label>
                `).join('')}
              </div>
            </div>
          </div>
          
          <div class="task-config-footer">
            <button class="config-btn cancel-btn">取消</button>
            <button class="config-btn save-btn">保存</button>
            <button class="config-btn delete-btn">删除任务</button>
          </div>
        </div>
      </div>
    `;
    
    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .task-config-panel {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        z-index: 999999 !important;
        pointer-events: auto !important;
      }
      
      .task-config-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.5) !important;
        backdrop-filter: blur(4px) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        z-index: 999999 !important;
        pointer-events: auto !important;
      }
      
      .task-config-content {
        background: var(--affine-background-primary-color, white) !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
        max-width: 500px !important;
        width: 90vw !important;
        max-height: 80vh !important;
        overflow: hidden !important;
        display: flex !important;
        flex-direction: column !important;
        z-index: 1000000 !important;
        pointer-events: auto !important;
      }
      
      .task-config-header {
        padding: 20px 24px 16px !important;
        border-bottom: 1px solid var(--affine-border-color, #e0e0e0) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: space-between !important;
        background: var(--affine-background-secondary-color, #f9f9f9) !important;
      }
      
      .task-config-header h3 {
        margin: 0 !important;
        font-size: 18px !important;
        font-weight: 600 !important;
        color: var(--affine-text-primary-color, #333) !important;
      }
      
      .task-config-close {
        background: none !important;
        border: none !important;
        font-size: 24px !important;
        cursor: pointer !important;
        color: var(--affine-text-secondary-color, #666) !important;
        width: 32px !important;
        height: 32px !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        border-radius: 6px !important;
        transition: background 0.2s !important;
      }
      
      .task-config-close:hover {
        background: var(--affine-hover-color, #f0f0f0) !important;
      }
      
      .task-config-body {
        padding: 20px 24px !important;
        overflow-y: auto !important;
        flex: 1 !important;
      }
      
      .config-row {
        margin-bottom: 16px !important;
        display: flex !important;
        flex-direction: column !important;
        gap: 6px !important;
      }
      
      .config-row label {
        font-weight: 500 !important;
        color: var(--affine-text-primary-color, #333) !important;
        font-size: 14px !important;
      }
      
      .config-row input, .config-row select {
        padding: 8px 12px !important;
        border: 1px solid var(--affine-border-color, #e0e0e0) !important;
        border-radius: 6px !important;
        font-size: 14px !important;
        background: var(--affine-background-primary-color, white) !important;
        color: var(--affine-text-primary-color, #333) !important;
        transition: border-color 0.2s !important;
      }
      
      .config-row input:focus, .config-row select:focus {
        outline: none !important;
        border-color: var(--affine-primary-color, #007bff) !important;
        box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25) !important;
      }
      
      .task-progress-slider {
        margin-right: 12px !important;
        flex: 1 !important;
      }
      
      .progress-display {
        font-weight: 600 !important;
        color: var(--affine-primary-color, #007bff) !important;
        min-width: 40px !important;
      }
      
      .working-days {
        display: flex !important;
        flex-wrap: wrap !important;
        gap: 8px !important;
      }
      
      .day-checkbox {
        display: flex !important;
        align-items: center !important;
        gap: 4px !important;
        font-size: 13px !important;
        cursor: pointer !important;
      }
      
      .day-checkbox input {
        margin: 0 !important;
        width: auto !important;
      }
      
      .task-config-footer {
        padding: 16px 24px !important;
        border-top: 1px solid var(--affine-border-color, #e0e0e0) !important;
        display: flex !important;
        gap: 12px !important;
        justify-content: flex-end !important;
        background: var(--affine-background-secondary-color, #f9f9f9) !important;
      }
      
      .config-btn {
        padding: 8px 16px !important;
        border: 1px solid var(--affine-border-color, #e0e0e0) !important;
        border-radius: 6px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all 0.2s !important;
      }
      
      .cancel-btn {
        background: var(--affine-background-primary-color, white) !important;
        color: var(--affine-text-secondary-color, #666) !important;
      }
      
      .cancel-btn:hover {
        background: var(--affine-hover-color, #f0f0f0) !important;
      }
      
      .save-btn {
        background: var(--affine-primary-color, #007bff) !important;
        color: white !important;
        border-color: var(--affine-primary-color, #007bff) !important;
      }
      
      .save-btn:hover {
        background: var(--affine-primary-color-hover, #0056b3) !important;
      }
      
      .delete-btn {
        background: #dc3545 !important;
        color: white !important;
        border-color: #dc3545 !important;
      }
      
      .delete-btn:hover {
        background: #c82333 !important;
      }
    `;
    
    panel.appendChild(style);
    
    // 添加事件监听器
    this.addConfigPanelEventListeners(panel, task);
    
    return panel;
  }

  /**
   * 为配置面板添加事件监听器
   */
  private addConfigPanelEventListeners(panel: HTMLElement, task: GanttTask) {
    const closeBtn = panel.querySelector('.task-config-close') as HTMLButtonElement;
    const cancelBtn = panel.querySelector('.cancel-btn') as HTMLButtonElement;
    const saveBtn = panel.querySelector('.save-btn') as HTMLButtonElement;
    const deleteBtn = panel.querySelector('.delete-btn') as HTMLButtonElement;
    const progressSlider = panel.querySelector('.task-progress-slider') as HTMLInputElement;
    const progressDisplay = panel.querySelector('.progress-display') as HTMLSpanElement;
    const overlay = panel.querySelector('.task-config-overlay') as HTMLElement;
    
    // 关闭面板
    const closePanel = () => {
      panel.remove();
    };
    
    closeBtn?.addEventListener('click', closePanel);
    cancelBtn?.addEventListener('click', closePanel);
    
    // 点击遮罩关闭
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        closePanel();
      }
    });
    
    // ESC键关闭
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePanel();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);
    
    // 进度滑块更新 - 实时更新显示
    progressSlider?.addEventListener('input', () => {
      if (progressDisplay) {
        progressDisplay.textContent = `${progressSlider.value}%`;
      }
      console.log('📏 [GanttView] Progress slider updated:', progressSlider.value);
    });
    
    // 保存配置
    saveBtn?.addEventListener('click', () => {
      this.saveTaskConfig(panel, task);
      closePanel();
    });
    
    // 删除任务
    deleteBtn?.addEventListener('click', () => {
      if (confirm(`确定要删除任务"${task.name}"吗？`)) {
        this.deleteTask(task);
        closePanel();
      }
    });
  }

  /**
   * 保存任务配置
   */
  private saveTaskConfig(panel: HTMLElement, task: GanttTask) {
    try {
      console.log('💾 [GanttView] Starting to save task config for:', task.name);
      
      // 获取表单数据
      const nameInput = panel.querySelector('.task-name-input') as HTMLInputElement;
      const startDateInput = panel.querySelector('.task-start-date') as HTMLInputElement;
      const endDateInput = panel.querySelector('.task-end-date') as HTMLInputElement;
      const statusSelect = panel.querySelector('.task-status-select') as HTMLSelectElement;
      const progressSlider = panel.querySelector('.task-progress-slider') as HTMLInputElement;
      const prioritySelect = panel.querySelector('.task-priority-select') as HTMLSelectElement;
      const workingDayCheckboxes = panel.querySelectorAll('.day-checkbox input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
      
      // 收集工作日
      const workingDays: number[] = [];
      workingDayCheckboxes.forEach((checkbox) => {
        if (checkbox.checked) {
          workingDays.push(parseInt(checkbox.value));
        }
      });
      
      console.log('📝 [GanttView] Form data collected:', {
        name: nameInput?.value,
        startDate: startDateInput?.value,
        endDate: endDateInput?.value,
        status: statusSelect?.value,
        progress: progressSlider?.value,
        priority: prioritySelect?.value,
        workingDays
      });
      
      // 更新任务数据到数据源
      const properties = this.view?.properties$?.value || [];
      console.log('🏷️ [GanttView] Available properties:', properties.map(p => ({ 
        id: p.id, 
        type: this.view.dataSource.propertyTypeGet(p.id),
        name: p.name$?.value 
      })));
      
      // 1. 更新标题
      const titleProperty = properties.find(p => {
        try {
          return this.view.dataSource.propertyTypeGet(p.id) === 'title';
        } catch (e) {
          return false;
        }
      });
      
      if (titleProperty && nameInput?.value?.trim()) {
        console.log('📝 [GanttView] Updating title:', nameInput.value.trim());
        this.view.dataSource.cellValueChange(task.id, titleProperty.id, nameInput.value.trim());
        
        // 立即验证更新是否成功
        setTimeout(() => {
          const verifyTitle = this.view.dataSource.cellValueGet(task.id, titleProperty.id);
          console.log('✅ [GanttView] Title verification:', verifyTitle);
        }, 10);
      }
      
      // 2. 更新日期范围
      const dateRangeProperty = properties.find(p => {
        try {
          return this.view.dataSource.propertyTypeGet(p.id) === 'date-range';
        } catch (e) {
          return false;
        }
      });
      
      if (dateRangeProperty && startDateInput?.value && endDateInput?.value) {
        const startDate = new Date(startDateInput.value).getTime();
        const endDate = new Date(endDateInput.value).getTime();
        
        console.log('📅 [GanttView] Updating date range:', {
          startDate: new Date(startDate).toLocaleDateString(),
          endDate: new Date(endDate).toLocaleDateString(),
          workingDays
        });
        
        this.view.dataSource.cellValueChange(task.id, dateRangeProperty.id, {
          value: {
            startDate,
            endDate,
            workingDays
          }
        });
        
        // 立即验证更新是否成功
        setTimeout(() => {
          const verifyDateRange = this.view.dataSource.cellValueGet(task.id, dateRangeProperty.id);
          console.log('✅ [GanttView] Date range verification:', verifyDateRange);
        }, 10);
      }
      
      // 3. 更新状态属性
      const statusProperty = properties.find(p => {
        try {
          const name = p.name$?.value;
          return name === '状态' || name === 'Status' || this.view.dataSource.propertyTypeGet(p.id) === 'select';
        } catch (e) {
          return false;
        }
      });
      
      if (statusProperty && statusSelect?.value) {
        console.log('📊 [GanttView] Updating status:', statusSelect.value);
        this.view.dataSource.cellValueChange(task.id, statusProperty.id, {
          value: statusSelect.value
        });
        
        // 立即验证更新是否成功
        setTimeout(() => {
          const verifyStatus = this.view.dataSource.cellValueGet(task.id, statusProperty.id);
          console.log('✅ [GanttView] Status verification:', verifyStatus);
        }, 10);
      }
      
      // 4. 更新进度属性
      const progressProperty = properties.find(p => {
        try {
          const name = p.name$?.value;
          return name === '进度' || name === 'Progress' || this.view.dataSource.propertyTypeGet(p.id) === 'progress';
        } catch (e) {
          return false;
        }
      });
      
      if (progressProperty && progressSlider?.value !== undefined) {
        const progressValue = parseInt(progressSlider.value);
        console.log('📈 [GanttView] Updating progress:', progressValue);
        this.view.dataSource.cellValueChange(task.id, progressProperty.id, {
          value: progressValue
        });
        
        // 立即验证更新是否成功
        setTimeout(() => {
          const verifyProgress = this.view.dataSource.cellValueGet(task.id, progressProperty.id);
          console.log('✅ [GanttView] Progress verification:', verifyProgress);
        }, 10);
      }
      
      // 5. 更新优先级属性
      const priorityProperty = properties.find(p => {
        try {
          const name = p.name$?.value;
          return name === '优先级' || name === 'Priority';
        } catch (e) {
          return false;
        }
      });
      
      // 如果没有找到状态属性，尝试创建一个
      if (!statusProperty && statusSelect?.value) {
        console.log('🆕 [GanttView] Creating status property');
        try {
          const statusPropertyId = this.view.propertyAdd('end', {
            type: 'select',
            name: '状态'
          });
          if (statusPropertyId) {
            // 设置状态值
            this.view.dataSource.cellValueChange(task.id, statusPropertyId, {
              value: statusSelect.value
            });
          }
        } catch (e) {
          console.warn('⚠️ [GanttView] Failed to create status property:', e);
        }
      }
      
      // 如果没有找到进度属性，尝试创建一个
      if (!progressProperty && progressSlider?.value !== undefined) {
        console.log('🆕 [GanttView] Creating progress property');
        try {
          const progressPropertyId = this.view.propertyAdd('end', {
            type: 'number',
            name: '进度'
          });
          if (progressPropertyId) {
            const progressValue = parseInt(progressSlider.value);
            this.view.dataSource.cellValueChange(task.id, progressPropertyId, {
              value: progressValue
            });
          }
        } catch (e) {
          console.warn('⚠️ [GanttView] Failed to create progress property:', e);
        }
      }
      
      // 如果没有找到优先级属性，尝试创建一个
      if (!priorityProperty && prioritySelect?.value) {
        console.log('🆕 [GanttView] Creating priority property');
        try {
          const priorityPropertyId = this.view.propertyAdd('end', {
            type: 'select',
            name: '优先级'
          });
          if (priorityPropertyId) {
            this.view.dataSource.cellValueChange(task.id, priorityPropertyId, {
              value: prioritySelect.value
            });
          }
        } catch (e) {
          console.warn('⚠️ [GanttView] Failed to create priority property:', e);
        }
      }
      
      console.log('✅ [GanttView] Task configuration saved successfully:', {
        taskId: task.id,
        name: nameInput?.value,
        startDate: startDateInput?.value,
        endDate: endDateInput?.value,
        status: statusSelect?.value,
        progress: progressSlider?.value,
        priority: prioritySelect?.value,
        workingDays
      });
      
      // 强制重新渲染视图和重新计算任务数据
      console.log('🔄 [GanttView] Force triggering view update...');
      
      // 1. 立即更新_forceRefresh以触发computed重新计算
      this._forceRefresh = Date.now();
      console.log('🔄 [GanttView] Force refresh flag updated to:', this._forceRefresh);
      
      // 2. 立即强制重新渲染
      this.requestUpdate();
      
      // 3. 创建一个完全新的任务更新机制
      const forceTasksUpdate = () => {
        console.log('🔄 [GanttView] Forcing tasks recalculation...');
        
        // 强制触发所有相关的signal读取
        if (this.view) {
          // 访问所有可能影响tasks$的signals
          const rows = this.view.rows$?.value;
          const properties = this.view.properties$?.value;
          const dataSourceRows = this.view.dataSource.rows$.value;
          
          console.log('📊 [GanttView] Force accessing signals:', {
            rowsCount: rows?.length,
            propertiesCount: properties?.length,
            dataSourceRowsCount: dataSourceRows?.length
          });
          
          // 访问computed让它重新计算
          const updatedTasks = this.tasks$.value;
          console.log('🔄 [GanttView] Forced tasks calculation result:', updatedTasks.length);
          
          // 查找更新的任务
          const updatedTask = updatedTasks.find(t => t.id === task.id);
          if (updatedTask) {
            console.log('✅ [GanttView] Found updated task after force recalc:', {
              name: updatedTask.name,
              status: updatedTask.status,
              progress: updatedTask.progress,
              startDate: new Date(updatedTask.startDate).toLocaleDateString(),
              endDate: new Date(updatedTask.endDate).toLocaleDateString()
            });
          } else {
            console.warn('⚠️ [GanttView] Task still not found after force recalc');
          }
        }
        
        // 强制再次更新UI
        this._forceRefresh = Date.now() + Math.random(); // 确保值发生变化
        this.requestUpdate();
      };
      
      // 4. 立即执行一次强制更新
      forceTasksUpdate();
      
      // 5. 使用多重更新策略确保更新生效
      Promise.resolve().then(() => {
        console.log('🔄 [GanttView] Microtask force update');
        forceTasksUpdate();
      });
      
      setTimeout(() => {
        console.log('⏰ [GanttView] Delayed force update (50ms)');
        forceTasksUpdate();
      }, 50);
      
      setTimeout(() => {
        console.log('⏰ [GanttView] Final force update (200ms)');
        forceTasksUpdate();
      }, 200);
      
    } catch (error) {
      console.error('❌ [GanttView] Error saving task config:', error);
      alert('保存任务配置时出错，请稍后重试。');
    }
  }

  /**
   * 删除任务
   */
  private deleteTask(task: GanttTask) {
    try {
      if (this.view) {
        // 使用正确的方法名和参数格式
        this.view.rowsDelete([task.id]);
        console.log('✅ [GanttView] Task deleted:', task.id);
        this.requestUpdate();
      }
    } catch (error) {
      console.error('❌ [GanttView] Error deleting task:', error);
      alert('删除任务时出错，请稍后重试。');
    }
  }

  /**
   * 处理任务右键菜单
   */
  private handleTaskRightClick = (task: GanttTask, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('🖱️ [GanttView] Task right clicked:', task.name);
    
    this.showTaskContextMenu(task, event);
  };

  /**
   * 显示任务右键菜单
   */
  private showTaskContextMenu(task: GanttTask, event: MouseEvent) {
    console.log('📝 [GanttView] Showing context menu for task:', task.name);
    
    // 移除之前的菜单
    const existingMenu = document.querySelector('.task-context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }

    const menu = document.createElement('div');
    menu.className = 'task-context-menu';
    menu.innerHTML = `
      <div class="context-menu-item edit-item" data-action="edit">
        <span>⚙️</span> 编辑任务
      </div>
      <div class="context-menu-item delete-item" data-action="delete">
        <span>🗑️</span> 删除任务
      </div>
    `;

    // 添加样式
    const style = document.createElement('style');
    style.textContent = `
      .task-context-menu {
        position: fixed !important;
        background: var(--affine-background-primary-color, white) !important;
        border: 1px solid var(--affine-border-color, #e0e0e0) !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
        z-index: 999999 !important;
        min-width: 120px !important;
        padding: 4px 0 !important;
        font-size: 13px !important;
        pointer-events: auto !important;
      }
      
      .context-menu-item {
        padding: 8px 12px !important;
        cursor: pointer !important;
        transition: background 0.2s !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        color: var(--affine-text-primary-color, #333) !important;
      }
      
      .context-menu-item:hover {
        background: var(--affine-hover-color, #f0f0f0) !important;
      }
      
      .context-menu-item.delete-item:hover {
        background: #fee !important;
        color: #dc3545 !important;
      }
    `;
    
    menu.appendChild(style);

    // 设置菜单位置
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;

    document.body.appendChild(menu);
    
    console.log('✅ [GanttView] Context menu added to DOM at position:', { x: event.clientX, y: event.clientY });

    // 添加菜单项事件（使用事件委托）
    menu.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const menuItem = target.closest('.context-menu-item') as HTMLElement;
      
      if (!menuItem) return;
      
      const action = menuItem.getAttribute('data-action');
      console.log('👆 [GanttView] Context menu item clicked:', action);
      
      if (action === 'edit') {
        console.log('✏️ [GanttView] Opening edit panel for task:', task.name);
        this.openTaskConfigPanel(task);
      } else if (action === 'delete') {
        console.log('🗑️ [GanttView] Attempting to delete task:', task.name);
        if (confirm(`确定要删除任务"${task.name}"吗？`)) {
          this.deleteTask(task);
        }
      }
      
      menu.remove();
    });

    // 点击其他地方关闭菜单
    const closeMenu = (e: Event) => {
      if (!menu.contains(e.target as Node)) {
        console.log('🚫 [GanttView] Closing context menu (clicked outside)');
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    
    // 延迟添加监听器，避免立即被关闭
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);
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
            style="background: var(--affine-primary-color); color: white; font-weight: 600;"
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
    const timelineUnits = this.generateTimelineUnits(timeline);
    const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);
    const todayPosition = this.calculateTodayPosition(timeline, totalWidth);

    console.log('🎯 [GanttView] 渲染专业甘特图 (动态单位):', {
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
                <div class="task-row" style="border-bottom: 1px solid var(--affine-border-color);">
                  <div class="task-name-display" 
                       @click=${() => this.openTaskConfigPanel(task)}
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
      console.log('⚠️ [GanttView] 任务超出时间轴范围，不显示:', task.name);
      return html``;
    }

    // 精确计算任务条在时间轴上的位置，确保与时间轴对齐
    const left = this.calculateTaskPosition(taskStart, timeline, totalWidth);
    const width = this.calculateTaskWidth(taskStart, taskEnd, timeline, totalWidth);

    // 根据任务状态和优先级确定颜色
    const taskColor = this.getTaskBarColor(task);
    const taskBorderColor = this.getTaskBorderColor(task);

    // 计算任务持续天数
    const taskDuration = taskEnd.getTime() - taskStart.getTime();
    const durationDays = Math.ceil(taskDuration / (24 * 60 * 60 * 1000));

    console.log('📊 [GanttView] 任务条位置计算 (精确对齐时间轴):', {
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
          console.log('🖱️ Task mousedown triggered:', task.name);
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
        title="${task.name}: ${taskStart.toLocaleDateString('zh-CN')} - ${taskEnd.toLocaleDateString('zh-CN')} (${durationDays}天)\n状态: ${this.getStatusDisplayName(task.status)}\n优先级: ${this.getPriorityDisplayName(task.priority)}\n进度: ${task.progress}%\n🖱️ 拖拽任务条中间移动，拖拽两端调整时间"
      >
        <!-- 左侧调整手柄（调整开始时间）-->
        <div 
          class="task-resize-handle task-resize-start"
          @mousedown=${(e: MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔧 Left resize handle clicked:', task.name);
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
            console.log('🔧 Right resize handle clicked:', task.name);
            if (e.button === 0) {
              this.handleTaskResizeEndDrag(task, e);
            }
          }}
          title="拖拽调整任务结束时间"
        ></div>
      </div>
    `;
  }

  /**
   * 根据任务状态获取任务条颜色
   */
  private getTaskBarColor(task: GanttTask): string {
    // 首先根据状态确定基础颜色
    let baseColor: string;
    
    switch (task.status) {
      case 'completed':
        baseColor = '#10b981'; // 绿色 - 已完成
        break;
      case 'in_progress':
        baseColor = '#3b82f6'; // 蓝色 - 进行中
        break;
      case 'paused':
        baseColor = '#f59e0b'; // 橙色 - 已暂停
        break;
      case 'not_started':
      default:
        baseColor = '#6b7280'; // 灰色 - 未开始
        break;
    }
    
    // 根据优先级调整颜色亮度
    switch (task.priority) {
      case 'urgent':
        return task.status === 'completed' ? baseColor : '#ef4444'; // 紧急任务用红色（除非已完成）
      case 'high':
        return this.adjustColorBrightness(baseColor, -0.1); // 稍微深一点
      case 'low':
        return this.adjustColorBrightness(baseColor, 0.2); // 稍微亮一点
      case 'medium':
      default:
        return baseColor;
    }
  }

  /**
   * 获取任务边框颜色（用于优先级指示）
   */
  private getTaskBorderColor(task: GanttTask): string {
    switch (task.priority) {
      case 'urgent':
        return '#dc2626'; // 深红色
      case 'high':
        return '#ea580c'; // 深橙色
      case 'medium':
        return '#059669'; // 深绿色
      case 'low':
      default:
        return '#4b5563'; // 深灰色
    }
  }

  /**
   * 精确计算任务开始位置，确保与时间轴单位边界对齐
   */
  private calculateTaskPosition(taskStart: Date, timeline: TimelineConfig, totalWidth: number): number {
    // 生成与时间轴显示完全一致的单位边界
    const timelineUnits = this.generateTimelineUnits(timeline);
    
    console.log('🔍 [任务位置计算] 开始计算任务位置:', {
      taskStartDate: taskStart.toLocaleDateString('zh-CN'),
      taskStartTime: taskStart.getTime(),
      timelineUnit: timeline.unit,
      totalUnits: timelineUnits.length
    });
    
    // 查找任务开始时间所在的时间单位
    let accumulatedWidth = 0;
    for (let i = 0; i < timelineUnits.length; i++) {
      const unit = timelineUnits[i];
      const unitStartDate = unit.date;
      
      // 计算当前单位的结束时间
      let unitEndDate: Date;
      if (i < timelineUnits.length - 1) {
        unitEndDate = timelineUnits[i + 1].date;
      } else {
        // 最后一个单位，根据单位类型计算结束时间
        unitEndDate = new Date(unitStartDate);
        switch (timeline.unit) {
          case 'day':
            unitEndDate.setDate(unitStartDate.getDate() + 1);
            break;
          case 'week':
            unitEndDate.setDate(unitStartDate.getDate() + 7);
            break;
          case 'month':
            unitEndDate.setMonth(unitStartDate.getMonth() + 1);
            break;
          default:
            unitEndDate.setDate(unitStartDate.getDate() + 1);
        }
      }
      
      console.log(`🔍 [单位${i}] 检查单位:`, {
        unitLabel: unit.label,
        unitStart: unitStartDate.toLocaleDateString('zh-CN'),
        unitEnd: unitEndDate.toLocaleDateString('zh-CN'),
        accumulatedWidth: Math.round(accumulatedWidth),
        taskInRange: taskStart >= unitStartDate && taskStart < unitEndDate
      });
      
      // 检查任务开始时间是否在当前单位范围内
      if (taskStart >= unitStartDate && taskStart < unitEndDate) {
        // 在单位内计算精确位置
        const unitSpan = unitEndDate.getTime() - unitStartDate.getTime();
        const taskOffsetInUnit = taskStart.getTime() - unitStartDate.getTime();
        const relativePosition = taskOffsetInUnit / unitSpan;
        
        const finalPosition = accumulatedWidth + (relativePosition * unit.width);
        
        console.log('🎯 [任务位置计算] 找到匹配单位:', {
          匹配单位: unit.label,
          单位开始: unitStartDate.toLocaleDateString('zh-CN'),
          单位结束: unitEndDate.toLocaleDateString('zh-CN'),
          任务在单位内偏移: `${Math.round(taskOffsetInUnit / (24*60*60*1000) * 10) / 10}天`,
          相对位置: Math.round(relativePosition * 100) / 100,
          累计宽度: Math.round(accumulatedWidth),
          单位宽度: unit.width,
          最终位置: Math.round(finalPosition)
        });
        
        return finalPosition;
      }
      
      accumulatedWidth += unit.width;
    }
    
    // 如果任务在所有单位范围外，使用线性计算作为后备
    const timelineStart = new Date(timeline.startDate);
    const timelineEnd = new Date(timeline.endDate);
    const timelineSpan = timelineEnd.getTime() - timelineStart.getTime();
    const taskStartOffset = Math.max(0, taskStart.getTime() - timelineStart.getTime());
    const fallbackPosition = (taskStartOffset / timelineSpan) * totalWidth;
    
    console.log('⚠️ [任务位置计算] 使用后备线性计算:', {
      taskStartDate: taskStart.toLocaleDateString('zh-CN'),
      timelineStart: timelineStart.toLocaleDateString('zh-CN'),
      timelineEnd: timelineEnd.toLocaleDateString('zh-CN'),
      fallbackPosition: Math.round(fallbackPosition)
    });
    
    return fallbackPosition;
  }
  
  /**
   * 精确计算任务宽度，确保与时间轴单位边界对齐
   */
  private calculateTaskWidth(taskStart: Date, taskEnd: Date, timeline: TimelineConfig, totalWidth: number): number {
    const timelineStart = new Date(timeline.startDate);
    const timelineEnd = new Date(timeline.endDate);
    
    // 限制任务时间在时间轴范围内
    const effectiveStart = new Date(Math.max(taskStart.getTime(), timelineStart.getTime()));
    const effectiveEnd = new Date(Math.min(taskEnd.getTime(), timelineEnd.getTime()));
    
    // 如果任务完全在时间轴范围外，返回最小宽度
    if (effectiveStart >= effectiveEnd) {
      return 40;
    }
    
    // 使用相同的单位边界逻辑计算开始和结束位置
    const startPosition = this.calculateTaskPosition(effectiveStart, timeline, totalWidth);
    const endPosition = this.calculateTaskPosition(effectiveEnd, timeline, totalWidth);
    
    // 返回宽度，最小40px保证可见性
    const calculatedWidth = Math.max(40, endPosition - startPosition);
    
    console.log('📏 [任务宽度计算] 基于单位边界:', {
      effectiveStart: effectiveStart.toLocaleDateString('zh-CN'),
      effectiveEnd: effectiveEnd.toLocaleDateString('zh-CN'),
      startPosition: Math.round(startPosition),
      endPosition: Math.round(endPosition),
      calculatedWidth: Math.round(calculatedWidth)
    });
    
    return calculatedWidth;
  }

  /**
   * 调整颜色亮度
   */
  private adjustColorBrightness(hex: string, factor: number): string {
    // 移除 # 号
    hex = hex.replace('#', '');
    
    // 转换为 RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 调整亮度
    const newR = Math.round(Math.min(255, Math.max(0, r + (255 - r) * factor)));
    const newG = Math.round(Math.min(255, Math.max(0, g + (255 - g) * factor)));
    const newB = Math.round(Math.min(255, Math.max(0, b + (255 - b) * factor)));
    
    // 转换回十六进制
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * 获取状态显示名称
   */
  private getStatusDisplayName(status: GanttTask['status']): string {
    switch (status) {
      case 'not_started': return '未开始';
      case 'in_progress': return '进行中';
      case 'completed': return '已完成';
      case 'paused': return '已暂停';
      default: return '未知';
    }
  }

  /**
   * 获取优先级显示名称
   */
  private getPriorityDisplayName(priority: GanttTask['priority']): string {
    switch (priority) {
      case 'low': return '低';
      case 'medium': return '中';
      case 'high': return '高';
      case 'urgent': return '紧急';
      default: return '中';
    }
  }

  /**
   * 生成时间轴单位 - 动态根据用户选择的时间单位显示
   */
  private generateTimelineUnits(timeline: TimelineConfig) {
    const units: Array<{
      date: Date;
      label: string;
      width: number;
      isToday: boolean;
      tooltip: string;
    }> = [];

    const startDate = new Date(timeline.startDate);
    const endDate = new Date(timeline.endDate);
    const unitWidth = timeline.unitWidth || 120; // 增加默认宽度以适应周显示
    
    let current = new Date(startDate);
    const today = new Date();

    // 根据用户选择的时间单位生成时间轴（动态切换）
    while (current <= endDate) {
      let label: string;
      let nextDate: Date;
      let isToday = false;
      let unitDate: Date; // 单位的实际日期

      switch (timeline.unit) {
        case 'day':
          label = current.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
          nextDate = new Date(current);
          nextDate.setDate(current.getDate() + 1);
          isToday = this.isSameDay(current, today);
          unitDate = new Date(current);
          break;
        case 'week':
          // 获取周的开始日期（周一）- 按周显示模式
          const weekStart = this.getWeekStart(current);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          // 周显示格式：月日-日 (例如: 1月15-21日)
          const startMonth = weekStart.getMonth() + 1;
          const endMonth = weekEnd.getMonth() + 1;
          
          if (startMonth === endMonth) {
            // 同一个月
            label = `${startMonth}月${weekStart.getDate()}-${weekEnd.getDate()}日`;
          } else {
            // 跨月
            label = `${startMonth}月${weekStart.getDate()}日-${endMonth}月${weekEnd.getDate()}日`;
          }
          
          nextDate = new Date(weekStart);
          nextDate.setDate(weekStart.getDate() + 7);
          
          // 检查今天是否在这一周内
          isToday = today >= weekStart && today <= weekEnd;
          unitDate = new Date(weekStart); // 使用周开始日期
          current = nextDate; // 移到下一周开始
          break;
        case 'month':
          label = current.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
          nextDate = new Date(current);
          nextDate.setMonth(current.getMonth() + 1);
          nextDate.setDate(1); // 月初
          
          // 检查今天是否在这个月内
          isToday = today.getFullYear() === current.getFullYear() && 
                   today.getMonth() === current.getMonth();
          unitDate = new Date(current);
          break;
        default:
          // 默认按天显示
          label = current.toLocaleDateString('zh-CN');
          nextDate = new Date(current);
          nextDate.setDate(current.getDate() + 1);
          isToday = this.isSameDay(current, today);
          unitDate = new Date(current);
      }

      units.push({
        date: unitDate,
        label,
        width: unitWidth,
        isToday,
        tooltip: unitDate.toLocaleDateString('zh-CN', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          weekday: 'long'
        })
      });

      // 对于非周模式，移动到下一个单位
      if (timeline.unit !== 'week') {
        current = nextDate;
      }
    }

    console.log('🗺️ [GanttView] 生成时间轴单位:', {
      unit: timeline.unit,
      totalUnits: units.length,
      totalWidth: units.reduce((sum, u) => sum + u.width, 0),
      firstUnit: units[0]?.label + ' (' + units[0]?.date.toLocaleDateString('zh-CN') + ')',
      lastUnit: units[units.length - 1]?.label + ' (' + units[units.length - 1]?.date.toLocaleDateString('zh-CN') + ')',
      todayUnits: units.filter(u => u.isToday).length,
      allUnits: units.map(u => ({ 
        label: u.label, 
        date: u.date.toLocaleDateString('zh-CN'),
        isToday: u.isToday 
      }))
    });

    return units;
  }

  /**
   * 获取周的开始日期（周一）
   */
  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // 调整为周一开始
    return new Date(d.setDate(diff));
  }

  /**
   * 计算今天线的位置
   */
  private calculateTodayPosition(timeline: TimelineConfig, totalWidth: number): number {
    const startDate = new Date(timeline.startDate);
    const endDate = new Date(timeline.endDate);
    const today = new Date();
    
    // 如果今天不在时间轴范围内，返回-1表示不显示
    if (today < startDate || today > endDate) {
      return -1;
    }
    
    const timelineSpan = endDate.getTime() - startDate.getTime();
    const todayOffset = today.getTime() - startDate.getTime();
    
    return (todayOffset / timelineSpan) * totalWidth;
  }

  /**
   * 处理任务名称更改
   */
  private handleTaskNameChange = (task: GanttTask, event: Event) => {
    const input = event.target as HTMLInputElement;
    const newName = input.value.trim();
    
    if (newName && newName !== task.name) {
      console.log('📝 [GanttView] Updating task name:', task.id, newName);
      
      // 找到标题属性并更新
      const properties = this.view?.properties$?.value || [];
      const titleProperty = properties.find(
        p => this.view.dataSource.propertyTypeGet(p.id) === 'title'
      );
      
      if (titleProperty) {
        try {
          this.view.dataSource.cellValueChange(task.id, titleProperty.id, newName);
          console.log('✅ [GanttView] Task name updated successfully');
        } catch (error) {
          console.error('❌ [GanttView] Error updating task name:', error);
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
    console.log('🚚 [GanttView] 任务拖拽开始（使用当前时间轴）:', task.name, event.button);
    
    event.preventDefault();
    event.stopPropagation();
    
    const timeline = this.view?.timeline$?.value;
    if (!timeline) {
      console.log('❌ No timeline available');
      return;
    }
    
    // 使用当前的时间轴配置，不再强制周显示
    const timelineUnits = this.generateTimelineUnits(timeline);
    const totalWidth = timelineUnits.reduce((sum, unit) => sum + unit.width, 0);
    
    console.log('📊 [修复] 时间轴信息（使用当前单位）:', { 
      unit: timeline.unit,
      totalWidth, 
      units: timelineUnits.length,
      修复说明: '使用用户选择的时间单位而不是强制周显示'
    });
    
    // 获取当前点击的元素
    const targetElement = event.currentTarget as HTMLElement;
    console.log('🎯 Target element:', targetElement, targetElement.dataset.taskId);
    
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
    
    console.log('✅ [修复] 拖拽状态设置（时间轴一致性）:', {
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
    
    console.log('🎯 [修复] 拖拽监听器已添加，使用当前时间轴配置');
  };

  /**
   * 处理任务条开始时间拖拽 - 使用当前时间轴配置
   */
  private handleTaskResizeStartDrag = (task: GanttTask, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    console.log('🔧 [GanttView] Task resize start drag (使用当前时间轴):', task.name);
    
    const timeline = this.view?.timeline$?.value;
    if (!timeline) return;
    
    // 使用当前的时间轴配置，不再强制周显示
    const timelineUnits = this.generateTimelineUnits(timeline);
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
    
    console.log('✅ [修复] 左侧调整手柄拖拽设置（使用当前时间轴）:', {
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
    console.log('🔧 [GanttView] Task resize end drag (使用当前时间轴):', task.name);
    
    const timeline = this.view?.timeline$?.value;
    if (!timeline) return;
    
    // 使用当前的时间轴配置，不再强制周显示
    const timelineUnits = this.generateTimelineUnits(timeline);
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
    
    console.log('✅ [修复] 右侧调整手柄拖拽设置（使用当前时间轴）:', {
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
      console.log('⚠️ No drag state available');
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
        
        console.log('🔧 [调整开始时间]:', {
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
        
        console.log('🔧 [调整结束时间]:', {
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
        
        console.log('🚚 [移动任务]:', {
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
      
      console.log('✅ [更新元素位置]:', { 
        操作类型: dragType,
        拖拽像素: deltaX,
        left: `${Math.round(left)}px`, 
        width: `${Math.round(width)}px`,
        时间偏移天数: Math.round(baseTimeOffset / (24 * 60 * 60 * 1000) * 10) / 10
      });
    } else {
      console.log('⚠️ Element reference lost or removed from DOM');
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
      console.log('⚠️ No drag state to end');
      return;
    }
    
    event.preventDefault();
    console.log('🏁 [GanttView] 任务拖拽结束（支持调整大小）');
    
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
    
    console.log('💾 [GanttView] 拖拽结束，保存调整后的时间:', {
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
      const timelineUnits = currentTimeline ? this.generateTimelineUnits(currentTimeline) : [];
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
      
      console.log('🔒 [GanttView] 锁定调整后的最终位置:', {
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
          console.log('🔓 [GanttView] 解除位置锁定，调整大小数据保存完成');
        }
      }, 100);
    }, 0);
    
    console.log('✅ [GanttView] 任务调整完成（支持调整大小）');
  };

  /**
   * 实时更新任务条的视觉位置（拖拽过程中） - 修复元素查找
   */
  private updateTaskBarPosition(taskId: string, newStartDate: number, newEndDate: number) {
    // 找到对应的任务条元素 - 使用更精确的选择器
    const taskBarElement = this.querySelector(`.task-bar[data-task-id="${taskId}"]`) as HTMLElement;
    
    if (!taskBarElement) {
      console.log('⚠️ Task bar element not found:', taskId);
      // 尝试通过任务名称查找
      const allTaskBars = this.querySelectorAll('.task-bar');
      console.log('🔍 Available task bars:', Array.from(allTaskBars).map(el => (el as HTMLElement).dataset.taskId));
      return;
    }
    
    const timeline = this.view?.timeline$?.value;
    if (!timeline) return;
    
    // 重新计算位置 - 使用当前时间轴配置
    const timelineStart = new Date(timeline.startDate);
    const timelineEnd = new Date(timeline.endDate);
    const timelineSpan = timelineEnd.getTime() - timelineStart.getTime();
    
    // 使用当前时间轴配置生成时间单位，不强制周显示
    const timelineUnits = this.generateTimelineUnits(timeline);
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
    
    console.log('✅ Updated visual position successfully:', { 
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
      console.log('💾 [GanttView] 开始更新任务日期范围（修复时序）:', {
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
        console.error('❌ [GanttView] 找不到日期范围属性，无法保存拖拽位置');
        return;
      }
      
      console.log('🏷️ [GanttView] 找到日期范围属性:', dateRangeProperty.id);
      
      // 直接同步保存数据，不使用setTimeout避免时序问题
      const dateRangeData = {
        startDate,
        endDate,
        workingDays
      };
      
      console.log('📤 [GanttView] 直接同步保存数据（避免时序问题）:', dateRangeData);
      
      // 使用直接格式保存，这个格式在读取时兼容性最好
      this.view.dataSource.cellValueChange(taskId, dateRangeProperty.id, dateRangeData);
      
      // 立即验证是否保存成功
      const verifyData = this.view.dataSource.cellValueGet(taskId, dateRangeProperty.id);
      console.log('🔍 [GanttView] 立即验证保存结果:', verifyData);
      
      if (verifyData && verifyData.startDate && verifyData.endDate) {
        console.log('✅ [GanttView] 数据同步保存成功:', {
          startDate: new Date(verifyData.startDate).toLocaleDateString('zh-CN'),
          endDate: new Date(verifyData.endDate).toLocaleDateString('zh-CN'),
          workingDays: verifyData.workingDays
        });
      } else {
        console.warn('⚠️ [GanttView] 数据保存验证失败，尝试嵌套格式');
        
        // 如果直接格式失败，尝试嵌套格式
        const nestedData = {
          value: {
            startDate,
            endDate,
            workingDays
          }
        };
        
        this.view.dataSource.cellValueChange(taskId, dateRangeProperty.id, nestedData);
        console.log('📤 [GanttView] 尝试嵌套格式保存:', nestedData);
      }
      
      // 延迟很短时间再触发更新，确保数据已写入
      setTimeout(() => {
        this.forceTasksDataUpdate();
      }, 10); // 只延迟10ms，最小化时序问题
      
    } catch (error) {
      console.error('❌ [GanttView] 更新任务日期范围时发生错误:', error);
    }
  }
  
  /**
   * 强制触发任务数据更新 - 优化版本，减少震动
   */
  private forceTasksDataUpdate() {
    console.log('🔄 [GanttView] 优化强制触发任务数据更新（减少震动）...');
    
    // 1. 更新强制刷新标志
    this._forceRefresh = Date.now() + Math.random();
    
    // 2. 强制访问所有相关的signals触发重新计算
    if (this.view) {
      const rows = this.view.rows$?.value;
      const properties = this.view.properties$?.value;
      const dataSourceRows = this.view.dataSource.rows$.value;
      
      console.log('📊 [GanttView] 优化强制访问信号:', {
        rowsCount: rows?.length,
        propertiesCount: properties?.length,
        dataSourceRowsCount: dataSourceRows?.length,
        forceRefreshValue: this._forceRefresh
      });
    }
    
    // 3. 触发computed重新计算
    const updatedTasks = this.tasks$.value;
    console.log('🎯 [GanttView] 优化强制重新计算任务数量:', updatedTasks.length);
    
    // 4. 只进行一次重新渲染，避免多次渲染造成震动
    this.requestUpdate();
    
    console.log('✅ [GanttView] 优化数据更新完成，避免多次渲染震动');
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
  private isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  /**
   * 获取周数
   */
  private getWeekNumber(date: Date): number {
    const start = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + start.getDay() + 1) / 7);
  }

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
        
        <div style="margin-top: 16px; padding: 12px; background: var(--affine-background-warning-color); border-radius: 6px; color: var(--affine-text-primary-color); font-size: 13px;">
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
    
    console.log('🎨 [GanttView] Render called with refresh flag:', forceRefreshFlag);
    console.log('🔄 [GanttView] View data signal:', viewDataSignal ? 'available' : 'null');
    console.log('📊 [GanttView] Rows signal:', rowsSignal?.length || 0);
    console.log('🏷️ [GanttView] Properties signal:', propertiesSignal?.length || 0);

    const tasks = this.tasks$.value;
    
    console.log('🎯 [GanttView] Rendering with tasks count:', tasks.length);

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
    console.log('🔗 [GanttView] Connected callback called');
    console.log('📊 [GanttView] View prop:', this.view);
    console.log('🔒 [GanttView] Readonly prop:', this.readonly);
  }

  /**
   * 属性更新时的回调
   */
  override willUpdate(changedProperties: Map<string, unknown>) {
    super.willUpdate(changedProperties);
    console.log('🔄 [GanttView] Will update called with changes:', changedProperties);
    if (changedProperties.has('view')) {
      console.log('👁️ [GanttView] View changed to:', this.view);
    }
  }

  /**
   * 移除滚动同步功能 - 恢复简单独立滚动
   */
  private syncScroll() {
    console.log('🔄 [GanttView] 使用独立滚动，无需同步功能');
    // 不需要复杂的滚动同步，每个区域独立滚动即可
  }
  
  // 存储当前的滚动处理器，用于清理
  private _currentScrollHandler?: () => void;
  private _currentTaskListScrollHandler?: () => void;

  override firstUpdated() {
    console.log('🎯 [GanttView] First updated - setting up scroll sync');
    // 延迟一点确保DOM完全渲染
    setTimeout(() => {
      this.syncScroll();
    }, 100);
  }
  
  override updated(changedProperties: Map<string, unknown>) {
    super.updated(changedProperties);
    
    // 每次更新后重新设置滚动同步，确保DOM更新后同步功能正常
    if (changedProperties.has('view') || changedProperties.has('_forceRefresh')) {
      console.log('🔄 [GanttView] View updated - re-syncing scroll');
      setTimeout(() => {
        this.syncScroll();
      }, 100); // 增加延迟确保DOM完全更新
    }
  }
}