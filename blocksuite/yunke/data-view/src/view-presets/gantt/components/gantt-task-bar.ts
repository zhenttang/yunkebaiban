import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { 
  type TaskSegment, 
  type GanttTask 
} from './gantt-working-day-segment.js';
import type { TimelineConfig } from '../define.js';

/**
 * 甘特图任务条组件
 * 负责渲染完整的任务条，包含多个工作日段
 */
@customElement('gantt-task-bar')
export class GanttTaskBar extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      height: var(--gantt-task-bar-height, 24px);
      margin: var(--gantt-task-bar-margin, 2px) 0;
      min-height: 20px;
    }

    .task-bar-container {
      position: relative;
      height: 100%;
      width: 100%;
      overflow: visible;
    }

    .task-info-popup {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--affine-tooltip-color);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
      z-index: 1000;
      opacity: 0;
      transform: translateY(4px);
      transition: all 0.2s ease;
      pointer-events: none;
    }

    .task-info-popup.visible {
      opacity: 1;
      transform: translateY(0);
    }

    .task-info-popup::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 12px;
      border: 4px solid transparent;
      border-top-color: var(--affine-tooltip-color);
    }

    .task-drag-preview {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 10000;
      pointer-events: none;
      opacity: 0.8;
      transform: rotate(2deg);
    }

    /* 任务选择框 */
    .task-selection-box {
      position: absolute;
      top: -2px;
      left: -2px;
      right: -2px;
      bottom: -2px;
      border: 2px solid var(--affine-primary-color);
      border-radius: calc(var(--gantt-task-bar-radius, 4px) + 2px);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }

    :host([selected]) .task-selection-box {
      opacity: 1;
    }

    /* 任务连接线（用于显示非工作日连接） */
    .connection-line {
      position: absolute;
      height: 2px;
      background: currentColor;
      opacity: 0.3;
      top: 50%;
      transform: translateY(-50%);
      pointer-events: none;
    }

    /* 无障碍支持 */
    :host {
      outline: none;
    }

    :host(:focus-visible) .task-selection-box {
      opacity: 1;
      border-color: var(--affine-primary-color);
      box-shadow: 0 0 0 2px var(--affine-primary-color-04);
    }
  `;

  /**
   * 任务数据
   */
  @property({ attribute: false })
  accessor task!: GanttTask;

  /**
   * 时间轴配置
   */
  @property({ attribute: false })
  accessor timeline!: TimelineConfig;

  /**
   * 是否选中
   */
  @property({ type: Boolean, reflect: true })
  accessor selected = false;

  /**
   * 是否可编辑
   */
  @property({ type: Boolean })
  accessor editable = true;

  /**
   * 是否显示进度
   */
  @property({ type: Boolean })
  accessor showProgress = true;

  /**
   * 是否显示连接线
   */
  @property({ type: Boolean })
  accessor showConnections = true;

  /**
   * 任务点击事件
   */
  @property({ attribute: false })
  accessor onTaskClick?: (task: GanttTask, event: MouseEvent) => void;

  /**
   * 任务双击事件
   */
  @property({ attribute: false })
  accessor onTaskDoubleClick?: (task: GanttTask, event: MouseEvent) => void;

  /**
   * 任务拖拽事件
   */
  @property({ attribute: false })
  accessor onTaskDrag?: (task: GanttTask, deltaX: number, event: MouseEvent) => void;

  /**
   * 段选择事件
   */
  @property({ attribute: false })
  accessor onSegmentSelect?: (task: GanttTask, segment: TaskSegment, event: MouseEvent) => void;

  /**
   * 悬停的段ID
   */
  @state()
  private accessor _hoveredSegmentId: string | null = null;

  /**
   * 是否显示信息弹窗
   */
  @state()
  private accessor _showInfoPopup = false;

  /**
   * 计算任务段
   */
  private calculateTaskSegments(): TaskSegment[] {
    const { task, timeline } = this;
    const segments: TaskSegment[] = [];
    
    if (!task.workingDays || task.workingDays.length === 0) {
      // 传统连续模式
      return [{
        id: `${task.id}-continuous`,
        startDate: task.startDate,
        endDate: task.endDate,
        isWorkingDay: true,
        width: this.calculateWidth(task.startDate, task.endDate),
        left: this.dateToPosition(task.startDate),
        label: task.name,
      }];
    }

    // 非连续工作日模式 - 核心算法
    let current = new Date(task.startDate);
    const end = new Date(task.endDate);
    let segmentIndex = 0;

    while (current <= end) {
      const dayOfWeek = current.getDay();
      const isWorkingDay = task.workingDays.includes(dayOfWeek);

      if (isWorkingDay) {
        // 查找连续的工作日段
        const segmentStart = new Date(current);
        while (current <= end && task.workingDays.includes(current.getDay())) {
          current.setDate(current.getDate() + 1);
        }
        const segmentEnd = new Date(current);
        segmentEnd.setDate(segmentEnd.getDate() - 1);

        const startTime = segmentStart.getTime();
        const endTime = segmentEnd.getTime() + 24 * 60 * 60 * 1000; // 包含结束日

        segments.push({
          id: `${task.id}-working-${segmentIndex}`,
          startDate: startTime,
          endDate: endTime,
          isWorkingDay: true,
          width: this.calculateWidth(startTime, endTime),
          left: this.dateToPosition(startTime),
          label: segmentIndex === 0 ? task.name : '', // 只在第一个段显示名称
        });

        segmentIndex++;
      } else {
        // 非工作日，创建连接线段
        const nonWorkingStart = new Date(current);
        while (current <= end && !task.workingDays.includes(current.getDay())) {
          current.setDate(current.getDate() + 1);
        }
        const nonWorkingEnd = new Date(current);
        nonWorkingEnd.setDate(nonWorkingEnd.getDate() - 1);

        // 只有在前面有工作日时才添加连接段
        if (segments.length > 0) {
          const startTime = nonWorkingStart.getTime();
          const endTime = nonWorkingEnd.getTime() + 24 * 60 * 60 * 1000;

          segments.push({
            id: `${task.id}-connection-${segmentIndex}`,
            startDate: startTime,
            endDate: endTime,
            isWorkingDay: false,
            width: this.calculateWidth(startTime, endTime),
            left: this.dateToPosition(startTime),
          });

          segmentIndex++;
        }
      }
    }

    return segments;
  }

  /**
   * 根据日期计算位置
   */
  private dateToPosition(date: number): number {
    const { timeline } = this;
    const startTime = timeline.startDate;
    const unitWidth = timeline.unitWidth || 60;
    
    // 根据时间单位计算位置
    switch (timeline.unit) {
      case 'day':
        return ((date - startTime) / (24 * 60 * 60 * 1000)) * unitWidth;
      case 'week':
        return ((date - startTime) / (7 * 24 * 60 * 60 * 1000)) * unitWidth;
      case 'month':
        // 简化月份计算
        return ((date - startTime) / (30 * 24 * 60 * 60 * 1000)) * unitWidth;
      default:
        return 0;
    }
  }

  /**
   * 计算宽度
   */
  private calculateWidth(startDate: number, endDate: number): number {
    const duration = endDate - startDate;
    const { timeline } = this;
    const unitWidth = timeline.unitWidth || 60;
    
    switch (timeline.unit) {
      case 'day':
        return Math.max((duration / (24 * 60 * 60 * 1000)) * unitWidth, 8);
      case 'week':
        return Math.max((duration / (7 * 24 * 60 * 60 * 1000)) * unitWidth, 8);
      case 'month':
        return Math.max((duration / (30 * 24 * 60 * 60 * 1000)) * unitWidth, 8);
      default:
        return 8;
    }
  }

  /**
   * 处理段点击
   */
  private handleSegmentClick = (segment: TaskSegment, event: MouseEvent) => {
    event.stopPropagation();
    this.onSegmentSelect?.(this.task, segment, event);
    
    // 如果点击的是工作日段，也触发任务点击
    if (segment.isWorkingDay) {
      this.onTaskClick?.(this.task, event);
    }
  };

  /**
   * 处理段双击
   */
  private handleSegmentDoubleClick = (segment: TaskSegment, event: MouseEvent) => {
    event.stopPropagation();
    this.onTaskDoubleClick?.(this.task, event);
  };

  /**
   * 处理拖拽开始
   */
  private handleDragStart = (segment: TaskSegment, event: DragEvent) => {
    // 存储拖拽起始信息
    this.dispatchEvent(new CustomEvent('task-drag-start', {
      detail: { task: this.task, segment, event },
      bubbles: true,
      composed: true,
    }));
  };

  /**
   * 处理拖拽结束
   */
  private handleDragEnd = (segment: TaskSegment, event: DragEvent) => {
    this.dispatchEvent(new CustomEvent('task-drag-end', {
      detail: { task: this.task, segment, event },
      bubbles: true,
      composed: true,
    }));
  };

  /**
   * 处理鼠标进入
   */
  private handleMouseEnter = () => {
    this._showInfoPopup = true;
  };

  /**
   * 处理鼠标离开
   */
  private handleMouseLeave = () => {
    this._showInfoPopup = false;
    this._hoveredSegmentId = null;
  };

  /**
   * 获取任务信息文本
   */
  private getTaskInfoText(): string {
    const { task } = this;
    const startStr = new Date(task.startDate).toLocaleDateString('zh-CN');
    const endStr = new Date(task.endDate).toLocaleDateString('zh-CN');
    const duration = Math.ceil((task.endDate - task.startDate) / (24 * 60 * 60 * 1000));
    
    return `${task.name} | ${startStr} ~ ${endStr} | ${duration}天 | ${task.progress}%`;
  }

  /**
   * 渲染连接线
   */
  private renderConnectionLines(segments: TaskSegment[]) {
    if (!this.showConnections) return '';

    const lines = [];
    for (let i = 0; i < segments.length - 1; i++) {
      const current = segments[i];
      const next = segments[i + 1];
      
      // 在工作日段和非工作日段之间添加连接线
      if (current.isWorkingDay && !next.isWorkingDay) {
        const startX = current.left + current.width;
        const endX = next.left;
        const width = endX - startX;
        
        if (width > 0) {
          lines.push(html`
            <div 
              class="connection-line"
              style="left: ${startX}px; width: ${width}px; color: ${this.task.color}"
            ></div>
          `);
        }
      }
    }
    
    return lines;
  }

  override render() {
    if (!this.task || !this.timeline) {
      return html`<div class="task-bar-container"></div>`;
    }

    const segments = this.calculateTaskSegments();

    return html`
      <div 
        class="task-bar-container"
        @mouseenter=${this.handleMouseEnter}
        @mouseleave=${this.handleMouseLeave}
        tabindex=${this.editable ? '0' : '-1'}
      >
        <!-- 任务选择框 -->
        <div class="task-selection-box"></div>

        <!-- 连接线 -->
        ${this.renderConnectionLines(segments)}

        <!-- 任务段 -->
        ${repeat(
          segments,
          segment => segment.id,
          (segment, index) => html`
            <gantt-working-day-segment
              .segment=${segment}
              .task=${this.task}
              .index=${index}
              .selected=${this._hoveredSegmentId === segment.id}
              .editable=${this.editable}
              .showProgress=${this.showProgress}
              .showStatus=${index === 0} 
              .showPriority=${index === 0}
              .onSegmentClick=${this.handleSegmentClick}
              .onSegmentDoubleClick=${this.handleSegmentDoubleClick}
              .onDragStart=${this.handleDragStart}
              .onDragEnd=${this.handleDragEnd}
            ></gantt-working-day-segment>
          `
        )}

        <!-- 信息弹窗 -->
        <div class="task-info-popup ${this._showInfoPopup ? 'visible' : ''}">
          ${this.getTaskInfoText()}
        </div>
      </div>
    `;
  }

  /**
   * 获取任务的总宽度
   */
  getTaskWidth(): number {
    const segments = this.calculateTaskSegments();
    if (segments.length === 0) return 0;
    
    const lastSegment = segments[segments.length - 1];
    return lastSegment.left + lastSegment.width;
  }

  /**
   * 获取任务的起始位置
   */
  getTaskPosition(): number {
    const segments = this.calculateTaskSegments();
    return segments.length > 0 ? segments[0].left : 0;
  }

  /**
   * 高亮指定的段
   */
  highlightSegment(segmentId: string) {
    this._hoveredSegmentId = segmentId;
  }

  /**
   * 清除高亮
   */
  clearHighlight() {
    this._hoveredSegmentId = null;
  }
}