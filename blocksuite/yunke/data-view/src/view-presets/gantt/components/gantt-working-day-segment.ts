import { css, html, LitElement } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { classMap } from 'lit/directives/class-map.js';
import { styleMap } from 'lit/directives/style-map.js';
import { format } from 'date-fns/format';
import { addDays } from 'date-fns';

/**
 * 任务段数据结构
 */
export interface TaskSegment {
  id: string;
  startDate: number;
  endDate: number;
  isWorkingDay: boolean;
  width: number;
  left: number;
  label?: string;
}

/**
 * 任务数据结构
 */
export interface GanttTask {
  id: string;
  name: string;
  startDate: number;
  endDate: number;
  workingDays: number[];
  progress: number;
  color: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not_started' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
}

/**
 * 工作日段组件 - 核心功能组件
 * 实现非连续工作日可视化：工作日实心显示，非工作日虚线连接
 */
@customElement('gantt-working-day-segment')
export class GanttWorkingDaySegment extends LitElement {
  static override styles = css`
    :host {
      display: block;
      position: relative;
      height: var(--gantt-task-bar-height, 24px);
      margin: var(--gantt-task-bar-margin, 2px) 0;
    }

    .segment {
      position: absolute;
      height: 100%;
      top: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 500;
      border-radius: var(--gantt-task-bar-radius, 4px);
      transition: all 0.2s ease;
      cursor: pointer;
      user-select: none;
    }

    /* 工作日段样式 - 实心显示 */
    .segment.working-day {
      background-color: var(--task-color);
      color: var(--task-text-color, white);
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
      opacity: 1;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    /* 非工作日段样式 - 虚线连接 */
    .segment.non-working-day {
      background: transparent;
      border: 2px dashed var(--task-color);
      color: var(--task-color);
      opacity: 0.4;
      height: 6px;
      top: 50%;
      transform: translateY(-50%);
      border-radius: 0;
      font-size: 0; /* 隐藏文字 */
    }

    /* 悬停效果 */
    .segment:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      z-index: 10;
    }

    .segment.non-working-day:hover {
      transform: translateY(-50%) translateY(-1px);
      opacity: 0.6;
    }

    /* 选中状态 */
    .segment.selected {
      box-shadow: 0 0 0 2px var(--yunke-primary-color);
      z-index: 20;
    }

    /* 拖拽状态 */
    .segment.dragging {
      opacity: 0.8;
      transform: rotate(1deg) scale(1.02);
      z-index: 100;
      cursor: grabbing;
    }

    /* 进度条 */
    .progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.8);
      border-radius: 0 0 var(--gantt-task-bar-radius, 4px) var(--gantt-task-bar-radius, 4px);
      transition: width 0.3s ease;
    }

    /* 任务状态指示器 */
    .status-indicator {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      border: 2px solid white;
    }

    .status-indicator.not-started {
      background: var(--yunke-text-secondary-color);
    }

    .status-indicator.in-progress {
      background: var(--yunke-brand-color);
    }

    .status-indicator.completed {
      background: var(--yunke-success-color);
    }

    .status-indicator.on-hold {
      background: var(--yunke-warning-color);
    }

    .status-indicator.cancelled {
      background: var(--yunke-error-color);
    }

    /* 优先级指示器 */
    .priority-indicator {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 4px;
      height: 4px;
      border-radius: 50%;
    }

    .priority-indicator.critical {
      background: var(--yunke-error-color);
      box-shadow: 0 0 4px var(--yunke-error-color);
    }

    .priority-indicator.high {
      background: var(--yunke-warning-color);
    }

    .priority-indicator.medium {
      background: var(--yunke-brand-color);
    }

    .priority-indicator.low {
      background: var(--yunke-text-secondary-color);
    }

    /* 响应式设计 */
    @media (max-width: 768px) {
      .segment {
        font-size: 10px;
      }
      
      .progress-bar {
        height: 2px;
      }
      
      .status-indicator {
        width: 6px;
        height: 6px;
      }
    }

    /* 高对比度模式 */
    @media (prefers-contrast: high) {
      .segment.working-day {
        border: 2px solid var(--task-color);
      }
      
      .segment.non-working-day {
        border-width: 3px;
      }
    }

    /* 减少动画模式 */
    @media (prefers-reduced-motion: reduce) {
      .segment {
        transition: none;
      }
    }
  `;

  /**
   * 任务段数据
   */
  @property({ attribute: false })
  accessor segment!: TaskSegment;

  /**
   * 任务数据
   */
  @property({ attribute: false })
  accessor task!: GanttTask;

  /**
   * 段索引
   */
  @property({ type: Number })
  accessor index = 0;

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
   * 是否显示进度条
   */
  @property({ type: Boolean })
  accessor showProgress = true;

  /**
   * 是否显示状态指示器
   */
  @property({ type: Boolean })
  accessor showStatus = true;

  /**
   * 是否显示优先级指示器
   */
  @property({ type: Boolean })
  accessor showPriority = false;

  /**
   * 段点击事件
   */
  @property({ attribute: false })
  accessor onSegmentClick?: (segment: TaskSegment, event: MouseEvent) => void;

  /**
   * 段双击事件
   */
  @property({ attribute: false })
  accessor onSegmentDoubleClick?: (segment: TaskSegment, event: MouseEvent) => void;

  /**
   * 段拖拽开始事件
   */
  @property({ attribute: false })
  accessor onDragStart?: (segment: TaskSegment, event: DragEvent) => void;

  /**
   * 段拖拽结束事件
   */
  @property({ attribute: false })
  accessor onDragEnd?: (segment: TaskSegment, event: DragEvent) => void;

  /**
   * 是否正在拖拽
   */
  @state()
  private accessor _isDragging = false;

  /**
   * 获取段的 CSS 类名
   */
  private getSegmentClasses() {
    return classMap({
      segment: true,
      'working-day': this.segment.isWorkingDay,
      'non-working-day': !this.segment.isWorkingDay,
      selected: this.selected,
      dragging: this._isDragging,
    });
  }

  /**
   * 获取段的样式
   */
  private getSegmentStyles() {
    const baseColor = this.task.color || '#6366f1';
    
    return styleMap({
      '--task-color': baseColor,
      '--task-text-color': this.getContrastColor(baseColor),
      left: `${this.segment.left}px`,
      width: `${this.segment.width}px`,
    });
  }

  /**
   * 获取对比色（确保文字可读性）
   */
  private getContrastColor(backgroundColor: string): string {
    // 简化的对比色计算
    // 将十六进制颜色转换为 RGB
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // 计算亮度
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 128 ? '#000000' : '#ffffff';
  }

  /**
   * 获取工具提示文本
   */
  private getTooltipText(): string {
    const { segment, task } = this;
    const startStr = format(segment.startDate, 'yyyy-MM-dd');
    const endStr = format(segment.endDate, 'yyyy-MM-dd');
    
    if (segment.isWorkingDay) {
      let tooltip = `${task.name}\n${startStr}`;
      if (segment.startDate !== segment.endDate) {
        tooltip += ` ~ ${endStr}`;
      }
      tooltip += `\n进度: ${task.progress}%`;
      
      if (this.editable) {
        tooltip += '\n\n点击选择，拖拽调整时间';
      }
      
      return tooltip;
    } else {
      return `非工作日连接\n${startStr} ~ ${endStr}`;
    }
  }

  /**
   * 渲染段内容
   */
  private renderSegmentContent() {
    const { segment, task } = this;
    
    // 非工作日不显示内容
    if (!segment.isWorkingDay) {
      return '';
    }
    
    // 如果宽度太小，不显示文字
    if (segment.width < 60) {
      return '';
    }
    
    // 显示任务名称（仅在第一个段显示）
    if (this.index === 0) {
      return segment.label || task.name;
    }
    
    return '';
  }

  /**
   * 渲染进度条
   */
  private renderProgressBar() {
    if (!this.showProgress || !this.segment.isWorkingDay || this.task.progress === 0) {
      return '';
    }
    
    return html`
      <div 
        class="progress-bar"
        style="width: ${this.task.progress}%"
      ></div>
    `;
  }

  /**
   * 渲染状态指示器
   */
  private renderStatusIndicator() {
    if (!this.showStatus || !this.segment.isWorkingDay || this.index !== 0) {
      return '';
    }
    
    return html`
      <div class="status-indicator ${this.task.status}"></div>
    `;
  }

  /**
   * 渲染优先级指示器
   */
  private renderPriorityIndicator() {
    if (!this.showPriority || !this.segment.isWorkingDay || this.index !== 0) {
      return '';
    }
    
    return html`
      <div class="priority-indicator ${this.task.priority}"></div>
    `;
  }

  /**
   * 处理点击事件
   */
  private handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.onSegmentClick?.(this.segment, event);
  };

  /**
   * 处理双击事件
   */
  private handleDoubleClick = (event: MouseEvent) => {
    event.stopPropagation();
    this.onSegmentDoubleClick?.(this.segment, event);
  };

  /**
   * 处理拖拽开始
   */
  private handleDragStart = (event: DragEvent) => {
    if (!this.editable || !this.segment.isWorkingDay) {
      event.preventDefault();
      return;
    }
    
    this._isDragging = true;
    
    // 设置拖拽数据
    event.dataTransfer!.effectAllowed = 'move';
    event.dataTransfer!.setData('text/gantt-segment', JSON.stringify({
      taskId: this.task.id,
      segmentId: this.segment.id,
      segmentIndex: this.index,
    }));
    
    this.onDragStart?.(this.segment, event);
  };

  /**
   * 处理拖拽结束
   */
  private handleDragEnd = (event: DragEvent) => {
    this._isDragging = false;
    this.onDragEnd?.(this.segment, event);
  };

  /**
   * 处理鼠标按下（为拖拽做准备）
   */
  private handleMouseDown = (event: MouseEvent) => {
    if (!this.editable || !this.segment.isWorkingDay) {
      return;
    }
    
    // 防止文本选择
    event.preventDefault();
  };

  override render() {
    return html`
      <div
        class=${this.getSegmentClasses()}
        style=${this.getSegmentStyles()}
        title=${this.getTooltipText()}
        draggable=${this.editable && this.segment.isWorkingDay}
        @click=${this.handleClick}
        @dblclick=${this.handleDoubleClick}
        @dragstart=${this.handleDragStart}
        @dragend=${this.handleDragEnd}
        @mousedown=${this.handleMouseDown}
      >
        ${this.renderSegmentContent()}
        ${this.renderProgressBar()}
        ${this.renderStatusIndicator()}
        ${this.renderPriorityIndicator()}
      </div>
    `;
  }
}